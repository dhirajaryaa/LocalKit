export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  const digits = index === 0 ? 0 : value >= 100 ? 0 : decimals;
  return `${value.toFixed(digits)} ${units[index]}`;
}

export function formatPercent(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value > 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatSaved(original: number, output: number): string {
  if (original <= 0) return "0%";
  return formatPercent(((output - original) / original) * 100, 0);
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function formatDurationExact(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00.000";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const core = `${String(minutes).padStart(hours ? 2 : 1, "0")}:${secs.toFixed(3).padStart(6, "0")}`;
  return hours ? `${hours}:${core}` : core;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function baseName(name: string): string {
  const withoutPath = name.split(/[\\/]/).pop() ?? "file";
  const dot = withoutPath.lastIndexOf(".");
  return dot > 0 ? withoutPath.slice(0, dot) : withoutPath;
}

export function extension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function sanitizeFileName(name: string, fallback = "localkit"): string {
  let clean = name
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+|\.+$/g, "")
    .trim();
  if (!clean) clean = fallback;
  if (clean.length > 100) {
    const dot = clean.lastIndexOf(".");
    if (dot > 0) {
      const ext = clean.slice(dot, dot + 8);
      clean = clean.slice(0, Math.max(1, 100 - ext.length)) + ext;
    } else {
      clean = clean.slice(0, 100);
    }
  }
  return clean;
}

export function outputName(originalName: string, suffix: string, ext: string): string {
  return sanitizeFileName(`${baseName(originalName)}-${suffix}.${ext}`);
}

export function timestamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

export function parseTimeInput(value: string): number | null {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const parts = cleaned.split(":");
  if (parts.length > 3) return null;
  const nums = parts.map((part) => Number(part.replace(",", ".")));
  if (nums.some((num) => !Number.isFinite(num) || num < 0)) return null;
  if (parts.length === 1) return nums[0];
  if (nums.slice(1).some((num) => num >= 60)) return null;
  return nums.reduce((total, num) => total * 60 + num, 0);
}

export function mimeForExtension(ext: string): string {
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    pdf: "application/pdf",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    zip: "application/zip",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}
