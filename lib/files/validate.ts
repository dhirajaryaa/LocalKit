export interface MagicResult {
  type: string | null;
  animated: boolean;
  reason?: string;
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export async function sniffFile(file: File, maxBytes = 256 * 1024): Promise<MagicResult> {
  const head = new Uint8Array(await file.slice(0, Math.min(file.size, maxBytes)).arrayBuffer());
  if (head.length < 12) return { type: null, animated: false, reason: "This file is too small to read." };

  if (head[0] === 0x89 && ascii(head, 1, 3) === "PNG") {
    const animated = ascii(head, 0, Math.min(head.length, 1024)).includes("acTL") || findAscii(head, "acTL");
    return { type: "image/png", animated };
  }
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return { type: "image/jpeg", animated: false };
  }
  if (ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 4) === "WEBP") {
    const animated = ascii(head, 12, 4) === "VP8X" && findAscii(head, "ANIM");
    return { type: "image/webp", animated };
  }
  if (ascii(head, 0, 3) === "GIF") {
    return { type: "image/gif", animated: head.length > 6 && head[0] === 0x47 };
  }
  if (ascii(head, 0, 4) === "%PDF") {
    return { type: "application/pdf", animated: false };
  }
  if (ascii(head, 4, 4) === "ftyp") {
    return { type: "video/mp4", animated: false };
  }
  if (ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 4) === "WAVE") {
    return { type: "audio/wav", animated: false };
  }
  if (ascii(head, 0, 3) === "ID3" || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0)) {
    return { type: "audio/mpeg", animated: false };
  }
  if (ascii(head, 0, 4) === "OggS") {
    return { type: "audio/ogg", animated: false };
  }
  if (ascii(head, 4, 4) === "ftypM4A" || ascii(head, 4, 4) === "ftypM4B") {
    return { type: "audio/mp4", animated: false };
  }
  if (ascii(head, 0, 4) === "fLaC") {
    return { type: "audio/flac", animated: false };
  }
  if (ascii(head, 0, 2) === "PK") {
    return { type: "application/zip", animated: false };
  }
  return { type: null, animated: false, reason: "This file type is not supported." };
}

function findAscii(bytes: Uint8Array, word: string): boolean {
  const needle = word.split("").map((char) => char.charCodeAt(0));
  outer: for (let index = 0; index <= bytes.length - needle.length; index += 1) {
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (bytes[index + offset] !== needle[offset]) continue outer;
    }
    return true;
  }
  return false;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
  type?: string;
  animated?: boolean;
}

export async function validateImage(file: File): Promise<ValidationResult> {
  if (file.size === 0) return { ok: false, error: "This file is empty." };
  const sniff = await sniffFile(file);
  if (!sniff.type) return { ok: false, error: "That file is not a PNG, JPG, or WebP image." };
  if (sniff.type === "image/gif") {
    return { ok: false, error: "Animated images are not supported here. Try the GIF tools." };
  }
  if (!["image/png", "image/jpeg", "image/webp"].includes(sniff.type)) {
    return { ok: false, error: "That file is not a PNG, JPG, or WebP image." };
  }
  if (sniff.animated) {
    return { ok: false, error: "Animated images are not supported here. Try the GIF tools." };
  }
  return { ok: true, type: sniff.type };
}

export async function validatePdf(file: File): Promise<ValidationResult> {
  if (file.size === 0) return { ok: false, error: "This file is empty." };
  const sniff = await sniffFile(file);
  if (sniff.type !== "application/pdf") {
    return { ok: false, error: "That file is not a PDF." };
  }
  return { ok: true, type: "application/pdf" };
}

export async function validateGif(file: File): Promise<ValidationResult> {
  if (file.size === 0) return { ok: false, error: "This file is empty." };
  const sniff = await sniffFile(file);
  if (sniff.type !== "image/gif") {
    return { ok: false, error: "That file is not a GIF." };
  }
  return { ok: true, type: "image/gif" };
}

export async function validateVideo(file: File): Promise<ValidationResult> {
  if (file.size === 0) return { ok: false, error: "This file is empty." };
  const name = file.name.toLowerCase();
  const sniff = await sniffFile(file);
  const extensionOk = /\.(mp4|mov|webm)$/i.test(name);
  const typeOk =
    sniff.type === "video/mp4" ||
    ["video/webm", "video/quicktime", "video/mp4"].includes(file.type);
  if (!extensionOk && !typeOk) {
    return { ok: false, error: "That file is not an MP4, MOV, or WebM video." };
  }
  return { ok: true, type: sniff.type ?? file.type };
}

export async function validateAudio(file: File): Promise<ValidationResult> {
  if (file.size === 0) return { ok: false, error: "This file is empty." };
  const name = file.name.toLowerCase();
  if (!/\.(mp3|wav|ogg|oga|m4a|aac|flac)$/i.test(name) && !file.type.startsWith("audio/")) {
    return { ok: false, error: "That file is not a supported audio file. Try MP3, WAV, OGG, M4A, or FLAC." };
  }
  return { ok: true, type: file.type || "audio/*" };
}

export function checkImageDimensions(width: number, height: number): string | null {
  if (width < 1 || height < 1) return "This image has no readable dimensions.";
  if (width > 16384 || height > 16384) {
    return `This image is ${width} by ${height}. The maximum is 16,384 px per side.`;
  }
  if (width * height > 100_000_000) {
    return "This image is over 100 megapixels. Try a smaller image.";
  }
  return null;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function describeError(error: unknown, fallback = "The file could not be processed."): string {
  if (error instanceof Error) {
    if (/password|encrypted/i.test(error.message)) {
      return "This PDF is password-protected. Password-protected PDFs are not supported.";
    }
    if (/memory|allocation|OOM/i.test(error.message)) {
      return "The browser ran out of memory. Try a smaller file or close other tabs.";
    }
    if (/Invalid PDF|No PDF header|missing/i.test(error.message)) {
      return "This PDF is corrupt or could not be read.";
    }
    if (/decode|EncodingError|InvalidState/i.test(error.message)) {
      return "This file could not be decoded in this browser.";
    }
  }
  return fallback;
}
