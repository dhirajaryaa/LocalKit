"use client";

import { useState } from "react";
import { ImageQueueList } from "@/components/tools/image-queue-list";
import { ImageResults, type ImageResultItem } from "@/components/tools/image-results";
import { Field, JobStatus, OptionsPanel, useJob } from "@/components/tools/tool-kit";
import { useImageQueue } from "@/components/tools/use-image-queue";
import {
  CancelledError,
  compressImage,
  processBatch,
  type ImageFormat,
} from "@/lib/engines/image";
import { fetchSampleFile, SAMPLES } from "@/lib/files/sample";
import { formatBytes } from "@/lib/files/format";
import {
  checkboxRow,
  cn,
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

export function ImageCompressorTool() {
  const queue = useImageQueue();
  const job = useJob();
  const [mode, setMode] = useState<"quality" | "target">("quality");
  const [quality, setQuality] = useState(75);
  const [targetValue, setTargetValue] = useState(200);
  const [targetUnit, setTargetUnit] = useState<"KB" | "MB">("KB");
  const [format, setFormat] = useState<"auto" | ImageFormat>("auto");
  const [maxWidth, setMaxWidth] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [sampleBusy, setSampleBusy] = useState(false);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warning, setWarning] = useState("");
  const busy = job.state.status === "running";

  const targetBytes = Math.round(targetValue * (targetUnit === "MB" ? 1024 * 1024 : 1024));
  const targetValid = targetBytes >= 10 * 1024 && targetBytes <= 20 * 1024 * 1024;
  const widthValid = maxWidth === 0 || (maxWidth >= 32 && maxWidth <= 16384);
  const heightValid = maxHeight === 0 || (maxHeight >= 32 && maxHeight <= 16384);
  const firstImage = queue.items.find((item) => item.loaded)?.loaded;
  const aspect = firstImage ? firstImage.width / firstImage.height : 1;

  const setWidth = (value: number) => {
    setMaxWidth(value);
    if (lockRatio && value > 0) setMaxHeight(Math.max(1, Math.round(value / aspect)));
    if (lockRatio && value === 0) setMaxHeight(0);
  };

  const setHeight = (value: number) => {
    setMaxHeight(value);
    if (lockRatio && value > 0) setMaxWidth(Math.max(1, Math.round(value * aspect)));
    if (lockRatio && value === 0) setMaxWidth(0);
  };

  const loadSample = async () => {
    setSampleBusy(true);
    try {
      const file = await fetchSampleFile(SAMPLES.image.path, SAMPLES.image.name, SAMPLES.image.type);
      await queue.addFiles([file]);
    } catch (error) {
      queue.setNotice(error instanceof Error ? error.message : "The sample could not be loaded.");
    } finally {
      setSampleBusy(false);
    }
  };

  const start = async () => {
    setResults([]);
    setErrors([]);
    setWarning("");
    await job.run(async (signal, report) => {
      const outputs: ImageResultItem[] = [];
      const failures = queue.items
        .filter((item) => item.error)
        .map((item) => `${item.file.name}: ${item.error}`);
      let missingTarget = "";
      const total = queue.items.filter((item) => item.loaded).length;
      let done = 0;
      await processBatch(
        queue.items.filter((item) => item.loaded),
        async (item) => {
          if (!item.loaded) return;
          try {
            report({
              stage: `Compressing ${done + 1} of ${total}`,
              progress: done / total,
            });
            const output = await compressImage(item.loaded, {
              mode,
              quality,
              targetBytes,
              format,
              maxWidth,
              maxHeight,
              signal,
              onStage: (stage) => report({ stage: `${item.file.name}: ${stage}` }),
            });
            outputs.push({
              id: item.id,
              output,
              originalFile: item.file,
              originalSize: item.file.size,
            });
            if (mode === "target" && !output.targetReached && !missingTarget) {
              missingTarget = `Could not reach ${formatBytes(targetBytes)}. The smallest result is ${formatBytes(output.outputSize)} at ${output.width} by ${output.height}.`;
            }
          } catch (error) {
            if (signal.aborted || (error instanceof Error && error.name === "AbortError")) throw error;
            failures.push(
              `${item.file.name}: ${error instanceof Error ? error.message : "could not be compressed."}`,
            );
          } finally {
            done += 1;
            report({ stage: `Compressed ${done} of ${total}`, progress: done / total });
          }
        },
        2,
        signal,
      );
      if (signal.aborted) throw new CancelledError();
      if (outputs.length === 0) throw new Error("No images could be compressed. Check the files and try again.");
      setResults(outputs);
      setErrors(failures);
      setWarning(missingTarget);
    });
  };

  const startOver = () => {
    job.reset();
    queue.clear();
    setResults([]);
    setErrors([]);
    setWarning("");
  };

  return (
    <div
      className={cn(
        shell,
        "grid grid-cols-1 items-start gap-8 pb-[72px] pt-8 min-[1101px]:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <ImageQueueList
          queue={queue}
          disabled={busy}
          sample={{ label: "Try a sample", onSelect: loadSample, busy: sampleBusy }}
        />
        <JobStatus job={job} onRetry={start} />
        {results.length > 0 ? (
          <ImageResults
            items={results}
            errors={errors}
            zipSlug="image-compressor"
            onStartOver={startOver}
            allowCompare
            warning={warning}
            notes={
              mode === "target"
                ? [
                    `Target ${formatBytes(targetBytes)} · format ${format === "auto" ? "WebP (auto)" : format.toUpperCase()}. Target mode is an estimate, not a guarantee.`,
                  ]
                : undefined
            }
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
          actionLabel="Compress images"
          onAction={start}
          disabled={
            !queue.ready ||
            !widthValid ||
            !heightValid ||
            (mode === "target" && !targetValid) ||
            results.length > 0
          }
          busy={busy}
          note={
            <p className={optionHelp}>
              {queue.items.length === 0
                ? "Add at least one image to begin."
                : mode === "target"
                  ? `Target: ${formatBytes(targetBytes)} per image.`
                  : `Quality ${quality}. Output keeps ${format === "auto" ? "each source format" : format.toUpperCase()}.`}
            </p>
          }
        >
          <Field label="Mode" htmlFor="compress-mode">
            <div className={segmented} id="compress-mode">
              <button
                type="button"
                className={segmentedButton}
                aria-pressed={mode === "quality"}
                onClick={() => setMode("quality")}
                disabled={busy}
              >
                Quality
              </button>
              <button
                type="button"
                className={segmentedButton}
                aria-pressed={mode === "target"}
                onClick={() => setMode("target")}
                disabled={busy}
              >
                Target size
              </button>
            </div>
          </Field>

          {mode === "quality" ? (
            <Field
              label={`Quality · ${quality}`}
              htmlFor="compress-quality"
              help="A lower quality makes a smaller file. 75 is a practical default."
            >
              <input
                id="compress-quality"
                className={range}
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                disabled={busy}
              />
            </Field>
          ) : (
            <Field
              label="Target size"
              htmlFor="compress-target"
              help="Auto format uses WebP in target mode because PNG cannot reliably hit a byte target."
            >
              <div className={twoCol}>
                <input
                  id="compress-target"
                  className={input}
                  type="number"
                  min={targetUnit === "KB" ? 10 : 0.01}
                  max={targetUnit === "KB" ? 20480 : 20}
                  step={targetUnit === "KB" ? 10 : 0.1}
                  value={targetValue}
                  onChange={(event) => setTargetValue(Number(event.target.value))}
                  disabled={busy}
                />
                <select
                  className={select}
                  value={targetUnit}
                  onChange={(event) => setTargetUnit(event.target.value as "KB" | "MB")}
                  aria-label="Target size unit"
                  disabled={busy}
                >
                  <option value="KB">KB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
              {!targetValid ? (
                <span className={cn(inlineDanger, "block")}>Use a target between 10 KB and 20 MB.</span>
              ) : null}
            </Field>
          )}

          <Field
            label="Output format"
            htmlFor="compress-format"
            help={
              mode === "target" && format === "auto"
                ? "Auto uses WebP in target mode."
                : "Auto keeps the input format in quality mode."
            }
          >
            <select
              id="compress-format"
              className={select}
              value={format}
              onChange={(event) => setFormat(event.target.value as "auto" | ImageFormat)}
              disabled={busy}
            >
              <option value="auto">Auto</option>
              <option value="webp">WebP</option>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
            </select>
          </Field>

          <div className={twoCol}>
            <Field label="Max width (px)" htmlFor="compress-width" help="0 means original.">
              <input
                id="compress-width"
                className={input}
                type="number"
                min={0}
                max={16384}
                value={maxWidth}
                onChange={(event) => setWidth(Number(event.target.value))}
                disabled={busy}
              />
            </Field>
            <Field label="Max height (px)" htmlFor="compress-height" help="0 means original.">
              <input
                id="compress-height"
                className={input}
                type="number"
                min={0}
                max={16384}
                value={maxHeight}
                onChange={(event) => setHeight(Number(event.target.value))}
                disabled={busy}
              />
            </Field>
          </div>
          {!widthValid || !heightValid ? (
            <span className={cn(inlineDanger, "block")}>Use 0 or a value from 32 to 16,384 px.</span>
          ) : null}
          <label className={checkboxRow} htmlFor="compress-lock">
            <input
              id="compress-lock"
              type="checkbox"
              checked={lockRatio}
              onChange={(event) => setLockRatio(event.target.checked)}
              disabled={busy}
            />
            Lock aspect ratio
          </label>

          <div className="rounded-md border border-line bg-code px-3 py-2.5 text-xs leading-normal text-ink-muted">
            Downscales proportionally to fit both boxes. Never crops, never upscales. Metadata is
            removed.
          </div>
        </OptionsPanel>
      </div>
    </div>
  );
}
