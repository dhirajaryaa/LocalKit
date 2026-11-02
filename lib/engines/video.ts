import { FFmpegClient } from "@/lib/engines/ffmpeg-client";
import { baseName, extension, sanitizeFileName } from "@/lib/files/format";

const CORE_JS_URL = "/ffmpeg/ffmpeg-core.js";
const CORE_WASM_URL = "/ffmpeg/ffmpeg-core.wasm";
const CORE_JS_MIME = "text/javascript";
const CORE_WASM_MIME = "application/wasm";

export interface LoadedVideo {
  file: File;
  objectUrl: string;
  duration: number;
  width: number;
  height: number;
  playable: boolean;
}

export interface VideoProgressHandlers {
  signal?: AbortSignal;
  onStage?: (stage: string) => void;
  onProgress?: (fraction: number | null) => void;
}

export interface VideoOutput {
  blob: Blob;
  fileName: string;
  duration: number;
  width: number;
  height: number;
}

export type VideoQuality = "light" | "balanced" | "high" | "custom";
export type VideoResolution = "keep" | "1080" | "720" | "480";
export type VideoFrameRate = "keep" | "30" | "24";
export type GifDither = "none" | "bayer" | "floyd_steinberg";
export type GifLoop = "infinite" | "once" | "count";

export interface CompressVideoOptions extends VideoProgressHandlers {
  quality: VideoQuality;
  crf: number;
  resolution: VideoResolution;
  targetBytes: number | null;
  removeAudio: boolean;
  frameRate: VideoFrameRate;
  sourceWidth: number;
  sourceHeight: number;
  sourceDuration: number;
}

export interface TrimVideoOptions extends VideoProgressHandlers {
  start: number;
  end: number;
  quality: "balanced" | "high";
  sourceWidth: number;
  sourceHeight: number;
}

export interface GifOptions extends VideoProgressHandlers {
  start: number;
  end: number;
  fps: number;
  width: number;
  colors: 256 | 128 | 64;
  dither: GifDither;
  loop: GifLoop;
  loopCount: number;
}

type FFmpegInstance = FFmpegClient;

let engine: FFmpegInstance | null = null;
let enginePromise: Promise<FFmpegInstance> | null = null;
let coreAsset: { coreURL: string; wasmURL: string } | null = null;

function even(value: number): number {
  return Math.max(2, Math.round(value / 2) * 2);
}

export function fitVideoDimensions(
  sourceWidth: number,
  sourceHeight: number,
  targetHeight: number | null,
): { width: number; height: number } {
  if (!sourceWidth || !sourceHeight) {
    return { width: sourceWidth, height: sourceHeight };
  }
  if (!targetHeight || sourceHeight <= targetHeight) {
    return { width: even(sourceWidth), height: even(sourceHeight) };
  }
  const scale = targetHeight / sourceHeight;
  return {
    width: even(sourceWidth * scale),
    height: even(sourceHeight * scale),
  };
}

export function getFfmpegTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const rest = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${rest
    .toFixed(3)
    .padStart(6, "0")}`;
}

function ffmpegExtension(file: File): string {
  const ext = extension(file.name);
  if (ext === "mp4" || ext === "mov" || ext === "webm") return ext;
  if (file.type === "video/quicktime") return "mov";
  if (file.type === "video/webm") return "webm";
  return "mp4";
}

async function fetchCoreAsset(
  url: string,
  mime: string,
  onProgress: (fraction: number | null) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(url, { signal, cache: "force-cache" });
  if (!response.ok) throw new Error("The video engine files could not be loaded.");
  const length = Number(response.headers.get("content-length")) || 0;
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    onProgress(1);
    return URL.createObjectURL(new Blob([buffer], { type: mime }));
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let lastReport = -1;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (length > 0) {
      const fraction = Math.min(1, received / length);
      if (fraction - lastReport >= 0.02 || fraction === 1) {
        lastReport = fraction;
        onProgress(fraction);
      }
    } else {
      onProgress(null);
    }
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  onProgress(1);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

async function loadCoreAssets(
  signal: AbortSignal | undefined,
  onProgress: (fraction: number | null) => void,
): Promise<{ coreURL: string; wasmURL: string }> {
  if (coreAsset) return coreAsset;
  const wasmURL = await fetchCoreAsset(
    CORE_WASM_URL,
    CORE_WASM_MIME,
    (fraction) => onProgress(fraction === null ? null : fraction * 0.9),
    signal,
  );
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  onProgress(0.92);
  const coreURL = await fetchCoreAsset(CORE_JS_URL, CORE_JS_MIME, () => undefined, signal);
  coreAsset = { coreURL, wasmURL };
  onProgress(1);
  return coreAsset;
}

export function terminateVideoEngine(): void {
  if (engine) {
    try {
      engine.terminate();
    } catch {
      // The worker may already be gone.
    }
  }
  engine = null;
  enginePromise = null;
}

async function getEngine(
  signal: AbortSignal | undefined,
  onStage: (stage: string) => void,
  onProgress: (fraction: number | null) => void,
): Promise<FFmpegInstance> {
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  if (engine?.loaded) {
    onProgress(1);
    return engine;
  }
  if (!enginePromise) {
    enginePromise = (async () => {
      onStage("Loading video engine");
      onProgress(0);
      const assets = await loadCoreAssets(signal, onProgress);
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      const instance = new FFmpegClient();
      try {
        await instance.load(assets, { signal });
      } catch (error) {
        try {
          instance.terminate();
        } catch {
          // Nothing to terminate.
        }
        throw error;
      }
      engine = instance;
      onProgress(1);
      return instance;
    })().catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

function timeFromLog(message: string, duration: number): number | null {
  const match = message.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match || duration <= 0) return null;
  const seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  return Math.max(0, Math.min(1, seconds / duration));
}

function friendlyEngineError(logs: string[], loaded: boolean): string {
  const all = logs.join("\n");
  if (!loaded || /failed to fetch|import|worker|wasm/i.test(all)) {
    return "The video engine could not load. Check your connection, then try again.";
  }
  if (/memory|out of memory|rangeerror|allocation/i.test(all)) {
    return "The video engine ran out of memory. Try a shorter clip or a smaller resolution.";
  }
  if (/unknown encoder|encoder not found|libx264/i.test(all)) {
    return "This build of the local encoder cannot create H.264 video.";
  }
  if (/invalid data|moov atom|could not find codec|decoder|unsupported/i.test(all)) {
    return "This video codec is not supported by the local encoder. Try an MP4 with H.264.";
  }
  return "The video could not be encoded. Try an MP4 with H.264.";
}

async function encode(
  instance: FFmpegInstance,
  args: string[],
  duration: number,
  handlers: VideoProgressHandlers,
): Promise<void> {
  const logs: string[] = [];
  let lastProgress = -1;
  const onLog = ({ message }: { message: string }) => {
    logs.push(message);
    if (logs.length > 60) logs.shift();
    const fraction = timeFromLog(message, duration);
    if (fraction !== null && fraction !== lastProgress) {
      lastProgress = fraction;
      handlers.onProgress?.(fraction);
    }
  };
  const onProgress = ({ progress }: { progress: number }) => {
    if (!Number.isFinite(progress)) return;
    const value = Math.max(0, Math.min(1, progress));
    if (value !== lastProgress) {
      lastProgress = value;
      handlers.onProgress?.(value);
    }
  };
  const onAbort = () => terminateVideoEngine();
  instance.on("log", onLog);
  instance.on("progress", onProgress);
  handlers.signal?.addEventListener("abort", onAbort, { once: true });
  try {
    const code = await instance.exec(args, undefined, { signal: handlers.signal });
    if (handlers.signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    if (code !== 0) throw new Error(friendlyEngineError(logs, true));
  } catch (error) {
    if (handlers.signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    if (error instanceof Error && error.message.startsWith("The video engine")) throw error;
    if (error instanceof Error && error.message.startsWith("This ")) throw error;
    throw new Error(friendlyEngineError(logs, true));
  } finally {
    instance.off("log", onLog);
    instance.off("progress", onProgress);
    handlers.signal?.removeEventListener("abort", onAbort);
  }
}

async function readVideoOutput(
  instance: FFmpegInstance,
  path: string,
  fileName: string,
  mime: string,
  duration: number,
  width: number,
  height: number,
): Promise<VideoOutput> {
  const data = await instance.readFile(path);
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return {
    blob: new Blob([copy], { type: mime }),
    fileName: sanitizeFileName(fileName),
    duration,
    width,
    height,
  };
}

async function removeFile(instance: FFmpegInstance, path: string): Promise<void> {
  try {
    await instance.deleteFile(path);
  } catch {
    // The file may not have been written.
  }
}

export async function loadVideoFile(file: File, signal?: AbortSignal): Promise<LoadedVideo> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;

  const metadata = await new Promise<{ duration: number; width: number; height: number; playable: boolean }>(
    (resolve) => {
      let settled = false;
      const finish = (playable: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
        resolve({
          duration,
          width: video.videoWidth || 0,
          height: video.videoHeight || 0,
          playable,
        });
      };
      const timeout = window.setTimeout(() => finish(false), 6000);
      video.onloadedmetadata = () => finish(true);
      video.onerror = () => finish(false);
      signal?.addEventListener(
        "abort",
        () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          resolve({ duration: 0, width: 0, height: 0, playable: false });
        },
        { once: true },
      );
      video.src = objectUrl;
    },
  );

  video.removeAttribute("src");
  video.load();

  return {
    file,
    objectUrl,
    duration: metadata.duration,
    width: metadata.width,
    height: metadata.height,
    playable: metadata.playable,
  };
}

export function releaseVideo(video: LoadedVideo | null | undefined): void {
  if (video?.objectUrl) URL.revokeObjectURL(video.objectUrl);
}

export async function compressVideo(
  source: LoadedVideo,
  options: CompressVideoOptions,
): Promise<VideoOutput> {
  const instance = await getEngine(options.signal, options.onStage ?? (() => undefined), options.onProgress ?? (() => undefined));
  if (options.signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  if (!options.sourceDuration) {
    throw new Error("The duration of this video is unknown. Try an MP4 or WebM with a readable duration.");
  }

  const input = `input.${ffmpegExtension(source.file)}`;
  const output = "output.mp4";
  const sourceWidth = options.sourceWidth || source.width;
  const sourceHeight = options.sourceHeight || source.height;
  const targetHeight =
    options.resolution === "keep" ? null : Number(options.resolution);
  const dimensions = fitVideoDimensions(sourceWidth, sourceHeight, targetHeight);
  const crf =
    options.quality === "light"
      ? 28
      : options.quality === "high"
        ? 20
        : options.quality === "custom"
          ? options.crf
          : 23;
  const targetMode = options.targetBytes !== null && options.targetBytes > 0;

  try {
    options.onStage?.("Preparing video");
    await instance.writeFile(input, new Uint8Array(await source.file.arrayBuffer()));
    const args = ["-i", input, "-c:v", "libx264", "-preset", "veryfast"];

    if (targetMode) {
      const audioKbps = options.removeAudio ? 0 : 128;
      const estimatedKbps = Math.floor(
        (options.targetBytes! * 8) / options.sourceDuration / 1000 - audioKbps,
      );
      const videoKbps = Math.max(120, Math.min(50_000, estimatedKbps));
      args.push(
        "-b:v",
        `${videoKbps}k`,
        "-maxrate",
        `${Math.round(videoKbps * 1.35)}k`,
        "-bufsize",
        `${Math.round(videoKbps * 2)}k`,
      );
    } else {
      args.push("-crf", String(crf));
    }

    if (targetHeight && sourceHeight > targetHeight) {
      args.push("-vf", `scale=${dimensions.width}:${dimensions.height}:flags=lanczos`);
    } else if (sourceWidth % 2 !== 0 || sourceHeight % 2 !== 0) {
      args.push("-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2");
    }

    if (options.frameRate !== "keep") args.push("-r", options.frameRate);
    if (options.removeAudio) {
      args.push("-an");
    } else {
      args.push("-c:a", "aac", "-b:a", "128k");
    }
    args.push("-pix_fmt", "yuv420p", "-movflags", "+faststart", output);

    options.onStage?.(targetMode ? "Encoding to target size" : "Encoding video");
    await encode(instance, args, options.sourceDuration, options);
    const result = await readVideoOutput(
      instance,
      output,
      `${baseName(source.file.name)}-compressed.mp4`,
      "video/mp4",
      options.sourceDuration,
      dimensions.width,
      dimensions.height,
    );
    return result;
  } catch (error) {
    if (options.signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    if (error instanceof Error && error.message.startsWith("The video")) throw error;
    if (error instanceof Error && error.message.startsWith("This ")) throw error;
    throw new Error(
      error instanceof Error
        ? error.message
        : "The video could not be compressed. Try an MP4 with H.264.",
    );
  } finally {
    await removeFile(instance, input);
    await removeFile(instance, output);
  }
}

export async function trimVideo(
  source: LoadedVideo,
  options: TrimVideoOptions,
): Promise<VideoOutput> {
  const instance = await getEngine(options.signal, options.onStage ?? (() => undefined), options.onProgress ?? (() => undefined));
  if (options.signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  const selection = options.end - options.start;
  if (selection < 0.1) throw new Error("Choose a selection of at least 0.1 seconds.");

  const input = `input.${ffmpegExtension(source.file)}`;
  const output = "output.mp4";
  const crf = options.quality === "high" ? 20 : 23;
  try {
    options.onStage?.("Preparing video");
    await instance.writeFile(input, new Uint8Array(await source.file.arrayBuffer()));
    options.onStage?.("Trimming video");
    await encode(
      instance,
      [
        "-ss",
        getFfmpegTime(options.start),
        "-i",
        input,
        "-t",
        getFfmpegTime(selection),
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        String(crf),
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        output,
      ],
      selection,
      options,
    );
    return await readVideoOutput(
      instance,
      output,
      `${baseName(source.file.name)}-trimmed.mp4`,
      "video/mp4",
      selection,
      options.sourceWidth,
      options.sourceHeight,
    );
  } catch (error) {
    if (options.signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    if (error instanceof Error && error.message.startsWith("The video")) throw error;
    if (error instanceof Error && error.message.startsWith("This ")) throw error;
    throw new Error(
      error instanceof Error ? error.message : "The video could not be trimmed. Try again.",
    );
  } finally {
    await removeFile(instance, input);
    await removeFile(instance, output);
  }
}

function gifLoopValue(loop: GifLoop, count: number): string {
  if (loop === "infinite") return "0";
  if (loop === "once") return "-1";
  return String(Math.max(1, Math.min(9, count - 1)));
}

export async function videoToGif(
  source: LoadedVideo,
  options: GifOptions,
): Promise<VideoOutput> {
  const instance = await getEngine(options.signal, options.onStage ?? (() => undefined), options.onProgress ?? (() => undefined));
  if (options.signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  const selection = options.end - options.start;
  if (selection < 0.2) throw new Error("Choose a GIF selection of at least 0.2 seconds.");
  if (selection > 30.0001) throw new Error("A GIF selection must be 30 seconds or shorter.");

  const sourceWidth = source.width || options.width;
  const targetWidth = Math.min(Math.round(options.width), sourceWidth || options.width);
  const input = `input.${ffmpegExtension(source.file)}`;
  const output = "output.gif";
  const filter = [
    `fps=${options.fps}`,
    `scale=${targetWidth}:-2:flags=lanczos`,
    `split[s0][s1];[s0]palettegen=max_colors=${options.colors}[p];[s1][p]paletteuse=dither=${options.dither}`,
  ].join(",");

  try {
    options.onStage?.("Preparing video");
    await instance.writeFile(input, new Uint8Array(await source.file.arrayBuffer()));
    options.onStage?.("Building palette");
    await encode(
      instance,
      [
        "-ss",
        getFfmpegTime(options.start),
        "-t",
        getFfmpegTime(selection),
        "-i",
        input,
        "-filter_complex",
        filter,
        "-loop",
        gifLoopValue(options.loop, options.loopCount),
        output,
      ],
      selection,
      options,
    );
    return await readVideoOutput(
      instance,
      output,
      `${baseName(source.file.name)}-clip.gif`,
      "image/gif",
      selection,
      targetWidth,
      source.height ? Math.max(2, Math.round((source.height * targetWidth) / sourceWidth / 2) * 2) : 0,
    );
  } catch (error) {
    if (options.signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    if (error instanceof Error && error.message.startsWith("The video")) throw error;
    if (error instanceof Error && error.message.startsWith("This ")) throw error;
    throw new Error(
      error instanceof Error ? error.message : "The GIF could not be created. Try a shorter or smaller selection.",
    );
  } finally {
    await removeFile(instance, input);
    await removeFile(instance, output);
  }
}
