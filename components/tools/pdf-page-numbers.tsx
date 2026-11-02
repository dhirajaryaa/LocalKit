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
  numberPdfPages,
  parsePageRanges,
  renderPdfThumbnail,
} from "@/lib/engines/pdf";
import { downloadBlob } from "@/lib/files/download";
import { baseName, formatBytes } from "@/lib/files/format";
import { SAMPLES } from "@/lib/files/sample";
import {
  checkboxRow,
  cn,
  colorInput,
  colorRow,
  input,
  optionHelp,
  range,
  resultPreview,
  select,
  shell,
} from "@/lib/ui";

type Position =
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "top-left"
  | "top-center"
  | "top-right";
type Format = "plain" | "slash" | "page-of" | "dash";

const POSITIONS: Array<{ value: Position; label: string }> = [
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "top-left", label: "Top left" },
  { value: "top-center", label: "Top center" },
  { value: "top-right", label: "Top right" },
];

const FORMATS: Array<{ value: Format; label: string }> = [
  { value: "plain", label: "1" },
  { value: "slash", label: "1 / N" },
  { value: "page-of", label: "Page 1 of N" },
  { value: "dash", label: "- 1 -" },
];

export function PdfPageNumbersTool() {
  const pdf = useSinglePdf({ maxPages: LIMITS.pdf.maxPages, sample: SAMPLES.pdf });
  const job = useJob();
  const [position, setPosition] = useState<Position>("bottom-center");
  const [format, setFormat] = useState<Format>("slash");
  const [startAt, setStartAt] = useState(1);
  const [fontSize, setFontSize] = useState(10);
  const [margin, setMargin] = useState(24);
  const [pageRange, setPageRange] = useState("");
  const [skipFirst, setSkipFirst] = useState(false);
  const [color, setColor] = useState("#000000");
  const [result, setResult] = useState<{ blob: Blob; name: string; preview: string | null } | null>(null);
  const busy = job.state.status === "running";
  const parsed = pdf.item ? parsePageRanges(pageRange, pdf.item.pageCount) : { pages: [], error: undefined };
  const startValid = Number.isInteger(startAt) && startAt >= 1 && startAt <= 10000;
  const ready = Boolean(pdf.item) && !pdf.loading && parsed.pages.length > 0 && startValid;

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
      report({ stage: "Adding page numbers", progress: 0.3 });
      const name = `${baseName(pdf.item?.file.name ?? "document")}-numbered.pdf`;
      const bytes = await numberPdfPages(pdf.item!.file, {
        position,
        format,
        startAt,
        fontSize,
        margin,
        pages: parsed.pages,
        skipFirst,
        color,
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
    setPosition("bottom-center");
    setFormat("slash");
    setStartAt(1);
    setFontSize(10);
    setMargin(24);
    setSkipFirst(false);
    setColor("#000000");
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
            title="Numbered PDF"
            stats={[
              { label: "Pages", value: String(parsed.pages.length) },
              { label: "Start at", value: String(startAt) },
              { label: "Size", value: formatBytes(result.blob.size) },
            ]}
            preview={
              result.preview ? (
                <div className={cn(resultPreview, "mb-4 p-4")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.preview}
                    alt="First page of the numbered PDF"
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
              N is the document&apos;s total page count, not the number of selected pages.
            </p>
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Add page numbers"
          onAction={start}
          disabled={!ready || Boolean(result)}
          busy={busy}
          job={job}
          onRetry={start}
          note={
            <p className={optionHelp}>
              {!pdf.item
                ? "Add a PDF to begin."
                : `N = ${pdf.item.pageCount}. ${parsed.pages.length} pages selected.`}
            </p>
          }
        >
          <Field label="Position" htmlFor="numbers-position">
            <select
              id="numbers-position"
              className={select}
              value={position}
              onChange={(event) => setPosition(event.target.value as Position)}
              disabled={busy}
            >
              {POSITIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Format" htmlFor="numbers-format">
            <select
              id="numbers-format"
              className={select}
              value={format}
              onChange={(event) => setFormat(event.target.value as Format)}
              disabled={busy}
            >
              {FORMATS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Start at" htmlFor="numbers-start" help="The first selected page receives this number.">
            <input
              id="numbers-start"
              className={input}
              type="number"
              min={1}
              max={10000}
              value={startAt}
              onChange={(event) => setStartAt(Number(event.target.value))}
              disabled={busy}
            />
          </Field>

          <Field label={`Font size · ${fontSize} pt`} htmlFor="numbers-size">
            <input
              id="numbers-size"
              className={range}
              type="range"
              min={8}
              max={24}
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
              disabled={busy}
            />
          </Field>

          <Field label={`Margin · ${margin} pt`} htmlFor="numbers-margin">
            <input
              id="numbers-margin"
              className={range}
              type="range"
              min={12}
              max={72}
              value={margin}
              onChange={(event) => setMargin(Number(event.target.value))}
              disabled={busy}
            />
          </Field>

          <label className={checkboxRow} htmlFor="numbers-skip">
            <input
              id="numbers-skip"
              type="checkbox"
              checked={skipFirst}
              onChange={(event) => setSkipFirst(event.target.checked)}
              disabled={busy}
            />
            Skip first page
          </label>

          <PdfPageRangeField value={pageRange} onChange={setPageRange} pageCount={pdf.item?.pageCount ?? 0} disabled={busy} />

          <Field label="Color" htmlFor="numbers-color">
            <div className={colorRow}>
              <input
                id="numbers-color"
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
                aria-label="Page number hex color"
                disabled={busy}
              />
            </div>
          </Field>
        </OptionsPanel>
      </div>
    </div>
  );
}
