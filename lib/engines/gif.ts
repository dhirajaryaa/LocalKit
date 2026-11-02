import { GIFEncoder, applyPalette, nearestColorIndex, quantize, type Palette } from "gifenc";
import { decompressFrames, parseGIF, type ParsedFrame } from "gifuct-js";
import { drawImage, loadImage, releaseImage, type LoadedImage } from "@/lib/engines/image";
import { validateGif } from "@/lib/files/validate";
import { clamp } from "@/lib/files/format";

export class GifCancelledError extends Error {
  constructor() {
    super("Cancelled");
    this.name = "AbortError";
  }
}

function check(signal?: AbortSignal): void {
  if (signal?.aborted) throw new GifCancelledError();
}

function even(value: number): number {
  return Math.max(2, Math.round(value / 2) * 2);
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is unavailable in this browser.");
  return context;
}

function samplePixels(data: Uint8ClampedArray, target: number[], step: number): void {
  for (let index = 0; index < data.length; index += 4 * step) {
    target.push(data[index], data[index + 1], data[index + 2], data[index + 3]);
  }
}

function hasAlpha(data: Uint8ClampedArray): boolean {
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 250) return true;
  }
  return false;
}

function paletteFormat(transparent: boolean): "rgb565" | "rgba4444" {
  return transparent ? "rgba4444" : "rgb565";
}

function transparentPaletteIndex(palette: Palette): number {
  return palette.findIndex((color) => color.length > 3 && (color[3] ?? 255) < 16);
}

function applyDithered(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: Palette,
  format: "rgb565" | "rgba4444",
  transparentIndex: number,
): Uint8Array {
  const output = new Uint8Array(width * height);
  const error = new Float32Array(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x;
      const source = pixel * 4;
      const alpha = data[source + 3];
      if (transparentIndex >= 0 && alpha < 128) {
        output[pixel] = transparentIndex;
        continue;
      }
      const rgb = [
        clamp(data[source] + error[pixel * 3], 0, 255),
        clamp(data[source + 1] + error[pixel * 3 + 1], 0, 255),
        clamp(data[source + 2] + error[pixel * 3 + 2], 0, 255),
      ];
      const index = nearestColorIndex(palette, format === "rgba4444" ? [...rgb, alpha] : rgb);
      output[pixel] = index;
      const color = palette[index] ?? [0, 0, 0];
      const rError = rgb[0] - (color[0] ?? 0);
      const gError = rgb[1] - (color[1] ?? 0);
      const bError = rgb[2] - (color[2] ?? 0);
      const distribute = (nx: number, ny: number, factor: number) => {
        if (nx < 0 || nx >= width || ny >= height) return;
        const target = (ny * width + nx) * 3;
        error[target] += rError * factor;
        error[target + 1] += gError * factor;
        error[target + 2] += bError * factor;
      };
      distribute(x + 1, y, 7 / 16);
      distribute(x - 1, y + 1, 3 / 16);
      distribute(x, y + 1, 5 / 16);
      distribute(x + 1, y + 1, 1 / 16);
    }
  }
  return output;
}

function indicesFor(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: Palette,
  format: "rgb565" | "rgba4444",
  dither: boolean,
  transparentIndex: number,
): Uint8Array {
  if (dither) return applyDithered(data, width, height, palette, format, transparentIndex);
  return applyPalette(data, palette, format);
}

export interface ImagesToGifOptions {
  width: number | "original";
  height?: number;
  delayMs: number;
  loop: number;
  fit: "contain" | "cover";
  background: string | null;
  colors: number;
  dither: boolean;
  signal?: AbortSignal;
  onProgress?: (update: { stage?: string; progress?: number }) => void;
}

export interface GifOutput {
  blob: Blob;
  width: number;
  height: number;
  frameCount: number;
  durationMs: number;
  hasTransparency: boolean;
  mixedTransparency: boolean;
}

export async function encodeImagesToGif(
  inputs: LoadedImage[],
  options: ImagesToGifOptions,
): Promise<GifOutput> {
  if (inputs.length < 2) throw new Error("Add at least two images.");
  if (inputs.length > 300) throw new Error("Images to GIF supports up to 300 images.");
  if (options.delayMs < 20 || options.delayMs > 5000) {
    throw new Error("Use a frame delay from 20 to 5,000 ms.");
  }
  if (inputs.length * options.delayMs > 30000) {
    throw new Error("The animation would exceed 30 seconds. Shorten the delay or remove frames.");
  }

  const first = inputs[0];
  const width = Math.round(options.width === "original" ? first.width : options.width);
  const height = Math.round(
    options.height ?? (width * first.height) / Math.max(1, first.width),
  );
  if (width < 2 || height < 2) throw new Error("The output dimensions are too small.");
  const canvasWidth = Math.min(1200, Math.max(2, width));
  const canvasHeight = Math.max(2, Math.round((canvasWidth * height) / width));

  const sample: number[] = [];
  let anyAlpha = false;
  let everyAlpha = true;
  const backgroundColor = options.background;
  options.onProgress?.({ stage: "Preparing frames", progress: 0 });

  for (let index = 0; index < inputs.length; index += 1) {
    check(options.signal);
    const input = inputs[index];
    const canvas = drawImage(input.image, {
      width: canvasWidth,
      height: canvasHeight,
      fit: options.fit,
      background: backgroundColor ?? undefined,
    });
    const data = context2d(canvas).getImageData(0, 0, canvasWidth, canvasHeight).data;
    const alpha = hasAlpha(data);
    anyAlpha = anyAlpha || alpha;
    everyAlpha = everyAlpha && alpha;
    const step = Math.max(1, Math.floor((canvasWidth * canvasHeight) / 4500));
    samplePixels(data, sample, step);
    options.onProgress?.({
      stage: `Preparing frame ${index + 1} of ${inputs.length}`,
      progress: (index + 1) / (inputs.length * 2 + 1),
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  check(options.signal);
  const useTransparency = backgroundColor === null && anyAlpha;
  const format = paletteFormat(useTransparency);
  const palette = quantize(
    new Uint8ClampedArray(sample),
    options.colors,
    useTransparency ? { format, oneBitAlpha: true, clearAlpha: true } : { format },
  );
  const transparentIndex = useTransparency ? transparentPaletteIndex(palette) : -1;
  const gif = GIFEncoder();
  const repeat = options.loop;
  options.onProgress?.({ stage: "Encoding GIF", progress: 0.55 });

  for (let index = 0; index < inputs.length; index += 1) {
    check(options.signal);
    const canvas = drawImage(inputs[index].image, {
      width: canvasWidth,
      height: canvasHeight,
      fit: options.fit,
      background: backgroundColor ?? undefined,
    });
    const data = context2d(canvas).getImageData(0, 0, canvasWidth, canvasHeight).data;
    const indexed = indicesFor(
      data,
      canvasWidth,
      canvasHeight,
      palette,
      format,
      options.dither,
      transparentIndex,
    );
    gif.writeFrame(indexed, canvasWidth, canvasHeight, {
      palette: index === 0 ? palette : undefined,
      first: index === 0,
      delay: options.delayMs,
      repeat: index === 0 ? repeat : undefined,
      transparent: transparentIndex >= 0,
      transparentIndex: transparentIndex >= 0 ? transparentIndex : undefined,
      dispose: 2,
    });
    options.onProgress?.({
      stage: `Encoding frame ${index + 1} of ${inputs.length}`,
      progress: 0.55 + (0.43 * (index + 1)) / inputs.length,
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  gif.finish();
  check(options.signal);
  const bytes = gif.bytes();
  options.onProgress?.({ stage: "Done", progress: 1 });
  return {
    blob: new Blob([new Uint8Array(bytes)], { type: "image/gif" }),
    width: canvasWidth,
    height: canvasHeight,
    frameCount: inputs.length,
    durationMs: inputs.length * options.delayMs,
    hasTransparency: useTransparency,
    mixedTransparency: anyAlpha && !everyAlpha,
  };
}

export interface GifCompressOptions {
  width: number | "original";
  fps: "keep" | 24 | 15 | 12 | 10 | 8;
  colors: number;
  dither: boolean;
  loop: "keep" | "infinite" | "once";
  signal?: AbortSignal;
  onProgress?: (update: { stage?: string; progress?: number }) => void;
}

export interface GifCompressResult extends GifOutput {
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalFrames: number;
  originalDurationMs: number;
  loop: number;
}

export async function compressGif(
  file: File,
  options: GifCompressOptions,
): Promise<GifCompressResult> {
  const valid = await validateGif(file);
  if (!valid.ok) throw new Error(valid.error ?? "That file is not a GIF.");
  const buffer = await file.arrayBuffer();
  const parsed = parseGIF(buffer);
  const frames = decompressFrames(parsed, true);
  if (frames.length > 300) throw new Error("GIF Compressor supports up to 300 frames.");
  if (frames.length === 0) throw new Error("This GIF has no frames.");

  const originalWidth = parsed.lsd.width;
  const originalHeight = parsed.lsd.height;
  const originalDurationMs = frames.reduce((sum, frame) => sum + Math.max(20, frame.delay), 0);
  const sourceFps = frames.length / Math.max(0.001, originalDurationMs / 1000);
  const targetWidth =
    options.width === "original"
      ? Math.min(800, originalWidth)
      : clamp(Math.round(options.width), 120, 1200);
  const targetHeight = Math.max(
    2,
    Math.round((targetWidth * originalHeight) / Math.max(1, originalWidth)),
  );
  const loop =
    options.loop === "infinite"
      ? 0
      : options.loop === "once"
        ? -1
        : (readGifLoop(buffer) ?? -1);

  const targetInterval = options.fps === "keep" ? 0 : 1000 / options.fps;
  const kept: Array<{ index: number; delay: number }> = [];
  if (!targetInterval || options.fps === "keep" || options.fps >= sourceFps - 0.01) {
    frames.forEach((frame, index) => kept.push({ index, delay: Math.max(20, frame.delay) }));
  } else {
    let accumulated = 0;
    frames.forEach((frame, index) => {
      accumulated += Math.max(20, frame.delay);
      if (accumulated >= targetInterval || index === frames.length - 1) {
        kept.push({ index, delay: Math.round(accumulated) });
        accumulated = 0;
      }
    });
  }

  const sample: number[] = [];
  const targetCanvas = makeCanvas(targetWidth, targetHeight);
  const targetContext = context2d(targetCanvas);
  const sourceCanvas = makeCanvas(originalWidth, originalHeight);
  const sourceContext = context2d(sourceCanvas);
  const patchCanvas = makeCanvas(1, 1);
  const patchContext = context2d(patchCanvas);
  const targetStep = Math.max(1, Math.floor((targetWidth * targetHeight) / 4500));
  let anyAlpha = false;

  options.onProgress?.({ stage: "Decoding frame data", progress: 0.04 });
  await composeGifFrames(frames, sourceCanvas, sourceContext, patchCanvas, patchContext, async (canvas) => {
    targetContext.clearRect(0, 0, targetWidth, targetHeight);
    targetContext.drawImage(canvas, 0, 0, targetWidth, targetHeight);
    const data = targetContext.getImageData(0, 0, targetWidth, targetHeight).data;
    anyAlpha = anyAlpha || hasAlpha(data);
    samplePixels(data, sample, targetStep);
  }, options.signal, (index) =>
    options.onProgress?.({
      stage: `Reading frame ${index + 1} of ${frames.length}`,
      progress: 0.04 + (0.4 * (index + 1)) / frames.length,
    }),
  );

  check(options.signal);
  const format = paletteFormat(anyAlpha);
  const palette = quantize(
    new Uint8ClampedArray(sample),
    options.colors,
    anyAlpha ? { format, oneBitAlpha: true, clearAlpha: true } : { format },
  );
  const transparentIndex = anyAlpha ? transparentPaletteIndex(palette) : -1;
  const gif = GIFEncoder();
  let outputIndex = 0;
  const keptByIndex = new Map(kept.map((item) => [item.index, item.delay]));

  await composeGifFrames(frames, sourceCanvas, sourceContext, patchCanvas, patchContext, async (canvas, index) => {
    const delay = keptByIndex.get(index);
    if (delay === undefined) return;
    targetContext.clearRect(0, 0, targetWidth, targetHeight);
    targetContext.drawImage(canvas, 0, 0, targetWidth, targetHeight);
    const data = targetContext.getImageData(0, 0, targetWidth, targetHeight).data;
    const indexed = indicesFor(
      data,
      targetWidth,
      targetHeight,
      palette,
      format,
      options.dither,
      transparentIndex,
    );
    gif.writeFrame(indexed, targetWidth, targetHeight, {
      palette: outputIndex === 0 ? palette : undefined,
      first: outputIndex === 0,
      delay,
      repeat: outputIndex === 0 ? loop : undefined,
      transparent: transparentIndex >= 0,
      transparentIndex: transparentIndex >= 0 ? transparentIndex : undefined,
      dispose: 2,
    });
    outputIndex += 1;
    options.onProgress?.({
      stage: `Encoding frame ${outputIndex} of ${kept.length}`,
      progress: 0.45 + (0.53 * outputIndex) / kept.length,
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }, options.signal);

  gif.finish();
  check(options.signal);
  const bytes = gif.bytes();
  const outputDuration = kept.reduce((sum, item) => sum + item.delay, 0);
  options.onProgress?.({ stage: "Done", progress: 1 });
  return {
    blob: new Blob([new Uint8Array(bytes)], { type: "image/gif" }),
    width: targetWidth,
    height: targetHeight,
    frameCount: kept.length,
    durationMs: outputDuration,
    hasTransparency: anyAlpha,
    mixedTransparency: false,
    originalSize: file.size,
    originalWidth,
    originalHeight,
    originalFrames: frames.length,
    originalDurationMs,
    loop,
  };
}

async function composeGifFrames(
  frames: ParsedFrame[],
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  patchCanvas: HTMLCanvasElement,
  patchContext: CanvasRenderingContext2D,
  onFrame: (canvas: HTMLCanvasElement, index: number) => Promise<void>,
  signal?: AbortSignal,
  onProgress?: (index: number) => void,
): Promise<void> {
  context.clearRect(0, 0, canvas.width, canvas.height);
  let restore: ImageData | null = null;
  let lastDisposal = 0;
  let lastDims: { left: number; top: number; width: number; height: number } | null = null;

  for (let index = 0; index < frames.length; index += 1) {
    check(signal);
    if (lastDisposal === 2 && lastDims) {
      context.clearRect(lastDims.left, lastDims.top, lastDims.width, lastDims.height);
    }
    if (lastDisposal === 3 && restore) {
      context.putImageData(restore, 0, 0);
    }
    const frame = frames[index];
    if (frame.disposalType === 3) {
      restore = context.getImageData(0, 0, canvas.width, canvas.height);
    }
    const dims = frame.dims;
    patchCanvas.width = Math.max(1, dims.width);
    patchCanvas.height = Math.max(1, dims.height);
    const image = patchContext.createImageData(patchCanvas.width, patchCanvas.height);
    image.data.set(frame.patch);
    patchContext.putImageData(image, 0, 0);
    context.drawImage(patchCanvas, dims.left, dims.top);
    lastDisposal = frame.disposalType;
    lastDims = dims;
    await onFrame(canvas, index);
    onProgress?.(index);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}

function readGifLoop(buffer: ArrayBuffer): number | null {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 13) return null;
  let offset = 13;
  const packed = bytes[10];
  if (packed & 0x80) {
    const size = 3 * Math.pow(2, (packed & 0x07) + 1);
    offset += size;
  }
  while (offset < bytes.length) {
    const marker = bytes[offset];
    if (marker === 0x3b) break;
    if (marker === 0x21) {
      const label = bytes[offset + 1];
      offset += 2;
      if (label === 0xff) {
        const size = bytes[offset];
        const id = String.fromCharCode(...bytes.slice(offset + 1, offset + 1 + size));
        offset += 1 + size;
        while (offset < bytes.length && bytes[offset] !== 0) {
          const blockSize = bytes[offset];
          if (id.startsWith("NETSCAPE2.0") && blockSize >= 3) {
            const sub = offset + 1;
            if (bytes[sub] === 1) return bytes[sub + 1] | (bytes[sub + 2] << 8);
          }
          offset += 1 + blockSize;
        }
        offset += 1;
      } else {
        while (offset < bytes.length && bytes[offset] !== 0) {
          offset += 1 + bytes[offset];
        }
        offset += 1;
      }
    } else if (marker === 0x2c) {
      offset += 1;
      const packedImage = bytes[offset + 8];
      offset += 9;
      if (packedImage & 0x80) {
        offset += 3 * Math.pow(2, (packedImage & 0x07) + 1);
      }
      offset += 1;
      while (offset < bytes.length && bytes[offset] !== 0) {
        offset += 1 + bytes[offset];
      }
      offset += 1;
    } else {
      break;
    }
  }
  return null;
}

export async function loadGifImages(files: File[]): Promise<LoadedImage[]> {
  const images: LoadedImage[] = [];
  try {
    for (const file of files) {
      images.push(await loadImage(file));
    }
    return images;
  } catch (error) {
    for (const image of images) releaseImage(image);
    throw error;
  }
}

export function releaseGifImages(images: LoadedImage[]): void {
  for (const image of images) releaseImage(image);
}

export interface GifInfo {
  width: number;
  height: number;
  frameCount: number;
  durationMs: number;
  loop: number | null;
  size: number;
}

export async function getGifInfo(file: File): Promise<GifInfo> {
  const valid = await validateGif(file);
  if (!valid.ok) throw new Error(valid.error ?? "That file is not a GIF.");
  const buffer = await file.arrayBuffer();
  const parsed = parseGIF(buffer);
  const frames = decompressFrames(parsed, false);
  return {
    width: parsed.lsd.width,
    height: parsed.lsd.height,
    frameCount: frames.length,
    durationMs: frames.reduce((sum, frame) => sum + Math.max(20, frame.delay), 0),
    loop: readGifLoop(buffer),
    size: file.size,
  };
}
