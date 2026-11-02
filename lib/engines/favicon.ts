import type { LoadedImage } from "./image";

export interface FaviconOptions {
  crop: "crop" | "fit";
  padding: number;
  background: "transparent" | "white" | "custom";
  backgroundColor: string;
  appName: string;
  themeColor: string;
}

export function renderFavicon(
  source: HTMLImageElement,
  size: number,
  options: FaviconOptions,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const background =
    options.background === "transparent"
      ? null
      : options.background === "white"
        ? "#FFFFFF"
        : options.backgroundColor;
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
  }

  const inset = (Math.min(20, Math.max(0, options.padding)) / 100) * size;
  const box = Math.max(1, size - inset * 2);
  const sourceRatio = source.naturalWidth / source.naturalHeight;

  if (options.crop === "crop") {
    let sourceWidth = source.naturalWidth;
    let sourceHeight = source.naturalHeight;
    if (sourceRatio > 1) {
      sourceWidth = source.naturalHeight;
    } else if (sourceRatio < 1) {
      sourceHeight = source.naturalWidth;
    }
    const sourceX = (source.naturalWidth - sourceWidth) / 2;
    const sourceY = (source.naturalHeight - sourceHeight) / 2;
    ctx.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, inset, inset, box, box);
  } else {
    let drawWidth = box;
    let drawHeight = box;
    if (sourceRatio > 1) drawHeight = box / sourceRatio;
    else drawWidth = box * sourceRatio;
    ctx.drawImage(
      source,
      inset + (box - drawWidth) / 2,
      inset + (box - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
  }
  return canvas;
}

export async function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/png");
  });
  if (!blob) throw new Error("The browser could not render this icon.");
  return blob;
}

export function buildIco(entries: Array<{ size: number; png: Uint8Array }>): Blob {
  const count = entries.length;
  const headerSize = 6 + count * 16;
  const total = headerSize + entries.reduce((sum, entry) => sum + entry.png.length, 0);
  const output = new Uint8Array(total);
  const view = new DataView(output.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, count, true);
  let offset = headerSize;
  entries.forEach((entry, index) => {
    const position = 6 + index * 16;
    output[position] = entry.size >= 256 ? 0 : entry.size;
    output[position + 1] = entry.size >= 256 ? 0 : entry.size;
    output[position + 2] = 0;
    output[position + 3] = 0;
    view.setUint16(position + 4, 1, true);
    view.setUint16(position + 6, 32, true);
    view.setUint32(position + 8, entry.png.length, true);
    view.setUint32(position + 12, offset, true);
    output.set(entry.png, offset);
    offset += entry.png.length;
  });
  return new Blob([output], { type: "image/x-icon" });
}

export function faviconManifest(options: FaviconOptions): string {
  const name = options.appName.trim() || "My Site";
  return `${JSON.stringify(
    {
      name,
      short_name: name,
      start_url: "./",
      display: "standalone",
      background_color: "#FFFFFF",
      theme_color: options.themeColor,
      icons: [
        {
          src: "./android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "./android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
    null,
    2,
  )}\n`;
}

export function faviconSnippet(): string {
  return `<!-- LocalKit favicon set -->\n<link rel="icon" href="./favicon.ico" sizes="any" />\n<link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png" />\n<link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png" />\n<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png" />\n<link rel="manifest" href="./site.webmanifest" />\n`;
}

export interface FaviconFile {
  name: string;
  blob: Blob;
}

export async function generateFaviconSet(
  source: LoadedImage,
  options: FaviconOptions,
  onStage?: (stage: string) => void,
): Promise<FaviconFile[]> {
  const sizes = [
    { size: 16, name: "favicon-16x16.png" },
    { size: 32, name: "favicon-32x32.png" },
    { size: 48, name: "favicon-48x48.png" },
    { size: 180, name: "apple-touch-icon.png" },
    { size: 192, name: "android-chrome-192x192.png" },
    { size: 512, name: "android-chrome-512x512.png" },
  ];
  const files: FaviconFile[] = [];
  const icoEntries: Array<{ size: number; png: Uint8Array }> = [];
  for (const item of sizes) {
    onStage?.(`Rendering ${item.size} px icon`);
    const canvas = renderFavicon(source.image, item.size, options);
    const blob = await canvasPng(canvas);
    files.push({ name: item.name, blob });
    if (item.size === 16 || item.size === 32 || item.size === 48) {
      icoEntries.push({ size: item.size, png: new Uint8Array(await blob.arrayBuffer()) });
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  files.unshift({ name: "favicon.ico", blob: buildIco(icoEntries) });
  files.push(
    {
      name: "site.webmanifest",
      blob: new Blob([faviconManifest(options)], { type: "application/manifest+json" }),
    },
    {
      name: "favicon-snippet.html",
      blob: new Blob([faviconSnippet()], { type: "text/html" }),
    },
  );
  return files;
}

export function faviconDataUrl(
  source: LoadedImage | undefined,
  size: number,
  options: FaviconOptions,
): string {
  if (!source) return "";
  return renderFavicon(source.image, size, options).toDataURL("image/png");
}
