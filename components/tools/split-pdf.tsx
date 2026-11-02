"use client";

import { useEffect, useState } from "react";
import { PdfPageRangeField, PdfPicker, allPagesRange, useSinglePdf } from "@/components/tools/pdf-kit";
import {
  DownloadRow,
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
  extractPdfPages,
  loadPdfJs,
  parsePageRanges,
  renderPdfThumbnail,
  splitPdfEvery,
} from "@/lib/engines/pdf";
import { downloadBlob, downloadZip } from "@/lib/files/download";
import { baseName, formatBytes } from "@/lib/files/format";
import { cn, inlineWarning, optionHelp, resultPreview, segmented, segmentedButton, shell } from "@/lib/ui";
import { SAMPLES } from "@/lib/files/sample";

type Mode = "extract" | "split";

interface Output {
  name: string;
  blob: Blob;
  pages: number;
}

export function SplitPdfTool() {
  const pdf = useSinglePdf({ maxPages: LIMITS.pdf.maxPages, sample: SAMPLES.pdf });
  const job = useJob();
  const [mode, setMode] = useState<Mode>("extract");
  const [range, setRange] = useState("");
  const [every, setEvery] = useState(10);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const busy = job.state.status === "running";
  const parsed = pdf.item ? parsePageRanges(range, pdf.item.pageCount) : { pages: [], error: undefined };
  const selectedCount = parsed.pages.length;
  const everyValid = Number.isInteger(every) && every >= 1 && every <= 500;
  const ready =
    Boolean(pdf.item) &&
    !pdf.loading &&
    (mode === "extract" ? selectedCount > 0 : everyValid);

  useEffect(() => {
    if (!pdf.item) {
      setRange("");
      return;
    }
    setRange(allPagesRange(pdf.item.pageCount));
    setOutputs([]);
    setPreview(null);
  }, [pdf.item?.id]);

  const start = async () => {
    if (!pdf.item || !ready) return;
    setOutputs([]);
    setPreview(null);
    await job.run(async (signal, report) => {
      const item = pdf.item;
      if (!item) return;
      const base = baseName(item.file.name);
      let result: Output[] = [];
      if (mode === "extract") {
        report({ stage: `Extracting ${selectedCount} pages`, progress: 0.2 });
        const bytes = await extractPdfPages(item.file, parsed.pages, `${base}-extracted`);
        if (signal.aborted) throw new Error("Cancelled");
        result = [
          {
            name: `${base}-extracted.pdf`,
            blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
            pages: selectedCount,
          },
        ];
      } else {
        report({ stage: `Splitting every ${every} pages`, progress: 0.2 });
        const parts = await splitPdfEvery(item.file, every);
        if (signal.aborted) throw new Error("Cancelled");
        result = parts.map((part) => ({
          name: part.name,
          blob: new Blob([new Uint8Array(part.bytes)], { type: "application/pdf" }),
          pages: part.pages,
        }));
      }
      report({ stage: "Creating a preview", progress: 0.85 });
      let thumbnail: string | null = null;
      try {
        const source = await loadPdfJs(new Uint8Array(await result[0].blob.arrayBuffer()));
        thumbnail = await renderPdfThumbnail(source, 1, 260);
        await source.destroy();
      } catch {
        thumbnail = null;
      }
      setOutputs(result);
      setPreview(thumbnail);
      report({ stage: "Done", progress: 1 });
    });
  };

  const startOver = () => {
    job.reset();
    pdf.clear();
    setOutputs([]);
    setPreview(null);
    setMode("extract");
    setEvery(10);
  };

  const totalPages = outputs.reduce((sum, output) => sum + output.pages, 0);
  const totalBytes = outputs.reduce((sum, output) => sum + output.blob.size, 0);

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
        {outputs.length > 0 ? (
          <ResultShell
            title={outputs.length === 1 ? "Extracted PDF" : `${outputs.length} PDF parts`}
            stats={[
              { label: "Pages out", value: String(totalPages) },
              { label: "Files", value: String(outputs.length) },
              { label: "Size", value: formatBytes(totalBytes) },
            ]}
            preview={
              preview ? (
                <div className={cn(resultPreview, "mb-4 p-4")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="First page of the output PDF"
                    className="max-h-[320px] w-auto rounded border border-line bg-white"
                  />
                </div>
              ) : null
            }
            actions={
              <>
                {outputs.length === 1 ? (
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:brightness-90"
                    onClick={() => downloadBlob(outputs[0].blob, outputs[0].name)}
                  >
                    <Icon name="download" size={15} /> Download PDF
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:brightness-90"
                    onClick={() => void downloadZip(outputs, `localkit-split-${baseName(pdf.item?.file.name ?? "pdf")}.zip`)}
                  >
                    <Icon name="download" size={15} /> Download all (.zip)
                  </button>
                )}
                <StartOver onClick={startOver} />
              </>
            }
          >
            <div className="mt-4 overflow-hidden rounded-lg border border-line">
              {outputs.map((output) => (
                <DownloadRow
                  key={output.name}
                  name={output.name}
                  blob={output.blob}
                  meta={`${output.pages} ${output.pages === 1 ? "page" : "pages"} · ${formatBytes(output.blob.size)}`}
                  onDownload={() => downloadBlob(output.blob, output.name)}
                />
              ))}
            </div>
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel={mode === "extract" ? "Extract pages" : "Split PDF"}
          onAction={start}
          disabled={!ready || outputs.length > 0}
          busy={busy}
          job={job}
          onRetry={start}
          note={
            <p className={optionHelp}>
              {!pdf.item
                ? "Add a PDF to begin."
                : mode === "extract"
                  ? `${selectedCount} of ${pdf.item.pageCount} pages selected.`
                  : everyValid
                    ? `Creates ${Math.ceil(pdf.item.pageCount / every)} ${Math.ceil(pdf.item.pageCount / every) === 1 ? "file" : "files"}.`
                    : "Use 1 to 500 pages per part."}
            </p>
          }
        >
          <div className={segmented} role="group" aria-label="Split mode">
            <button
              type="button"
              className={segmentedButton}
              aria-pressed={mode === "extract"}
              onClick={() => setMode("extract")}
              disabled={busy}
            >
              Extract pages
            </button>
            <button
              type="button"
              className={segmentedButton}
              aria-pressed={mode === "split"}
              onClick={() => setMode("split")}
              disabled={busy}
            >
              Split every N
            </button>
          </div>

          {mode === "extract" ? (
            <PdfPageRangeField
              value={range}
              onChange={setRange}
              pageCount={pdf.item?.pageCount ?? 0}
              disabled={busy}
              help="Duplicates are removed. Pages are output in ascending document order, regardless of the order typed."
            />
          ) : (
            <Field
              label="Split every (pages)"
              htmlFor="split-every"
              help={`The last part may be smaller. ${pdf.item ? `This PDF has ${pdf.item.pageCount} pages.` : ""}`}
            >
              <input
                id="split-every"
                className="h-10 w-full rounded-lg border border-line bg-raised px-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-55"
                type="number"
                min={1}
                max={500}
                step={1}
                value={every}
                onChange={(event) => setEvery(Number(event.target.value))}
                disabled={busy}
              />
              {!everyValid ? (
                <span className="text-xs text-danger" role="alert">
                  Use a whole number from 1 to 500.
                </span>
              ) : null}
            </Field>
          )}

          {pdf.item && parsed.error && mode === "extract" ? (
            <p className={inlineWarning} role="status">
              Fix the page range to continue.
            </p>
          ) : null}
          <div className="rounded-md border border-line bg-code px-3 py-2.5 text-xs leading-normal text-ink-muted">
            {pdf.item
              ? `${pdf.item.pageCount} pages in the source. Metadata is cleaned and text stays selectable.`
              : "Password-protected PDFs are not supported."}
          </div>
        </OptionsPanel>
      </div>
    </div>
  );
}
