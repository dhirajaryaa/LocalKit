import { PDFDocument, StandardFonts, degrees, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { validatePdf } from "@/lib/files/validate";
import { formatBytes } from "@/lib/files/format";

export interface PdfInfo {
  pageCount: number;
  title: string;
  size: number;
  encrypted: boolean;
}

export async function readPdf(file: File): Promise<PDFDocument> {
  const validation = await validatePdf(file);
  if (!validation.ok) throw new Error(validation.error);
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (error) {
    if (/encrypt|password/i.test(String(error))) {
      throw new Error("This PDF is password-protected. Password-protected PDFs are not supported.");
    }
    throw new Error("This PDF is corrupt or could not be read.");
  }
}

export async function getPdfInfo(file: File): Promise<PdfInfo> {
  const document = await readPdf(file);
  return {
    pageCount: document.getPageCount(),
    title: document.getTitle() ?? "",
    size: file.size,
    encrypted: false,
  };
}

export function cleanMetadata(document: PDFDocument, title: string): void {
  document.setTitle(title);
  document.setAuthor("");
  document.setSubject("");
  document.setKeywords([]);
  document.setProducer("LocalKit");
  document.setCreator("LocalKit");
}

export async function savePdf(document: PDFDocument): Promise<Uint8Array> {
  return await document.save({ useObjectStreams: true, addDefaultPage: false });
}

export interface PageRangeParse {
  pages: number[];
  error?: string;
}

export function parsePageRanges(input: string, pageCount: number): PageRangeParse {
  const text = input.trim();
  if (!text) return { pages: [], error: "Enter at least one page or range." };
  if (/^\s*$/.test(text)) return { pages: [], error: "Enter at least one page or range." };
  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return { pages: [], error: "Enter at least one page or range." };
  const pages = new Set<number>();
  for (const part of parts) {
    if (/^-/.test(part)) return { pages: [], error: `Invalid range "${part}". Pages start at 1.` };
    if (/-$/.test(part)) return { pages: [], error: `Invalid range "${part}". Open-ended ranges are not supported.` };
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!match) return { pages: [], error: `Invalid range "${part}". Use a number or a range like 1-3.` };
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end < 1) return { pages: [], error: `Invalid range "${part}". Pages start at 1.` };
    if (start > end) return { pages: [], error: `Invalid range "${part}". The start is after the end.` };
    if (end > pageCount) {
      return { pages: [], error: `Range "${part}" is beyond page ${pageCount}.` };
    }
    for (let page = start; page <= end; page += 1) pages.add(page);
  }
  return { pages: [...pages].sort((a, b) => a - b) };
}

export async function mergePdfFiles(files: File[], outputTitle: string): Promise<Uint8Array> {
  if (files.length < 2) throw new Error("Add at least two PDFs.");
  const merged = await PDFDocument.create();
  let totalPages = 0;
  for (const file of files) {
    const source = await readPdf(file);
    const count = source.getPageCount();
    if (count === 0) throw new Error(`${file.name} has no pages.`);
    if (totalPages + count > 1000) {
      throw new Error("The merged document would exceed 1,000 pages.");
    }
    const copied = await merged.copyPages(source, source.getPageIndices());
    for (const page of copied) merged.addPage(page);
    totalPages += count;
  }
  cleanMetadata(merged, outputTitle);
  return await savePdf(merged);
}

export async function extractPdfPages(
  file: File,
  pages: number[],
  outputTitle: string,
): Promise<Uint8Array> {
  const source = await readPdf(file);
  const sourceCount = source.getPageCount();
  if (pages.some((page) => page < 1 || page > sourceCount)) {
    throw new Error(`This PDF has ${sourceCount} pages.`);
  }
  const target = await PDFDocument.create();
  const copied = await target.copyPages(source, pages.map((page) => page - 1));
  for (const page of copied) target.addPage(page);
  cleanMetadata(target, outputTitle);
  return await savePdf(target);
}

export async function splitPdfEvery(
  file: File,
  every: number,
): Promise<Array<{ name: string; bytes: Uint8Array; pages: number }>> {
  const source = await readPdf(file);
  const total = source.getPageCount();
  const outputs: Array<{ name: string; bytes: Uint8Array; pages: number }> = [];
  const base = file.name.replace(/\.pdf$/i, "");
  for (let start = 0; start < total; start += every) {
    const indices: number[] = [];
    for (let index = start; index < Math.min(start + every, total); index += 1) indices.push(index);
    const target = await PDFDocument.create();
    const copied = await target.copyPages(source, indices);
    for (const page of copied) target.addPage(page);
    cleanMetadata(target, `${base}-part-${String(outputs.length + 1).padStart(2, "0")}`);
    const bytes = await savePdf(target);
    outputs.push({
      name: `${base}-part-${String(outputs.length + 1).padStart(2, "0")}.pdf`,
      bytes,
      pages: indices.length,
    });
  }
  return outputs;
}

export interface PdfJsLike {
  numPages: number;
  getPage: (page: number) => Promise<{
    getViewport: (params: { scale: number; rotation?: number }) => {
      width: number;
      height: number;
    };
    render: (params: Record<string, unknown>) => { promise: Promise<void>; cancel: () => void };
    cleanup: () => void;
  }>;
  destroy: () => Promise<void>;
}

let pdfjsConfigured = false;

export async function loadPdfJs(file: File | Uint8Array): Promise<PdfJsLike> {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjsConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    pdfjsConfigured = true;
  }
  const data = file instanceof Uint8Array ? file : new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({
    data,
    enableXfa: false,
    useWorkerFetch: true,
  });
  return (await task.promise) as unknown as PdfJsLike;
}

export interface RenderedPage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  scale: number;
}

export async function renderPdfPage(
  pdf: PdfJsLike,
  pageNumber: number,
  scale: number,
  maxSide = 8192,
  background = "#FFFFFF",
): Promise<RenderedPage> {
  const page = await pdf.getPage(pageNumber);
  let viewport = page.getViewport({ scale });
  let actualScale = scale;
  if (viewport.width > maxSide || viewport.height > maxSide) {
    actualScale = scale * Math.min(maxSide / viewport.width, maxSide / viewport.height);
    viewport = page.getViewport({ scale: actualScale });
  }
  const canvas = globalThis.document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas is unavailable in this browser.");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const renderTask = page.render({ canvas, viewport, background, intent: "display" });
  await renderTask.promise;
  page.cleanup();
  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
    scale: actualScale,
  };
}

export async function renderPdfThumbnail(
  document: PdfJsLike,
  pageNumber: number,
  maxWidth = 180,
): Promise<string> {
  const page = await document.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / viewport.width;
  const thumb = await renderPdfPage(document, pageNumber, scale, 600);
  return thumb.canvas.toDataURL("image/jpeg", 0.72);
}

export function visiblePageSize(page: PDFPage): { width: number; height: number; rotation: number } {
  const size = page.getSize();
  const rotation = page.getRotation().angle % 360;
  if (rotation === 90 || rotation === 270) {
    return { width: size.height, height: size.width, rotation };
  }
  return { width: size.width, height: size.height, rotation };
}

export async function watermarkPdf(
  file: File,
  options: {
    text: string;
    font: "Helvetica" | "Times Roman" | "Courier";
    fontSize: number | "auto";
    opacity: number;
    rotation: number;
    color: string;
    layout: "center" | "tiled";
    pages: number[];
  },
): Promise<Uint8Array> {
  const document = await readPdf(file);
  const fontChoice =
    options.font === "Times Roman"
      ? StandardFonts.TimesRoman
      : options.font === "Courier"
        ? StandardFonts.Courier
        : StandardFonts.Helvetica;
  const font = await document.embedFont(fontChoice);
  try {
    font.encodeText(options.text);
  } catch {
    throw new Error("This font does not support some characters. Use basic Latin characters.");
  }
  const color = hexToRgb(options.color);
  for (const pageNumber of options.pages) {
    if (pageNumber < 1 || pageNumber > document.getPageCount()) continue;
    const page = document.getPage(pageNumber - 1);
    const { width, height, rotation } = visiblePageSize(page);
    const size =
      options.fontSize === "auto"
        ? Math.max(
            12,
            Math.min(options.layout === "center" ? 72 : 36, Math.min(width, height) * 0.09),
          )
        : options.fontSize;
    const textWidth = font.widthOfTextAtSize(options.text, size);
    const textHeight = font.heightAtSize(size);
    const angleForPage = options.rotation - rotation;
    const rad = (angleForPage * Math.PI) / 180;
    const drawOnce = (centerX: number, centerY: number) => {
      const originX = centerX - (textWidth / 2) * Math.cos(rad) + (textHeight / 2) * Math.sin(rad);
      const originY = centerY - (textWidth / 2) * Math.sin(rad) - (textHeight / 2) * Math.cos(rad);
      page.drawText(options.text, {
        x: originX,
        y: originY,
        size,
        font,
        color,
        opacity: options.opacity / 100,
        rotate: degrees(angleForPage),
      });
    };
    if (options.layout === "center") {
      drawOnce(width / 2, height / 2);
    } else {
      const stepX = Math.max(textWidth * 1.35, 120);
      const stepY = Math.max(textHeight * 7, 100);
      for (let y = -stepY; y < height + stepY; y += stepY) {
        for (let x = -stepX; x < width + stepX; x += stepX) {
          drawOnce(x, y);
        }
      }
    }
  }
  cleanMetadata(document, `${file.name.replace(/\.pdf$/i, "")}-watermarked`);
  return await savePdf(document);
}

export async function numberPdfPages(
  file: File,
  options: {
    position:
      | "bottom-left"
      | "bottom-center"
      | "bottom-right"
      | "top-left"
      | "top-center"
      | "top-right";
    format: "plain" | "slash" | "page-of" | "dash";
    startAt: number;
    fontSize: number;
    margin: number;
    pages: number[];
    skipFirst: boolean;
    color: string;
  },
): Promise<Uint8Array> {
  const document = await readPdf(file);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const total = document.getPageCount();
  const color = hexToRgb(options.color);
  let number = options.startAt;
  for (const pageNumber of options.pages) {
    if (pageNumber < 1 || pageNumber > total) continue;
    if (options.skipFirst && pageNumber === 1) {
      number += 1;
      continue;
    }
    const page = document.getPage(pageNumber - 1);
    const { width, height, rotation } = visiblePageSize(page);
    const text = formatPageNumber(options.format, number, total);
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const bottom = options.position.startsWith("bottom");
    const left = options.position.endsWith("left");
    const center = options.position.endsWith("center");
    const x = left
      ? options.margin
      : center
        ? (width - textWidth) / 2
        : width - textWidth - options.margin;
    const y = bottom ? options.margin : height - options.margin - options.fontSize;
    const angle = -rotation;
    const rad = (angle * Math.PI) / 180;
    const originX = x * Math.cos(rad) - y * Math.sin(rad);
    const originY = x * Math.sin(rad) + y * Math.cos(rad);
    // Rotation transforms around the bottom-left. Adjust for swapped page dimensions.
    const adjusted =
      rotation === 90 || rotation === 270
        ? { x: originX, y: originY + (rotation === 90 ? 0 : 0) }
        : { x: originX, y: originY };
    page.drawText(text, {
      x: adjusted.x,
      y: adjusted.y,
      size: options.fontSize,
      font,
      color,
      rotate: degrees(angle),
    });
    number += 1;
  }
  cleanMetadata(document, `${file.name.replace(/\.pdf$/i, "")}-numbered`);
  return await savePdf(document);
}

export function formatPageNumber(
  format: "plain" | "slash" | "page-of" | "dash",
  number: number,
  total: number,
): string {
  if (format === "slash") return `${number} / ${total}`;
  if (format === "page-of") return `Page ${number} of ${total}`;
  if (format === "dash") return `- ${number} -`;
  return String(number);
}

export function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean;
  const value = Number.parseInt(full || "000000", 16);
  return rgb(
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  );
}

export function bytesLabel(bytes: number): string {
  return formatBytes(bytes);
}

export function safePdfTitle(name: string): string {
  return name.replace(/\.pdf$/i, "").slice(0, 100);
}

export function drawFontNote(font: PDFFont, text: string): string | null {
  try {
    font.encodeText(text);
    return null;
  } catch {
    return "This font does not support some characters. Use basic Latin characters.";
  }
}
