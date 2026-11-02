"use client";

import { useState } from "react";
import { PdfPicker, useSinglePdf } from "@/components/tools/pdf-kit";
import {
  JobStatus,
  OptionsPanel,
  ResultShell,
  SizeStats,
  StartOver,
  useJob,
} from "@/components/tools/tool-kit";
import { Icon } from "@/components/ui/icon";
import { LIMITS } from "@/lib/constants";
import { compressPdf, loadPdfJs, renderPdfThumbnail, type PdfCompressLevel } from "@/lib/engines/pdf";
import { downloadBlob } from "@/lib/files/download";
import { baseName, formatBytes } from "@/lib/files/format";
import { SAMPLES } from "@/lib/files/sample";
import { cn, inlineWarning, optionHelp, resultPreview, segmented, segmentedButton, shell } from "@/lib/ui";

const LEVELS: Array<{ id: PdfCompressLevel; label: string; description: string; keepsText: boolean }> = [
  { id: "light", label: "Light", description: "Clean metadata only", keepsText: true },
  { id: "balanced", label: "Balanced", description: "150 DPI · JPEG 72", keepsText: false },
  { id: "strong", label: "Strong", description: "110 DPI · JPEG 55", keepsText: false },
];

export function CompressPdfTool() {
  const pdf = useSinglePdf({ maxPages: 500, sample: SAMPLES.pdf });
  const job = useJob();
  const [level, setLevel] = useState<PdfCompressLevel>("balanced");
  const [result, setResult] = useState<{
    blob: Blob;
    name: string;
    original: Blob;
    larger: boolean;
    preview: string | null;
  } | null>(null);
  const busy = job.state.status === "running";
  const selected = LEVELS.find((item) => item.id === level) ?? LEVELS[1];
  const ready = Boolean(pdf.item) && !pdf.loading;

  const start = async () => {
    if (!pdf.item || !ready) return;
    setResult(null);
    await job.run(async (signal, report) => {
      const item = pdf.item;
      if (!item) return;
      const bytes = await compressPdf(item.file, level, {
        signal,
        onProgress: (update) =>
          report({
            stage: update.stage,
            progress: update.progress,
          }),
      });
      if (signal.aborted) throw new Error("Cancelled");
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      let preview: string | null = null;
      try {
        const doc = await loadPdfJs(new Uint8Array(bytes));
        preview = await renderPdfThumbnail(doc, 1, 260);
        await doc.destroy();
      } catch {
        preview = null;
      }
      setResult({
        blob,
        name: `${baseName(item.file.name)}-compressed.pdf`,
        original: item.file,
        larger: blob.size > item.file.size,
        preview,
      });
      report({ stage: "Done", progress: 1 });
    });
  };

  const startOver = () => {
    job.reset();
    pdf.clear();
    setResult(null);
    setLevel("balanced");
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
            title="Compressed PDF"
            stats={[
              { label: "Before", value: formatBytes(pdf.item?.file.size ?? result.original.size) },
              { label: "After", value: formatBytes(result.blob.size) },
              { label: "Pages", value: String(pdf.item?.pageCount ?? "—") },
            ]}
            preview={
              result.preview ? (
                <div className={cn(resultPreview, "mb-4 p-4")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.preview}
                    alt="First page of the compressed PDF"
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
                  <Icon name="download" size={15} /> Download compressed PDF
                </button>
                {result.larger ? (
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink hover:border-line-strong"
                    onClick={() => downloadBlob(result.original, pdf.item?.file.name ?? "original.pdf")}
                  >
                    <Icon name="download" size={15} /> Download original
                  </button>
                ) : null}
                <StartOver onClick={startOver} />
              </>
            }
          >
            {result.larger ? (
              <p className={inlineWarning}>
                The compressed file is larger than the original. Your PDF may already be optimized.
                Download the original instead if that is smaller.
              </p>
            ) : (
              <p className="text-xs text-ink-muted">
                Saved {formatBytes((pdf.item?.file.size ?? result.original.size) - result.blob.size)} compared with the source.
              </p>
            )}
            {!selected.keepsText ? (
              <p className="mt-3 text-xs text-ink-muted">
                Pages were flattened to images. Text is no longer selectable, and links and forms were removed.
              </p>
            ) : null}
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Compress PDF"
          onAction={start}
          disabled={!ready || Boolean(result)}
          busy={busy}
          job={job}
          onRetry={start}
          note={
            <p className={optionHelp}>
              {!pdf.item
                ? "Add a PDF to begin."
                : `${pdf.item.pageCount} pages · ${formatBytes(pdf.item.file.size)}`}
            </p>
          }
        >
          <div className={segmented} role="group" aria-label="Compression level">
            {LEVELS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={segmentedButton}
                aria-pressed={level === item.id}
                onClick={() => setLevel(item.id)}
                disabled={busy}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className={optionHelp}>{selected.description}</p>

          {!selected.keepsText ? (
            <p className={inlineWarning} role="note">
              Pages will be flattened to images. Text will no longer be selectable, and links and
              forms will be removed.
            </p>
          ) : (
            <p className={optionHelp}>
              Light keeps text selectable and only cleans metadata. Size reduction may be small or
              zero.
            </p>
          )}

          <div className="rounded-md border border-line bg-code px-3 py-2.5 text-xs leading-normal text-ink-muted">
            Scanned PDFs usually shrink. Text-heavy PDFs may grow when flattened. We show the real
            result and offer the original when it is smaller.
          </div>
          <p className={optionHelp}>Up to 500 pages. Password-protected PDFs are not supported.</p>
        </OptionsPanel>
      </div>
    </div>
  );
}
