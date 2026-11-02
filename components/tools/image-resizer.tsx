"use client";

import { useEffect, useRef, useState } from "react";
import { ImageQueueList } from "@/components/tools/image-queue-list";
import { ImageResults, type ImageResultItem } from "@/components/tools/image-results";
import { Field, JobStatus, OptionsPanel, useJob } from "@/components/tools/tool-kit";
import { useImageQueue } from "@/components/tools/use-image-queue";
import {
  CancelledError,
  processBatch,
  resizeImage,
  type ImageFormat,
} from "@/lib/engines/image";
import {
  checkboxRow,
  cn,
  colorInput,
  colorRow,
  inlineDanger,
  input,
  optionHelp,
  range,
  resultBody,
  resultPanel,
  segmented,
  segmentedButton,
  select,
  shell,
  twoCol,
} from "@/lib/ui";

export function ImageResizerTool() {
  const queue = useImageQueue();
  const job = useJob();
  const [mode, setMode] = useState<"dimensions" | "percentage">("dimensions");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [fit, setFit] = useState<"contain" | "cover" | "stretch">("contain");
  const [percentage, setPercentage] = useState(100);
  const [allowUpscale, setAllowUpscale] = useState(false);
  const [background, setBackground] = useState("#FFFFFF");
  const [format, setFormat] = useState<"keep" | ImageFormat>("keep");
  const [quality, setQuality] = useState(85);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const initialized = useRef(false);
  const busy = job.state.status === "running";

  const firstImage = queue.items.find((item) => item.loaded)?.loaded;
  const aspect = firstImage ? firstImage.width / firstImage.height : 1;

  useEffect(() => {
    if (queue.items.length === 0) {
      initialized.current = false;
      return;
    }
    if (!initialized.current && firstImage) {
      initialized.current = true;
      setWidth(firstImage.width);
      setHeight(firstImage.height);
    }
  }, [queue.items.length, firstImage]);

  const setWidthLocked = (value: number) => {
    setWidth(value);
    if (lockRatio && value > 0) setHeight(Math.max(1, Math.round(value / aspect)));
  };
  const setHeightLocked = (value: number) => {
    setHeight(value);
    if (lockRatio && value > 0) setWidth(Math.max(1, Math.round(value * aspect)));
  };

  const dimsValid =
    mode === "percentage"
      ? percentage >= 1 && percentage <= 400
      : width >= 32 && width <= 16384 && height >= 32 && height <= 16384;

  const start = async () => {
    setResults([]);
    setErrors([]);
    await job.run(async (signal, report) => {
      const outputs: ImageResultItem[] = [];
      const failures = queue.items
        .filter((item) => item.error)
        .map((item) => `${item.file.name}: ${item.error}`);
      const total = queue.items.filter((item) => item.loaded).length;
      let done = 0;
      await processBatch(
        queue.items.filter((item) => item.loaded),
        async (item) => {
          if (!item.loaded) return;
          try {
            report({ stage: `Resizing ${done + 1} of ${total}`, progress: done / total });
            const output = await resizeImage(item.loaded, {
              mode,
              width,
              height,
              percentage,
              fit,
              allowUpscale,
              background,
              format: format === "keep" ? "keep" : format,
              quality,
              signal,
            });
            outputs.push({
              id: item.id,
              output,
              originalFile: item.file,
              originalSize: item.file.size,
            });
          } catch (error) {
            if (signal.aborted || (error instanceof Error && error.name === "AbortError")) throw error;
            failures.push(
              `${item.file.name}: ${error instanceof Error ? error.message : "could not be resized."}`,
            );
          } finally {
            done += 1;
            report({ stage: `Resized ${done} of ${total}`, progress: done / total });
          }
        },
        2,
        signal,
      );
      if (signal.aborted) throw new CancelledError();
      if (outputs.length === 0) throw new Error("No images could be resized. Check the files and try again.");
      setResults(outputs);
      setErrors(failures);
    });
  };

  const startOver = () => {
    job.reset();
    queue.clear();
    setResults([]);
    setErrors([]);
    initialized.current = false;
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
            zipSlug="image-resizer"
            onStartOver={startOver}
            allowCompare
            notes={[
              mode === "percentage"
                ? `Scaled to ${percentage}% of each original.`
                : `${fit === "contain" ? "Contained within" : fit === "cover" ? "Filled" : "Stretched to"} ${width} × ${height} px${fit === "cover" ? " with a centered crop" : ""}.`,
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
          actionLabel="Resize images"
          onAction={start}
          disabled={!queue.ready || !dimsValid || results.length > 0}
          busy={busy}
          note={
            <p className={optionHelp}>
              {queue.items.length === 0
                ? "Add at least one image to begin."
                : allowUpscale
                  ? "Upscaling is allowed."
                  : "Output will not grow larger than the original."}
            </p>
          }
        >
          <Field label="Mode" htmlFor="resize-mode">
            <div className={segmented} id="resize-mode">
              <button
                type="button"
                className={segmentedButton}
                aria-pressed={mode === "dimensions"}
                onClick={() => setMode("dimensions")}
                disabled={busy}
              >
                Dimensions
              </button>
              <button
                type="button"
                className={segmentedButton}
                aria-pressed={mode === "percentage"}
                onClick={() => setMode("percentage")}
                disabled={busy}
              >
                Percentage
              </button>
            </div>
          </Field>

          {mode === "dimensions" ? (
            <>
              <div className={twoCol}>
                <Field label="Width (px)" htmlFor="resize-width">
                  <input
                    id="resize-width"
                    className={input}
                    type="number"
                    min={32}
                    max={16384}
                    value={width || ""}
                    onChange={(event) => setWidthLocked(Number(event.target.value))}
                    disabled={busy}
                  />
                </Field>
                <Field label="Height (px)" htmlFor="resize-height">
                  <input
                    id="resize-height"
                    className={input}
                    type="number"
                    min={32}
                    max={16384}
                    value={height || ""}
                    onChange={(event) => setHeightLocked(Number(event.target.value))}
                    disabled={busy}
                  />
                </Field>
              </div>
              {!dimsValid ? (
                <span className={cn(inlineDanger, "block")}>Use dimensions from 32 to 16,384 px.</span>
              ) : null}
              <label className={checkboxRow} htmlFor="resize-lock">
                <input
                  id="resize-lock"
                  type="checkbox"
                  checked={lockRatio}
                  onChange={(event) => setLockRatio(event.target.checked)}
                  disabled={busy}
                />
                Lock aspect ratio
              </label>
              <Field label="Fit" htmlFor="resize-fit" help="Contain keeps every pixel. Cover fills the box and crops. Stretch ignores the aspect ratio.">
                <select
                  id="resize-fit"
                  className={select}
                  value={fit}
                  onChange={(event) => setFit(event.target.value as "contain" | "cover" | "stretch")}
                  disabled={busy}
                >
                  <option value="contain">Contain</option>
                  <option value="cover">Cover</option>
                  <option value="stretch">Stretch</option>
                </select>
              </Field>
            </>
          ) : (
            <Field label={`Percentage · ${percentage}%`} htmlFor="resize-percentage">
              <input
                id="resize-percentage"
                className={range}
                type="range"
                min={1}
                max={400}
                value={percentage}
                onChange={(event) => setPercentage(Number(event.target.value))}
                disabled={busy}
              />
              <input
                className={input}
                type="number"
                min={1}
                max={400}
                value={percentage}
                onChange={(event) => setPercentage(Number(event.target.value))}
                aria-label="Resize percentage"
                disabled={busy}
              />
            </Field>
          )}

          <label className={checkboxRow} htmlFor="resize-upscale">
            <input
              id="resize-upscale"
              type="checkbox"
              checked={allowUpscale}
              onChange={(event) => setAllowUpscale(event.target.checked)}
              disabled={busy}
            />
            Allow upscaling
          </label>

          <Field label="Output format" htmlFor="resize-format">
            <select
              id="resize-format"
              className={select}
              value={format}
              onChange={(event) => setFormat(event.target.value as "keep" | ImageFormat)}
              disabled={busy}
            >
              <option value="keep">Keep original</option>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </Field>

          {format === "jpg" || format === "webp" ? (
            <Field label={`Quality · ${quality}`} htmlFor="resize-quality">
              <input
                id="resize-quality"
                className={range}
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                disabled={busy}
              />
            </Field>
          ) : null}

          <Field label="Background" htmlFor="resize-background" help="Used when flattening a transparent image to JPG.">
            <div className={colorRow}>
              <input
                id="resize-background"
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
                aria-label="Background hex color"
                disabled={busy}
              />
            </div>
          </Field>
        </OptionsPanel>
      </div>
    </div>
  );
}
