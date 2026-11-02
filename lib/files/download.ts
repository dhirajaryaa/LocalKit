import { zip, type AsyncZippable } from "fflate";
import { sanitizeFileName } from "./format";

export function downloadBlob(blob: Blob, name: string): void {
  const filename = sanitizeFileName(name);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function bytesToBlob(bytes: Uint8Array, type: string): Blob {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return new Blob([copy], { type });
}

export async function downloadZip(
  files: Array<{ name: string; blob: Blob }>,
  zipName: string,
): Promise<void> {
  const entries: AsyncZippable = {};
  const used = new Set<string>();
  for (const file of files) {
    let name = sanitizeFileName(file.name);
    if (used.has(name)) {
      const dot = name.lastIndexOf(".");
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : "";
      let counter = 2;
      while (used.has(`${base}-${counter}${ext}`)) counter += 1;
      name = `${base}-${counter}${ext}`;
    }
    used.add(name);
    entries[name] = new Uint8Array(await file.blob.arrayBuffer());
  }
  const data = await new Promise<Uint8Array>((resolve, reject) => {
    zip(entries, { level: 6 }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
  downloadBlob(bytesToBlob(data, "application/zip"), zipName);
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsDataURL(blob);
  });
}

export function releaseObjectUrl(url: string | null | undefined): void {
  if (url) URL.revokeObjectURL(url);
}
