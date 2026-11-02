import { checkImageDimensions, validateImage } from "@/lib/files/validate";
import { baseName, clamp, outputName } from "@/lib/files/format";

export type ImageFormat = "png" | "jpg" | "webp";

export interface LoadedImage {
  file: File;
  image: HTMLImageElement;
  objectUrl: string;
  width: number;
  height: number;
  format: ImageFormat;
}

export interface ImageOutput {
  blob: Blob;
  width: number;
  height: number;
  fileName: string;
  mime: string;
  format: ImageFormat;
  quality?: number;
  targetReached?: boolean;
  keptOriginal?: boolean;
}

export interface ImageJobInput {
  file: File;
  image: LoadedImage;
}

export class CancelledError extends Error {
  constructor() {
    super("Cancelled");
    this.name = "AbortError";
  }
}

export function formatToMime(format: ImageFormat): string {
  if (format === "jpg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  return "image/png";
}

export function fileFormat(file: File): ImageFormat {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg" || file.type === "image/jpeg") return "jpg";
  if (ext === "webp" || file.type === "image/webp") return "webp";
  return "png";
}

export function mergeSignals(...signals: Array<AbortSignal | undefined>): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (!signal) continue;
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}

export async function loadImage(file: File, signal?: AbortSignal): Promise<LoadedImage> {
  const validation = await validateImage(file);
  if (!validation.ok) throw new Error(validation.error);
  if (signal?.aborted) throw new CancelledError();

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.src = objectUrl;
  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new Error("This image could not be decoded in this browser.");
  }

  const dimensionError = checkImageDimensions(image.naturalWidth, image.naturalHeight);
  if (dimensionError) {
    URL.revokeObjectURL(objectUrl);
    throw new Error(dimensionError);
  }

  return {
    file,
    image,
    objectUrl,
    width: image.naturalWidth,
    height: image.naturalHeight,
    format: fileFormat(file),
  };
}

export function releaseImage(image: LoadedImage | null | undefined): void {
  if (image?.objectUrl) URL.revokeObjectURL(image.objectUrl);
}

export function fitWithin(width: number, height: number, maxWidth: number, maxHeight: number) {
  if (maxWidth <= 0 && maxHeight <= 0) return { width, height };
  let ratio = 1;
  if (maxWidth > 0) ratio = Math.min(ratio, maxWidth / width);
  if (maxHeight > 0) ratio = Math.min(ratio, maxHeight / height);
  ratio = Math.min(ratio, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export interface DrawOptions {
  width: number;
  height: number;
  fit?: "stretch" | "contain" | "cover";
  background?: string;
  quality?: number;
}

export function drawImage(
  source: HTMLImageElement,
  options: DrawOptions,
): HTMLCanvasElement {
  const width = Math.max(1, Math.round(options.width));
  const height = Math.max(1, Math.round(options.height));
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const fit = options.fit ?? "stretch";
  const background = options.background ?? "#FFFFFF";

  if (fit !== "stretch" || background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }

  const sourceRatio = source.naturalWidth / source.naturalHeight;
  const targetRatio = width / height;

  if (fit === "contain") {
    let drawWidth = width;
    let drawHeight = height;
    if (sourceRatio > targetRatio) drawHeight = width / sourceRatio;
    else drawWidth = height * sourceRatio;
    ctx.drawImage(
      source,
      (width - drawWidth) / 2,
      (height - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
  } else if (fit === "cover") {
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = source.naturalWidth;
    let sourceHeight = source.naturalHeight;
    if (sourceRatio > targetRatio) {
      sourceWidth = source.naturalHeight * targetRatio;
      sourceX = (source.naturalWidth - sourceWidth) / 2;
    } else {
      sourceHeight = source.naturalWidth / targetRatio;
      sourceY = (source.naturalHeight - sourceHeight) / 2;
    }
    ctx.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
  } else {
    ctx.drawImage(source, 0, 0, width, height);
  }
  return canvas;
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality = 0.8,
): Promise<Blob> {
  const mime = formatToMime(format);
  const q = format === "png" ? undefined : clamp(quality, 0.01, 1);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), mime, q);
  });
  if (!blob) throw new Error("The browser could not encode this image.");
  if (blob.type !== mime && format !== "jpg") {
    // Some browsers silently fall back to PNG. Reject rather than mislabel the file.
    throw new Error(`This browser could not encode ${format.toUpperCase()} images.`);
  }
  return blob;
}

export interface ConvertOptions {
  format: ImageFormat;
  quality: number;
  background: string;
}

export async function convertImage(
  input: LoadedImage,
  options: ConvertOptions,
  signal?: AbortSignal,
): Promise<ImageOutput> {
  if (signal?.aborted) throw new CancelledError();
  const canvas = drawImage(input.image, {
    width: input.width,
    height: input.height,
    fit: "stretch",
    background: options.format === "jpg" ? options.background : "#00000000",
  });
  if (options.format === "jpg") {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = options.background || "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    }
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const blob = await canvasToBlob(canvas, options.format, options.quality / 100);
  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    fileName: `${baseName(input.file.name)}-converted.${options.format}`,
    mime: formatToMime(options.format),
    format: options.format,
    quality: options.quality,
  };
}

export interface CompressOptions {
  mode: "quality" | "target";
  quality: number;
  targetBytes: number;
  format: "auto" | ImageFormat;
  maxWidth: number;
  maxHeight: number;
  signal?: AbortSignal;
  onStage?: (stage: string) => void;
}

export interface CompressionResult extends ImageOutput {
  originalSize: number;
  outputSize: number;
  attempts?: number;
}

async function encodeAt(
  image: HTMLImageElement,
  width: number,
  height: number,
  format: ImageFormat,
  quality: number,
  background: string,
): Promise<Blob> {
  const canvas = drawImage(image, { width, height, fit: "stretch", background });
  return canvasToBlob(canvas, format, quality);
}

export async function compressImage(
  input: LoadedImage,
  options: CompressOptions,
): Promise<CompressionResult> {
  const signal = options.signal;
  const check = () => {
    if (signal?.aborted) throw new CancelledError();
  };
  check();
  const originalSize = input.file.size;
  const initial = fitWithin(input.width, input.height, options.maxWidth, options.maxHeight);
  let format: ImageFormat =
    options.format === "auto"
      ? options.mode === "target"
        ? "webp"
        : input.format
      : options.format;
  if (options.mode === "target" && format === "png") {
    // PNG cannot reliably reach a byte target. Keep user's explicit choice but still try.
    options.onStage?.("Encoding PNG. Target sizes are not reliable for PNG.");
  }
  const background = "#FFFFFF";

  if (options.mode === "target" && originalSize <= options.targetBytes && format === input.format) {
    return {
      blob: input.file,
      width: input.width,
      height: input.height,
      fileName: input.file.name,
      mime: input.file.type || formatToMime(format),
      format,
      originalSize,
      outputSize: originalSize,
      keptOriginal: true,
      targetReached: true,
      quality: 100,
    };
  }

  if (options.mode === "quality") {
    options.onStage?.("Encoding image");
    const blob = await encodeAt(
      input.image,
      initial.width,
      initial.height,
      format,
      options.quality / 100,
      background,
    );
    check();
    return {
      blob,
      width: initial.width,
      height: initial.height,
      fileName: outputName(input.file.name, "compressed", format),
      mime: formatToMime(format),
      format,
      originalSize,
      outputSize: blob.size,
      quality: options.quality,
      targetReached: true,
    };
  }

  const target = options.targetBytes;
  let current = { ...initial };
  let closest: { blob: Blob; width: number; height: number; quality: number } | null = null;
  let attempts = 0;

  for (let dimensionStep = 0; dimensionStep <= 12; dimensionStep += 1) {
    check();
    options.onStage?.(
      dimensionStep === 0
        ? "Searching for the target size"
        : `Reducing dimensions, step ${dimensionStep} of 12`,
    );
    const topBlob = await encodeAt(
      input.image,
      current.width,
      current.height,
      format,
      1,
      background,
    );
    attempts += 1;
    if (!closest || topBlob.size < closest.blob.size) {
      closest = { blob: topBlob, width: current.width, height: current.height, quality: 100 };
    }
    if (topBlob.size <= target) {
      return {
        blob: topBlob,
        width: current.width,
        height: current.height,
        fileName: outputName(input.file.name, "compressed", format),
        mime: formatToMime(format),
        format,
        originalSize,
        outputSize: topBlob.size,
        quality: 100,
        targetReached: true,
        attempts,
      };
    }

    let low = 1;
    let high = 99;
    let hit: { blob: Blob; width: number; height: number; quality: number } | null = null;
    for (let index = 0; index < 8; index += 1) {
      check();
      const quality = Math.round((low + high) / 2);
      const blob = await encodeAt(
        input.image,
        current.width,
        current.height,
        format,
        quality / 100,
        background,
      );
      attempts += 1;
      if (blob.size < (closest?.blob.size ?? Infinity)) {
        closest = { blob, width: current.width, height: current.height, quality };
      }
      if (blob.size <= target) {
        hit = { blob, width: current.width, height: current.height, quality };
        low = quality + 1;
      } else {
        high = quality - 1;
      }
      if (low > high) break;
    }
    if (hit) {
      return {
        blob: hit.blob,
        width: hit.width,
        height: hit.height,
        fileName: outputName(input.file.name, "compressed", format),
        mime: formatToMime(format),
        format,
        originalSize,
        outputSize: hit.blob.size,
        quality: hit.quality,
        targetReached: true,
        attempts,
      };
    }

    const nextWidth = Math.max(64, Math.round(current.width * 0.9));
    const nextHeight = Math.max(64, Math.round(current.height * 0.9));
    if (nextWidth === current.width && nextHeight === current.height) break;
    current = { width: nextWidth, height: nextHeight };
    if (dimensionStep === 12) break;
    options.onStage?.(`Reducing to ${current.width} by ${current.height}`);
    const q80 = await encodeAt(
      input.image,
      current.width,
      current.height,
      format,
      0.8,
      background,
    );
    attempts += 1;
    if (!closest || q80.size < closest.blob.size) {
      closest = { blob: q80, width: current.width, height: current.height, quality: 80 };
    }
    if (q80.size <= target) {
      return {
        blob: q80,
        width: current.width,
        height: current.height,
        fileName: outputName(input.file.name, "compressed", format),
        mime: formatToMime(format),
        format,
        originalSize,
        outputSize: q80.size,
        quality: 80,
        targetReached: true,
        attempts,
      };
    }
  }

  if (!closest) throw new Error("Could not encode this image.");
  return {
    blob: closest.blob,
    width: closest.width,
    height: closest.height,
    fileName: outputName(input.file.name, "compressed", format),
    mime: formatToMime(format),
    format,
    originalSize,
    outputSize: closest.blob.size,
    quality: closest.quality,
    targetReached: closest.blob.size <= target,
    attempts,
  };
}

export interface ResizeOptions {
  mode: "dimensions" | "percentage";
  width: number;
  height: number;
  percentage: number;
  fit: "contain" | "cover" | "stretch";
  allowUpscale: boolean;
  background: string;
  format: "keep" | ImageFormat;
  quality: number;
  signal?: AbortSignal;
}

export async function resizeImage(
  input: LoadedImage,
  options: ResizeOptions,
): Promise<ImageOutput> {
  if (options.signal?.aborted) throw new CancelledError();
  let targetWidth = options.width;
  let targetHeight = options.height;
  if (options.mode === "percentage") {
    targetWidth = Math.max(1, Math.round(input.width * (options.percentage / 100)));
    targetHeight = Math.max(1, Math.round(input.height * (options.percentage / 100)));
  }
  if (!options.allowUpscale) {
    if (targetWidth > input.width || targetHeight > input.height) {
      const ratio = Math.min(input.width / targetWidth, input.height / targetHeight, 1);
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }
  }
  const fitsWithin = targetWidth <= input.width && targetHeight <= input.height;
  if (!fitsWithin && options.mode === "dimensions" && !options.allowUpscale) {
    targetWidth = input.width;
    targetHeight = input.height;
  }
  const outputFormat: ImageFormat = options.format === "keep" ? input.format : options.format;
  const fit: DrawOptions["fit"] =
    options.fit === "contain" && outputFormat === "jpg" ? "contain" : options.fit;
  const canvas = drawImage(input.image, {
    width: targetWidth,
    height: targetHeight,
    fit,
    background: options.background,
  });
  if (options.fit === "cover") {
    // Re-draw cover without the initial background tint.
    const coverCanvas = drawImage(input.image, {
      width: targetWidth,
      height: targetHeight,
      fit: "cover",
      background: options.background,
    });
    canvas.width = coverCanvas.width;
    canvas.height = coverCanvas.height;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(coverCanvas, 0, 0);
  }
  const blob = await canvasToBlob(canvas, outputFormat, options.quality / 100);
  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    fileName: `${baseName(input.file.name)}-${canvas.width}x${canvas.height}.${outputFormat}`,
    mime: formatToMime(outputFormat),
    format: outputFormat,
    quality: options.quality,
  };
}

export async function processBatch<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>,
  concurrency = 2,
  signal?: AbortSignal,
): Promise<void> {
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      if (signal?.aborted) throw new CancelledError();
      const current = nextIndex;
      nextIndex += 1;
      await worker(items[current], current);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  });
  await Promise.all(runners);
}
