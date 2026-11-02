"use client";

import { useEffect, useState } from "react";
import { PdfPageRangeField, PdfPicker, allPagesRange, useSinglePdf } from "@/components/tools/pdf-kit";
import {
  JobStatus,
  OptionsPanel,
  ResultShell,
  StartOver,
  useJob,
} from "@/components/tools/tool-kit";
import { Icon } from "@/components/ui/icon";
import { LIMITS } from "@/lib/constants";
import { parsePageRanges, pdfToImages, type PdfImageOutput } from "@/lib/engines/pdf";
import { downloadBlob, downloadZip } from "@/lib/files/download";
import { baseName, formatBytes } from "@/lib/files/format";
import { SAMPLES } from "@/lib/files/sample";
import {
  cn,
  inlineWarning,
  input,
  optionHelp,
  resultPreview,
  select,
  shell,
} from "@/lib/ui";

type Format = "png" | "jpg" | "webp";

interface ResultItem extends PdfImageOutput {
  url: string;
}

export function PdfToImagesTool() {
  const pdf = useSinglePdf({ maxPages: LIMITS.pdf.maxPages, sample: SAMPLES.pdf });
  const job = useJob();
  const [format, setFormat] = useState<Format>("png");
  const [quality, setQuality] = useState(85);
  const [dpi, setDpi] = useState<72 | 150 | 300>(150);
  const [range, setRange] = useState("");
  const [result, setResult] = useState<ResultItem[]>([]);
  const [reduced, setReduced] = useState(false);
  const busy = job.state.status === "running";
  const parsed = pdf.item ? parsePageRanges(range, pdf.item.pageCount) : { pages: [], error: undefined };
  const ready = Boolean(pdf.item) && !pdf.loading && parsed.pages.length > 0;

  useEffect(() => {
    if (!pdf.item) {
      setRange("");
      return;
    }
    setRange(allPagesRange(pdf.item.pageCount));
    setResult([]);
  }, [pdf.item?.id]);

  useEffect(() => {
    return () => {
      for (const item of result) URL.revokeObjectURL(item.url);
    };
  }, [result]);

  const start = async () => {
    if (!pdf.item || !ready) return;
    setResult([]);
    setReduced(false);
    await job.run(async (signal, report) => {
      const item = pdf.item;
      if (!item) return;
      const outputs = await pdfToImages(item.file, {
        format,
        quality: quality / 100,
        dpi,
        pages: parsed.pages,
        signal,
        onProgress: (update) => report({ stage: update.stage, progress: update.progress }),
      });
      if (signal.aborted) throw new Error("Cancelled");
      setResult(outputs.map((output) => ({ ...output, url: URL.createObjectURL(output.blob) })));
      setReduced(outputs.some((output) => output.reduced));
      report({ stage: "Done", progress: 1 });
    });
  };

  const startOver = () => {
    job.reset();
    pdf.clear();
    setResult([]);
    setReduced(false);
    setFormat("png");
    setQuality(85);
    setDpi(150);
  };

  const total = result.reduce((sum, item) => sum + item.blob.size, 0);

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
        {result.length > 0 ? (
          <ResultShell
            title={`${result.length} ${result.length === 1 ? "image" : "images"}`}
            stats={[
              { label: "Pages", value: String(result.length) },
              { label: "Total size", value: formatBytes(total) },
              { label: "Format", value: format.toUpperCase() },
            ]}
            actions={
              <>
                {result.length === 1 ? (
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:brightness-90"
                    onClick={() => downloadBlob(result[0].blob, result[0].name)}
                  >
                    <Icon name="download" size={15} /> Download image
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:brightness-90"
                    onClick={() =>
                      void downloadZip(
                        result.map((item) => ({ name: item.name, blob: item.blob })),
                        `localkit-pdf-pages-${baseName(pdf.item?.file.name ?? "pdf")}.zip`,
                      )
                    }
                  >
                    <Icon name="download" size={15} /> Download all (.zip)
                  </button>
                )}
                <StartOver onClick={startOver} />
              </>
            }
          >
            {reduced ? (
              <p className={inlineWarning}>
                One or more pages hit the 8,192 px side limit, so their render scale was reduced.
              </p>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {result.map((item) => (
                <div key={item.name} className="overflow-hidden rounded-lg border border-line bg-bg">
                  <div className="flex aspect-[3/4] items-center justify-center bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={`Rendered ${item.name}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[10px]">{item.name}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-ink-muted">
                        {item.width} × {item.height} · {formatBytes(item.blob.size)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded text-ink-muted hover:bg-code hover:text-ink"
                      aria-label={`Download ${item.name}`}
                      onClick={() => downloadBlob(item.blob, item.name)}
                    >
                      <Icon name="download" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Convert to images"
          onAction={start}
          disabled={!ready || result.length > 0}
          busy={busy}
          job={job}
          onRetry={start}
          note={
            <p className={optionHelp}>
              {!pdf.item
                ? "Add a PDF to begin."
                : `${parsed.pages.length} ${parsed.pages.length === 1 ? "page" : "pages"} selected from ${pdf.item.pageCount}.`}
            </p>
          }
        >
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-muted">
              Format
            </span>
            <select
              className={select}
              value={format}
              onChange={(event) => setFormat(event.target.value as Format)}
              disabled={busy}
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="webp">WebP</option>
            </select>
          </label>

          {format !== "png" ? (
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-muted">
                Quality · {quality}
              </span>
              <input
                className="w-full accent-accent"
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                disabled={busy}
              />
            </label>
          ) : (
            <p className={optionHelp}>PNG is lossless. Quality does not apply.</p>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-muted">
              Resolution
            </span>
            <select
              className={select}
              value={dpi}
              onChange={(event) => setDpi(Number(event.target.value) as 72 | 150 | 300)}
              disabled={busy}
            >
              <option value={72}>72 DPI</option>
              <option value={150}>150 DPI</option>
              <option value={300}>300 DPI</option>
            </select>
          </label>

          <PdfPageRangeField
            value={range}
            onChange={setRange}
            pageCount={pdf.item?.pageCount ?? 0}
            disabled={busy}
            help="Pages are rendered in document order. Each side is capped at 8,192 px."
          />
          <p className={optionHelp}>This tool does not extract text or run OCR.</p>
        </OptionsPanel>
      </div>
    </div>
  );
}
