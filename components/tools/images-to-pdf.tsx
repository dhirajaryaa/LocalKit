"use client";

import { useState } from "react";
import { ImageQueueList } from "@/components/tools/image-queue-list";
import {
  Field,
  JobStatus,
  OptionsPanel,
  ResultShell,
  StartOver,
  useJob,
} from "@/components/tools/tool-kit";
import { useImageQueue } from "@/components/tools/use-image-queue";
import { Icon } from "@/components/ui/icon";
import { LIMITS } from "@/lib/constants";
import { imagesToPdf, loadPdfJs, renderPdfThumbnail } from "@/lib/engines/pdf";
import { downloadBlob } from "@/lib/files/download";
import { formatBytes, sanitizeFileName } from "@/lib/files/format";
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

type PageSize = "a4" | "letter" | "fit";
type Orientation = "auto" | "portrait" | "landscape";
type Fit = "contain" | "cover";

export function ImagesToPdfTool() {
  const queue = useImageQueue({ maxCount: LIMITS.image.count, maxTotal: LIMITS.image.total });
  const job = useJob();
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [marginPreset, setMarginPreset] = useState("20");
  const [customMargin, setCustomMargin] = useState(20);
  const [fit, setFit] = useState<Fit>("contain");
  const [background, setBackground] = useState("#FFFFFF");
  const [outputName, setOutputName] = useState("images.pdf");
  const [result, setResult] = useState<{ blob: Blob; name: string; preview: string | null } | null>(null);
  const busy = job.state.status === "running";
  const margin = marginPreset === "custom" ? customMargin : Number(marginPreset);
  const loaded = queue.items.filter((item) => item.loaded);
  const marginValid = Number.isFinite(margin) && margin >= 0 && margin <= 72;
  const ready = loaded.length > 0 && marginValid && outputName.trim().length > 0;

  const start = async () => {
    if (!ready) return;
    setResult(null);
    await job.run(async (signal, report) => {
      const name = sanitizeFileName(
        outputName.trim().toLowerCase().endsWith(".pdf")
          ? outputName.trim()
          : `${outputName.trim()}.pdf`,
      );
      const bytes = await imagesToPdf(
        loaded.map((item) => item.file),
        {
          pageSize,
          orientation,
          margin,
          fit,
          background,
          outputName: name,
          signal,
          onProgress: (update) => report({ stage: update.stage, progress: update.progress }),
        },
      );
      if (signal.aborted) throw new Error("Cancelled");
      report({ stage: "Creating a preview", progress: 0.88 });
      let preview: string | null = null;
      try {
        const doc = await loadPdfJs(new Uint8Array(bytes));
        preview = await renderPdfThumbnail(doc, 1, 260);
        await doc.destroy();
      } catch {
        preview = null;
      }
      setResult({
        blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
        name,
        preview,
      });
      report({ stage: "Done", progress: 1 });
    });
  };

  const startOver = () => {
    job.reset();
    queue.clear();
    setResult(null);
    setPageSize("a4");
    setOrientation("auto");
    setMarginPreset("20");
    setCustomMargin(20);
    setFit("contain");
    setBackground("#FFFFFF");
    setOutputName("images.pdf");
  };

  return (
    <div
      className={cn(
        shell,
        "grid grid-cols-1 items-start gap-8 pb-[72px] pt-8 min-[1101px]:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <ImageQueueList queue={queue} disabled={busy} maxCount={LIMITS.image.count} />
        <JobStatus job={job} onRetry={start} />
        {result ? (
          <ResultShell
            title="PDF created"
            stats={[
              { label: "Pages", value: String(loaded.length) },
              { label: "Size", value: formatBytes(result.blob.size) },
              { label: "Page size", value: pageSize === "fit" ? "Fit to image" : pageSize === "a4" ? "A4" : "Letter" },
            ]}
            preview={
              result.preview ? (
                <div className={cn(resultPreview, "mb-4 p-4")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.preview}
                    alt="First page of the generated PDF"
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
              JPEG and PNG images are embedded directly where possible. WebP is converted first.
            </p>
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Create PDF"
          onAction={start}
          disabled={!ready || Boolean(result)}
          busy={busy}
          job={job}
          onRetry={start}
          note={
            <p className={optionHelp}>
              {loaded.length === 0
                ? "Add at least one image to begin."
                : `${loaded.length} ${loaded.length === 1 ? "image" : "images"} → ${loaded.length} ${loaded.length === 1 ? "page" : "pages"}.`}
            </p>
          }
        >
          <Field label="Page size" htmlFor="images-pdf-size">
            <select
              id="images-pdf-size"
              className={select}
              value={pageSize}
              onChange={(event) => setPageSize(event.target.value as PageSize)}
              disabled={busy}
            >
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
              <option value="fit">Fit to image</option>
            </select>
          </Field>

          <Field
            label="Orientation"
            htmlFor="images-pdf-orientation"
            help={pageSize === "fit" ? "Fit to image uses each image's orientation." : "Auto picks the best direction for each image."}
          >
            <select
              id="images-pdf-orientation"
              className={select}
              value={orientation}
              onChange={(event) => setOrientation(event.target.value as Orientation)}
              disabled={busy || pageSize === "fit"}
            >
              <option value="auto">Auto</option>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </Field>

          <Field label="Margin (pt)" htmlFor="images-pdf-margin">
            <div className="grid grid-cols-[1fr_88px] gap-2">
              <select
                id="images-pdf-margin"
                className={select}
                value={marginPreset}
                onChange={(event) => setMarginPreset(event.target.value)}
                disabled={busy}
              >
                <option value="0">0</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="40">40</option>
                <option value="custom">Custom</option>
              </select>
              <input
                className={input}
                type="number"
                min={0}
                max={72}
                value={marginPreset === "custom" ? customMargin : margin}
                disabled={busy || marginPreset !== "custom"}
                onChange={(event) => setCustomMargin(Number(event.target.value))}
                aria-label="Custom margin in points"
              />
            </div>
            {!marginValid ? (
              <span className={inlineDanger} role="alert">
                Use a margin from 0 to 72 points.
              </span>
            ) : null}
          </Field>

          <div className={segmented} role="group" aria-label="Image fit">
            <button
              type="button"
              className={segmentedButton}
              aria-pressed={fit === "contain"}
              onClick={() => setFit("contain")}
              disabled={busy}
            >
              Contain
            </button>
            <button
              type="button"
              className={segmentedButton}
              aria-pressed={fit === "cover"}
              onClick={() => setFit("cover")}
              disabled={busy}
            >
              Cover
            </button>
          </div>
          <p className={optionHelp}>
            Contain fits the whole image without cropping. Cover fills the content area and
            center-crops the overflow.
          </p>

          <Field label="Background" htmlFor="images-pdf-background">
            <div className={colorRow}>
              <input
                id="images-pdf-background"
                className={colorInput}
                type="color"
                value={background}
                onChange={(event) => setBackground(event.target.value)}
                disabled={busy}
              />
              <input
                className={cn(input, "h-[34px] text-[13px]")}
                type="text"
                value={background}
                onChange={(event) => setBackground(event.target.value)}
                aria-label="PDF background hex color"
                disabled={busy}
              />
            </div>
          </Field>

          <Field label="Output name" htmlFor="images-pdf-name" help="A .pdf extension is added automatically.">
            <input
              id="images-pdf-name"
              className={input}
              type="text"
              value={outputName}
              disabled={busy}
              onChange={(event) => setOutputName(event.target.value)}
            />
          </Field>

          <label className={checkboxRow}>
            <span className="text-ink-muted">EXIF orientation is applied before placement.</span>
          </label>
          <p className={optionHelp}>Up to {LIMITS.image.count} images. Transparency is flattened onto the background.</p>
        </OptionsPanel>
      </div>
    </div>
  );
}
