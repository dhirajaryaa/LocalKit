"use client";

import { useEffect, useState } from "react";
import { PdfPageRangeField, PdfPicker, allPagesRange, useSinglePdf } from "@/components/tools/pdf-kit";
import {
  Field,
  JobStatus,
  OptionsPanel,
  ResultShell,
  StartOver,
  useJob,
} from "@/components/tools/tool-kit";
import { Icon } from "@/components/ui/icon";
import { LIMITS } from "@/lib/constants";
import {
  loadPdfJs,
  parsePageRanges,
  renderPdfThumbnail,
  watermarkPdf,
} from "@/lib/engines/pdf";
import { downloadBlob } from "@/lib/files/download";
import { baseName, formatBytes } from "@/lib/files/format";
import { SAMPLES } from "@/lib/files/sample";
import {
  checkboxRow,
  cn,
  colorInput,
  colorRow,
  inlineDanger,
  input,
  optionHelp,
  range,
  resultPreview,
  segmented,
  segmentedButton,
  select,
  shell,
} from "@/lib/ui";

type FontChoice = "Helvetica" | "Times Roman" | "Courier";

export function WatermarkPdfTool() {
  const pdf = useSinglePdf({ maxPages: LIMITS.pdf.maxPages, sample: SAMPLES.pdf });
  const job = useJob();
  const [text, setText] = useState("CONFIDENTIAL");
  const [font, setFont] = useState<FontChoice>("Helvetica");
  const [fontSize, setFontSize] = useState(48);
  const [autoSize, setAutoSize] = useState(true);
  const [opacity, setOpacity] = useState(20);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState("#000000");
  const [layout, setLayout] = useState<"center" | "tiled">("tiled");
  const [pageRange, setPageRange] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string; preview: string | null } | null>(null);
  const busy = job.state.status === "running";
  const parsed = pdf.item ? parsePageRanges(pageRange, pdf.item.pageCount) : { pages: [], error: undefined };
  const unsupported = /[^\u0020-\u007e\u00a0-\u00ff]/u.test(text);
  const textValid = text.trim().length >= 1 && text.length <= 80 && !unsupported;
  const sizeValid = autoSize || (fontSize >= 12 && fontSize <= 120);
  const ready =
    Boolean(pdf.item) &&
    !pdf.loading &&
    textValid &&
    sizeValid &&
    parsed.pages.length > 0;

  useEffect(() => {
    if (!pdf.item) {
      setPageRange("");
      return;
    }
    setPageRange(allPagesRange(pdf.item.pageCount));
    setResult(null);
  }, [pdf.item?.id]);

  const start = async () => {
    if (!pdf.item || !ready) return;
    setResult(null);
    await job.run(async (signal, report) => {
      report({ stage: "Adding watermark", progress: 0.3 });
      const name = `${baseName(pdf.item?.file.name ?? "document")}-watermarked.pdf`;
      const bytes = await watermarkPdf(pdf.item!.file, {
        text: text.trim(),
        font,
        fontSize: autoSize ? "auto" : fontSize,
        opacity,
        rotation,
        color,
        layout,
        pages: parsed.pages,
      });
      if (signal.aborted) throw new Error("Cancelled");
      report({ stage: "Creating a preview", progress: 0.85 });
      let preview: string | null = null;
      try {
        const doc = await loadPdfJs(new Uint8Array(bytes));
        preview = await renderPdfThumbnail(doc, 1, 260);
        await doc.destroy();
      } catch {
        preview = null;
      }
      setResult({ blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), name, preview });
      report({ stage: "Done", progress: 1 });
    });
  };

  const startOver = () => {
    job.reset();
    pdf.clear();
    setResult(null);
    setText("CONFIDENTIAL");
    setFont("Helvetica");
    setFontSize(48);
    setAutoSize(true);
    setOpacity(20);
    setRotation(45);
    setColor("#000000");
    setLayout("tiled");
  };

  return (
    <div
      className={cn(
        shell,
        "grid grid-cols-1 items-start gap-8 pb-[72px] pt-8 min-[1101px]:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <PdfPicker source={pdf} disabled={busy} />
        <JobStatus job={job} onRetry={start} />
        {result ? (
          <ResultShell
            title="Watermarked PDF"
            stats={[
              { label: "Pages", value: String(parsed.pages.length) },
              { label: "Layout", value: layout === "center" ? "Center" : "Tiled" },
              { label: "Size", value: formatBytes(result.blob.size) },
            ]}
            preview={
              result.preview ? (
                <div className={cn(resultPreview, "mb-4 p-4")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.preview}
                    alt="First page of the watermarked PDF"
                    className="max-h-[320px] w-auto rounded border border-line bg-white"
                  />
                </div>
              ) : null
            }
            actions={
              <>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:brightness-90"
                  onClick={() => downloadBlob(result.blob, result.name)}
                >
                  <Icon name="download" size={15} /> Download PDF
                </button>
                <StartOver onClick={startOver} />
              </>
            }
          >
            <p className="mt-3 text-xs text-ink-muted">
              Text and links remain in the document. The watermark is a separate content stream.
            </p>
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Add watermark"
          onAction={start}
          disabled={!ready || Boolean(result)}
          busy={busy}
          job={job}
          onRetry={start}
          note={
            <p className={optionHelp}>
              {!pdf.item
                ? "Add a PDF to begin."
                : `${parsed.pages.length} of ${pdf.item.pageCount} pages selected.`}
            </p>
          }
        >
          <Field label="Watermark text" htmlFor="watermark-text" help={`${text.length} of 80 characters. Basic Latin characters only.`}>
            <input
              id="watermark-text"
              className={input}
              type="text"
              maxLength={80}
              value={text}
              onChange={(event) => setText(event.target.value)}
              disabled={busy}
            />
            {unsupported ? (
              <span className={inlineDanger} role="alert">
                This font does not support some characters. Use basic Latin characters.
              </span>
            ) : null}
          </Field>

          <div className={segmented} role="group" aria-label="Watermark layout">
            <button
              type="button"
              className={segmentedButton}
              aria-pressed={layout === "center"}
              onClick={() => setLayout("center")}
              disabled={busy}
            >
              Center
            </button>
            <button
              type="button"
              className={segmentedButton}
              aria-pressed={layout === "tiled"}
              onClick={() => setLayout("tiled")}
              disabled={busy}
            >
              Tiled
            </button>
          </div>

          <Field label="Font" htmlFor="watermark-font">
            <select
              id="watermark-font"
              className={select}
              value={font}
              onChange={(event) => setFont(event.target.value as FontChoice)}
              disabled={busy}
            >
              <option value="Helvetica">Helvetica</option>
              <option value="Times Roman">Times Roman</option>
              <option value="Courier">Courier</option>
            </select>
          </Field>

          <label className={checkboxRow} htmlFor="watermark-auto">
            <input
              id="watermark-auto"
              type="checkbox"
              checked={autoSize}
              onChange={(event) => setAutoSize(event.target.checked)}
              disabled={busy}
            />
            Auto font size
          </label>
          <Field label={`Font size · ${autoSize ? "Auto" : `${fontSize} pt`}`} htmlFor="watermark-size">
            <input
              id="watermark-size"
              className={range}
              type="range"
              min={12}
              max={120}
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
              disabled={busy || autoSize}
            />
          </Field>

          <Field label={`Opacity · ${opacity}%`} htmlFor="watermark-opacity">
            <input
              id="watermark-opacity"
              className={range}
              type="range"
              min={5}
              max={100}
              value={opacity}
              onChange={(event) => setOpacity(Number(event.target.value))}
              disabled={busy}
            />
          </Field>

          <Field label={`Rotation · ${rotation}°`} htmlFor="watermark-rotation">
            <input
              id="watermark-rotation"
              className={range}
              type="range"
              min={-90}
              max={90}
              value={rotation}
              onChange={(event) => setRotation(Number(event.target.value))}
              disabled={busy}
            />
          </Field>

          <Field label="Color" htmlFor="watermark-color">
            <div className={colorRow}>
              <input
                id="watermark-color"
                className={colorInput}
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                disabled={busy}
              />
              <input
                className={cn(input, "h-[34px] text-[13px]")}
                type="text"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                aria-label="Watermark hex color"
                disabled={busy}
              />
            </div>
          </Field>

          <PdfPageRangeField value={pageRange} onChange={setPageRange} pageCount={pdf.item?.pageCount ?? 0} disabled={busy} />
          <p className={optionHelp}>
            Standard PDF fonts support WinAnsi characters. Text and links stay in the document.
          </p>
        </OptionsPanel>
      </div>
    </div>
  );
}
