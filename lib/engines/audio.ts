import { validateAudio } from "@/lib/files/validate";
import { formatDuration } from "@/lib/files/format";

export interface LoadedAudio {
  file: File;
  buffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  channels: number;
}

export class AudioCancelledError extends Error {
  constructor() {
    super("Cancelled");
    this.name = "AbortError";
  }
}

export async function loadAudio(file: File, signal?: AbortSignal): Promise<LoadedAudio> {
  const validation = await validateAudio(file);
  if (!validation.ok) throw new Error(validation.error);
  if (signal?.aborted) throw new AudioCancelledError();
  const bytes = await file.arrayBuffer();
  const context = new AudioContext();
  try {
    const buffer = await context.decodeAudioData(bytes.slice(0));
    if (signal?.aborted) throw new AudioCancelledError();
    return {
      file,
      buffer,
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      channels: buffer.numberOfChannels,
    };
  } catch (error) {
    if (error instanceof AudioCancelledError) throw error;
    throw new Error("This audio format is not supported by your browser. Try MP3, WAV, or M4A.");
  } finally {
    await context.close();
  }
}

export function audioMetadataText(audio: LoadedAudio): string {
  return `${formatDuration(audio.duration)} · ${audio.channels === 1 ? "Mono" : "Stereo"} · ${audio.sampleRate.toLocaleString()} Hz`;
}

export interface AudioProcessOptions {
  sampleRate: number | "keep";
  channels: 1 | 2 | "keep";
  signal?: AbortSignal;
}

export async function processAudioChannels(
  audio: LoadedAudio,
  options: AudioProcessOptions,
): Promise<AudioBuffer> {
  const targetChannels = options.channels === "keep" ? audio.channels : options.channels;
  const targetRate = options.sampleRate === "keep" ? audio.sampleRate : options.sampleRate;

  if (targetRate === audio.sampleRate && targetChannels === audio.channels) {
    return audio.buffer;
  }

  const offline = new OfflineAudioContext(
    targetChannels,
    Math.max(1, Math.ceil(audio.duration * targetRate)),
    targetRate,
  );
  const source = offline.createBufferSource();
  source.buffer = audio.buffer;
  source.connect(offline.destination);
  source.start(0);
  if (options.signal?.aborted) throw new AudioCancelledError();
  const rendered = await offline.startRendering();
  if (options.signal?.aborted) throw new AudioCancelledError();

  if (targetChannels === audio.channels) return rendered;

  // Some engines do not reliably remix on an OfflineAudioContext destination.
  const mixed = new AudioBuffer({
    length: rendered.length,
    sampleRate: targetRate,
    numberOfChannels: targetChannels,
  });
  if (targetChannels === 1) {
    const out = mixed.getChannelData(0);
    const sources = Array.from({ length: rendered.numberOfChannels }, (_, index) =>
      rendered.getChannelData(index),
    );
    for (let index = 0; index < rendered.length; index += 1) {
      let value = 0;
      for (const channel of sources) value += channel[index] ?? 0;
      out[index] = value / Math.max(1, sources.length);
    }
  } else {
    for (let channel = 0; channel < targetChannels; channel += 1) {
      const out = mixed.getChannelData(channel);
      const sourceChannel = rendered.getChannelData(channel % rendered.numberOfChannels);
      out.set(sourceChannel);
    }
  }
  return mixed;
}

export function encodeWav(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const frames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = frames * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channelData = Array.from({ length: channels }, (_, index) => buffer.getChannelData(index));
  let offset = 44;
  for (let frame = 0; frame < frames; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][frame] ?? 0));
      const int = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int, true);
      offset += 2;
    }
  }
  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export interface Mp3Options {
  bitrate: number;
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
}

export async function encodeMp3(buffer: AudioBuffer, options: Mp3Options): Promise<Blob> {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const channels = Math.min(2, buffer.numberOfChannels);
  const encoder = new Mp3Encoder(channels, buffer.sampleRate, options.bitrate);
  const left = floatTo16(buffer.getChannelData(0));
  const rightSource = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0);
  const right = floatTo16(rightSource);
  const blockSize = 1152;
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < left.length; offset += blockSize) {
    if (options.signal?.aborted) throw new AudioCancelledError();
    const end = Math.min(offset + blockSize, left.length);
    const leftBlock = left.subarray(offset, end);
    const rightBlock = right.subarray(offset, end);
    const encoded =
      channels === 2
        ? encoder.encodeBuffer(leftBlock, rightBlock)
        : encoder.encodeBuffer(leftBlock);
    if (encoded.length > 0) chunks.push(new Uint8Array(encoded));
    if (offset % (blockSize * 60) === 0) {
      options.onProgress?.(Math.min(1, end / left.length));
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }
  const finalChunk = encoder.flush();
  if (finalChunk.length > 0) chunks.push(new Uint8Array(finalChunk));
  options.onProgress?.(1);
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let pointer = 0;
  for (const chunk of chunks) {
    output.set(chunk, pointer);
    pointer += chunk.length;
  }
  return new Blob([output], { type: "audio/mpeg" });
}

function floatTo16(input: Float32Array): Int16Array {
  const result = new Int16Array(input.length);
  for (let index = 0; index < input.length; index += 1) {
    const value = Math.max(-1, Math.min(1, input[index]));
    result[index] = value < 0 ? value * 0x8000 : value * 0x7fff;
  }
  return result;
}

export async function exportAudio(
  buffer: AudioBuffer,
  format: "mp3" | "wav",
  options: { bitrate: number; signal?: AbortSignal; onProgress?: (fraction: number) => void },
): Promise<Blob> {
  if (format === "wav") {
    options.onProgress?.(0.5);
    const blob = encodeWav(buffer);
    options.onProgress?.(1);
    return blob;
  }
  return await encodeMp3(buffer, options);
}

export function sliceAudioBuffer(
  buffer: AudioBuffer,
  start: number,
  end: number,
  fadeIn: number,
  fadeOut: number,
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const startSample = Math.max(0, Math.floor(start * sampleRate));
  const endSample = Math.min(buffer.length, Math.ceil(end * sampleRate));
  const length = Math.max(1, endSample - startSample);
  const output = new AudioBuffer({
    length,
    sampleRate,
    numberOfChannels: buffer.numberOfChannels,
  });
  const fadeInSamples = Math.min(Math.floor(fadeIn * sampleRate), Math.floor(length / 2));
  const fadeOutSamples = Math.min(Math.floor(fadeOut * sampleRate), Math.floor(length / 2));
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const source = buffer.getChannelData(channel);
    const target = output.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      let value = source[startSample + index] ?? 0;
      if (fadeInSamples > 0 && index < fadeInSamples) value *= index / fadeInSamples;
      if (fadeOutSamples > 0 && index >= length - fadeOutSamples) {
        value *= Math.max(0, (length - index) / fadeOutSamples);
      }
      target[index] = value;
    }
  }
  return output;
}

export function getWaveformPeaks(buffer: AudioBuffer, buckets = 900): number[] {
  const channel = buffer.getChannelData(0);
  const second = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
  const step = Math.max(1, Math.floor(channel.length / buckets));
  const peaks: number[] = [];
  for (let bucket = 0; bucket < buckets; bucket += 1) {
    const start = bucket * step;
    const end = Math.min(channel.length, start + step);
    let peak = 0;
    for (let index = start; index < end; index += Math.max(1, Math.floor(step / 120))) {
      const value = Math.max(Math.abs(channel[index] ?? 0), Math.abs(second?.[index] ?? 0));
      if (value > peak) peak = value;
    }
    peaks.push(peak);
  }
  return peaks;
}

export async function audioDurationFromFile(file: File): Promise<number> {
  const audio = await loadAudio(file);
  return audio.duration;
}
