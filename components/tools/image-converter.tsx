"use client";

import { useState } from "react";
import { ImageQueueList } from "@/components/tools/image-queue-list";
import { ImageResults, type ImageResultItem } from "@/components/tools/image-results";
import { Field, JobStatus, OptionsPanel, useJob } from "@/components/tools/tool-kit";
import { useImageQueue } from "@/components/tools/use-image-queue";
import { Icon } from "@/components/ui/icon";
import { CancelledError, convertImage, processBatch, type ImageFormat } from "@/lib/engines/image";
import { formatBytes } from "@/lib/files/format";
import {
  cn,
  colorInput,
  colorRow,
  input,
  inputSm,
  inlineNote,
  optionHelp,
  resultBody,
  resultPanel,
  select,
  shell,
} from "@/lib/ui";

export function ImageConverterTool() {
  const queue = useImageQueue();
  const job = useJob();
  const [format, setFormat] = useState<ImageFormat>("webp");
  const [quality, setQuality] = useState(80);
  const [background, setBackground] = useState("#FFFFFF");
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const busy = job.state.status === "running";

  const start = async () => {
    setResults([]);
    setErrors([]);
    await job.run(async (signal, report) => {
      const outputs: ImageResultItem[] = [];
      const failures: string[] = [];
      const total = queue.items.filter((item) => item.loaded).length;
      let done = 0;
      await processBatch(
        queue.items.filter((item) => item.loaded),
        async (item) => {
          if (!item.loaded) return;
          try {
            const output = await convertImage(
              item.loaded,
              { format, quality, background },
              signal,
            );
            outputs.push({
              id: item.id,
              output,
              originalFile: item.file,
              originalSize: item.file.size,
            });
          } catch (error) {
            if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
              throw error;
            }
            failures.push(
              `${item.file.name}: ${error instanceof Error ? error.message : "could not be converted."}`,
            );
          } finally {
            done += 1;
            report({ stage: `Converting ${done} of ${total}`, progress: done / total });
          }
        },
        2,
        signal,
      );
      if (signal.aborted) throw new CancelledError();
      if (outputs.length === 0) {
        throw new Error("No images could be converted. Check the files and try again.");
      }
      setResults(outputs);
      setErrors(failures);
    });
  };

  const startOver = () => {
    job.reset();
    queue.clear();
    setResults([]);
    setErrors([]);
  };

  return (
    <div
      className={cn(
        shell,
        "grid grid-cols-1 items-start gap-8 pb-[72px] pt-8 min-[1101px]:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <ImageQueueList queue={queue} disabled={busy} />
        <JobStatus job={job} onRetry={start} />
        {results.length > 0 ? (
          <ImageResults
            items={results}
            errors={errors}
            zipSlug="image-converter"
            onStartOver={startOver}
            allowCompare
            notes={[
              `${format.toUpperCase()} output · ${results.length} ${results.length === 1 ? "file" : "files"} · ${formatBytes(results.reduce((sum, item) => sum + item.output.blob.size, 0))}`,
            ]}
          />
        ) : errors.length > 0 && !busy ? (
          <div className={resultPanel}>
            <div className={resultBody}>
              <h2 className="text-2xl">Some files were skipped</h2>
              <ul className="mt-3 list-disc pl-5 text-[13px] text-danger">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Convert images"
          onAction={start}
          disabled={!queue.ready || results.length > 0}
          busy={busy}
          job={job}
          onRetry={start}
          note={
            <p className={optionHelp}>
              {queue.items.length === 0
                ? "Add at least one image to begin."
                : `${queue.items.length} ${queue.items.length === 1 ? "image" : "images"} queued.`}
            </p>
          }
        >
          <Field
            label="Output format"
            htmlFor="converter-format"
            help="PNG keeps lossless detail and transparency. WebP is usually much smaller."
          >
            <select
              id="converter-format"
              className={select}
              value={format}
              onChange={(event) => setFormat(event.target.value as ImageFormat)}
              disabled={busy}
            >
              <option value="webp">WebP</option>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
            </select>
          </Field>

          {format !== "png" ? (
            <Field label={`Quality · ${quality}`} htmlFor="converter-quality" help="Higher keeps more detail and creates a larger file.">
              <input
                id="converter-quality"
                className="w-full accent-accent"
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                disabled={busy}
              />
            </Field>
          ) : (
            <p className={inlineNote}>PNG uses lossless encoding. The quality control does not apply.</p>
          )}

          {format === "jpg" ? (
            <Field label="Background" htmlFor="converter-background" help="Transparent areas are flattened onto this color.">
              <div className={colorRow}>
                <input
                  id="converter-background"
                  className={colorInput}
                  type="color"
                  value={background}
                  onChange={(event) => setBackground(event.target.value)}
                  disabled={busy}
                />
                <input
                  className={cn(input, inputSm)}
                  type="text"
                  value={background}
                  onChange={(event) => setBackground(event.target.value)}
                  aria-label="Background hex color"
                  disabled={busy}
                />
              </div>
            </Field>
          ) : null}

          <div className={inlineNote}>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="lock" size={13} />
              Metadata is removed and pixel dimensions stay unchanged.
            </span>
          </div>
        </OptionsPanel>
      </div>
    </div>
  );
}
