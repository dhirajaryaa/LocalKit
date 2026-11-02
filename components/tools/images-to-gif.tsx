"use client";

import { useState } from "react";
import { ImageQueueList } from "@/components/tools/image-queue-list";
import {
  Field,
  JobStatus,
  OptionsPanel,
  ResultShell,
  StartOver,
  useBlobUrl,
  useJob,
} from "@/components/tools/tool-kit";
import { useImageQueue } from "@/components/tools/use-image-queue";
import { Icon } from "@/components/ui/icon";
import { LIMITS } from "@/lib/constants";
import { encodeImagesToGif, type GifOutput } from "@/lib/engines/gif";
import { downloadBlob } from "@/lib/files/download";
import { formatBytes, formatDuration } from "@/lib/files/format";
import {
  checkboxRow,
  cn,
  colorInput,
  colorRow,
  inlineWarning,
  input,
  optionHelp,
  resultPreview,
  select,
  shell,
} from "@/lib/ui";

export function ImagesToGifTool() {
  const queue = useImageQueue({ maxCount: 300, maxTotal: LIMITS.image.total });
  const job = useJob();
  const [delayMs, setDelayMs] = useState(200);
  const [loopChoice, setLoopChoice] = useState("infinite");
  const [widthMode, setWidthMode] = useState<"original" | "custom">("custom");
  const [width, setWidth] = useState(480);
  const [fit, setFit] = useState<"contain" | "cover">("contain");
  const [backgroundChoice, setBackgroundChoice] = useState<"transparent" | "white" | "custom">("white");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [colors, setColors] = useState(256);
  const [dither, setDither] = useState(true);
  const [result, setResult] = useState<GifOutput | null>(null);
  const resultUrl = useBlobUrl(result?.blob);
  const busy = job.state.status === "running";
  const loaded = queue.items.filter((item) => item.loaded);
  const loop = loopChoice === "infinite" ? 0 : loopChoice === "once" ? -1 : Number(loopChoice);
  const widthValid = widthMode === "original" || (width >= 120 && width <= 1200);
  const durationMs = loaded.length * delayMs;
  const ready = loaded.length >= 2 && delayMs >= 20 && delayMs <= 5000 && widthValid && durationMs <= 30000;

  const start = async () => {
    if (!ready) return;
    setResult(null);
    await job.run(async (signal, report) => {
      const output = await encodeImagesToGif(
        loaded.map((item) => item.loaded!).filter(Boolean),
        {
          width: widthMode === "original" ? "original" : width,
          delayMs,
          loop,
          fit,
          background:
            backgroundChoice === "transparent"
              ? null
              : backgroundChoice === "white"
                ? "#FFFFFF"
                : backgroundColor,
          colors,
          dither,
          signal,
          onProgress: (update) => report({ stage: update.stage, progress: update.progress }),
        },
      );
      if (signal.aborted) throw new Error("Cancelled");
      setResult(output);
      report({ stage: "Done", progress: 1 });
    });
  };

  const startOver = () => {
    job.reset();
    queue.clear();
    setResult(null);
    setDelayMs(200);
    setLoopChoice("infinite");
    setWidthMode("custom");
    setWidth(480);
    setFit("contain");
    setBackgroundChoice("white");
    setBackgroundColor("#FFFFFF");
    setColors(256);
    setDither(true);
  };

  return (
    <div
      className={cn(
        shell,
        "grid grid-cols-1 items-start gap-8 pb-[72px] pt-8 min-[1101px]:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <ImageQueueList queue={queue} disabled={busy} maxCount={300} />
        {queue.items.length >= 2 ? (
          <div className="rounded-xl border border-line bg-surface p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.05em] text-ink-muted">
              Frame order
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {queue.items.map((item, index) => (
                <div
                  key={item.id}
                  className="w-[82px] shrink-0 overflow-hidden rounded-md border border-line bg-bg"
                >
                  <div className="flex aspect-square items-center justify-center bg-white p-1">
                    {item.loaded ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.loaded.objectUrl}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <Icon name="image" size={18} />
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-line px-1 py-1">
                    <span className="font-mono text-[10px] text-ink-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex">
                      <button
                        type="button"
                        className="inline-flex size-6 items-center justify-center rounded text-ink-muted hover:bg-code disabled:opacity-30"
                        aria-label={`Move frame ${index + 1} left`}
                        disabled={busy || index === 0}
                        onClick={() => queue.move(item.id, -1)}
                      >
                        <Icon name="arrow-left" size={12} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex size-6 items-center justify-center rounded text-ink-muted hover:bg-code disabled:opacity-30"
                        aria-label={`Move frame ${index + 1} right`}
                        disabled={busy || index === queue.items.length - 1}
                        onClick={() => queue.move(item.id, 1)}
                      >
                        <Icon name="arrow-right" size={12} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex size-6 items-center justify-center rounded text-ink-muted hover:bg-code hover:text-danger"
                        aria-label={`Remove frame ${index + 1}`}
                        disabled={busy}
                        onClick={() => queue.remove(item.id)}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <JobStatus job={job} onRetry={start} />
        {result ? (
          <ResultShell
            title="Animated GIF"
            stats={[
              { label: "Frames", value: String(result.frameCount) },
              { label: "Dimensions", value: `${result.width} × ${result.height}` },
              { label: "Size", value: formatBytes(result.blob.size) },
            ]}
            preview={
              resultUrl ? (
                <div className={cn(resultPreview, "mb-4 p-4")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt="Generated animated GIF" className="max-h-[360px] w-auto" />
                </div>
              ) : null
            }
            actions={
              <>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:brightness-90"
                  onClick={() => downloadBlob(result.blob, "localkit-animation.gif")}
                >
                  <Icon name="download" size={15} /> Download GIF
                </button>
                <StartOver onClick={startOver} />
              </>
            }
          >
            <p className="mt-3 text-xs text-ink-muted">
              {formatDuration(result.durationMs / 1000)} animation · {result.frameCount} frames.
              {result.blob.size > 20 * 1024 * 1024 ? " This GIF is above 20 MB and may be slow to share." : ""}
            </p>
            {result.mixedTransparency ? (
              <p className={inlineWarning}>
                Some frames have transparency and some do not. The transparent background uses a
                hard 1-bit edge, so mixed frames may show a visible background color.
              </p>
            ) : null}
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Create GIF"
          onAction={start}
          disabled={!ready || Boolean(result)}
          busy={busy}
          job={job}
          onRetry={start}
          note={
            <p className={optionHelp}>
              {loaded.length < 2
                ? "Add at least two images."
                : `${loaded.length} frames · ${formatDuration(durationMs / 1000)} total.`}
            </p>
          }
        >
          <Field label="Frame delay (ms)" htmlFor="gif-delay" help="One delay applies to every frame. 20 to 5,000 ms.">
            <input
              id="gif-delay"
              className={input}
              type="number"
              min={20}
              max={5000}
              step={10}
              value={delayMs}
              onChange={(event) => setDelayMs(Number(event.target.value))}
              disabled={busy}
            />
            {durationMs > 30000 ? (
              <span className="text-xs text-danger" role="alert">
                The animation would exceed 30 seconds. Reduce the delay or remove frames.
              </span>
            ) : null}
          </Field>

          <Field label="Loop" htmlFor="gif-loop">
            <select
              id="gif-loop"
              className={select}
              value={loopChoice}
              onChange={(event) => setLoopChoice(event.target.value)}
              disabled={busy}
            >
              <option value="infinite">Infinite</option>
              <option value="once">Once</option>
              {Array.from({ length: 19 }, (_, index) => index + 2).map((count) => (
                <option key={count} value={String(count)}>
                  {count} times
                </option>
              ))}
            </select>
          </Field>

          <Field label="Width (px)" htmlFor="gif-width" help="Height follows the first image's aspect ratio. 120 to 1,200 px.">
            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <select
                className={select}
                value={widthMode}
                onChange={(event) => setWidthMode(event.target.value as "original" | "custom")}
                disabled={busy}
              >
                <option value="custom">Custom</option>
                <option value="original">Original</option>
              </select>
              <input
                id="gif-width"
                className={input}
                type="number"
                min={120}
                max={1200}
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
                disabled={busy || widthMode === "original"}
              />
            </div>
            {!widthValid ? (
              <span className="text-xs text-danger" role="alert">
                Use a width from 120 to 1,200 px.
              </span>
            ) : null}
          </Field>

          <Field label="Fit" htmlFor="gif-fit">
            <select
              id="gif-fit"
              className={select}
              value={fit}
              onChange={(event) => setFit(event.target.value as "contain" | "cover")}
              disabled={busy}
            >
              <option value="contain">Contain · letterbox</option>
              <option value="cover">Cover · center crop</option>
            </select>
          </Field>

          <Field label="Background" htmlFor="gif-background">
            <div className="grid gap-2">
              <select
                id="gif-background"
                className={select}
                value={backgroundChoice}
                onChange={(event) =>
                  setBackgroundChoice(event.target.value as "transparent" | "white" | "custom")
                }
                disabled={busy}
              >
                <option value="white">White</option>
                <option value="transparent">Transparent</option>
                <option value="custom">Custom color</option>
              </select>
              {backgroundChoice === "custom" ? (
                <div className={colorRow}>
                  <input
                    className={colorInput}
                    type="color"
                    value={backgroundColor}
                    onChange={(event) => setBackgroundColor(event.target.value)}
                    aria-label="GIF background color"
                    disabled={busy}
                  />
                  <input
                    className={cn(input, "h-[34px] text-[13px]")}
                    type="text"
                    value={backgroundColor}
                    onChange={(event) => setBackgroundColor(event.target.value)}
                    aria-label="GIF background hex color"
                    disabled={busy}
                  />
                </div>
              ) : null}
            </div>
          </Field>

          <Field label="Colors" htmlFor="gif-colors">
            <select
              id="gif-colors"
              className={select}
              value={colors}
              onChange={(event) => setColors(Number(event.target.value))}
              disabled={busy}
            >
              <option value={256}>256</option>
              <option value={128}>128</option>
              <option value={64}>64</option>
            </select>
          </Field>
          <label className={checkboxRow} htmlFor="gif-dither">
            <input
              id="gif-dither"
              type="checkbox"
              checked={dither}
              onChange={(event) => setDither(event.target.checked)}
              disabled={busy}
            />
            Dither colors
          </label>
          <p className={optionHelp}>
            Transparency is 1-bit. The first image sets the canvas aspect ratio for every frame.
          </p>
        </OptionsPanel>
      </div>
    </div>
  );
}
