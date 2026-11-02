"use client";

import { useRef, useState } from "react";
import {
  Dropzone,
  Field,
  FileList,
  FileRow,
  JobStatus,
  OptionsPanel,
  ResultShell,
  SizeStats,
  StartOver,
  useBlobUrl,
  useJob,
} from "@/components/tools/tool-kit";
import { Icon } from "@/components/ui/icon";
import { LIMITS } from "@/lib/constants";
import { compressGif, getGifInfo, type GifCompressResult, type GifInfo } from "@/lib/engines/gif";
import { downloadBlob } from "@/lib/files/download";
import { baseName, formatBytes, formatDuration } from "@/lib/files/format";
import { validateGif } from "@/lib/files/validate";
import {
  checkboxRow,
  cn,
  inlineDanger,
  inlineWarning,
  input,
  optionHelp,
  resultPreview,
  select,
  shell,
} from "@/lib/ui";

type WidthMode = "original" | "custom";
type Fps = "keep" | 24 | 15 | 12 | 10 | 8;

export function GifCompressorTool() {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<GifInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [widthMode, setWidthMode] = useState<WidthMode>("original");
  const [width, setWidth] = useState(480);
  const [fps, setFps] = useState<Fps>("keep");
  const [colors, setColors] = useState(256);
  const [dither, setDither] = useState(true);
  const [loop, setLoop] = useState<"keep" | "infinite" | "once">("keep");
  const [result, setResult] = useState<GifCompressResult | null>(null);
  const job = useJob();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultUrl = useBlobUrl(result?.blob);
  const busy = job.state.status === "running";
  const widthValid = widthMode === "original" || (width >= 120 && width <= 1200);
  const sourceFps = info ? info.frameCount / Math.max(0.001, info.durationMs / 1000) : 0;
  const ready = Boolean(file) && !loading && widthValid;

  const addFiles = async (files: File[]) => {
    const next = files[0];
    if (!next) return;
    setError("");
    setNotice("");
    if (files.length > 1) setNotice("This tool takes one GIF. The first file was used.");
    if (next.size === 0) {
      setError("This file is empty.");
      return;
    }
    if (next.size > LIMITS.gif.perFile) {
      setError(
        `${next.name} is ${formatBytes(next.size)}. The GIF limit is ${formatBytes(LIMITS.gif.perFile)}.`,
      );
      return;
    }
    setLoading(true);
    try {
      const valid = await validateGif(next);
      if (!valid.ok) throw new Error(valid.error ?? "That file is not a GIF.");
      const nextInfo = await getGifInfo(next);
      if (nextInfo.frameCount > LIMITS.gif.maxFrames) {
        throw new Error(`This GIF has ${nextInfo.frameCount} frames. The limit is ${LIMITS.gif.maxFrames}.`);
      }
      setFile(next);
      setInfo(nextInfo);
      setResult(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This GIF could not be read.");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setFile(null);
    setInfo(null);
    setResult(null);
    setError("");
    setNotice("");
  };

  const start = async () => {
    if (!file || !ready) return;
    setResult(null);
    await job.run(async (signal, report) => {
      const output = await compressGif(file, {
        width: widthMode === "original" ? "original" : width,
        fps,
        colors,
        dither,
        loop,
        signal,
        onProgress: (update) => report({ stage: update.stage, progress: update.progress }),
      });
      if (signal.aborted) throw new Error("Cancelled");
      setResult(output);
      report({ stage: "Done", progress: 1 });
    });
  };

  const startOver = () => {
    job.reset();
    clear();
    setWidthMode("original");
    setWidth(480);
    setFps("keep");
    setColors(256);
    setDither(true);
    setLoop("keep");
  };

  return (
    <div
      className={cn(
        shell,
        "grid grid-cols-1 items-start gap-8 pb-[72px] pt-8 min-[1101px]:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        {!file ? (
          <div className="grid gap-3">
            <Dropzone
              accept="image/gif,.gif"
              formats="GIF"
              limitText={`up to ${formatBytes(LIMITS.gif.perFile)}`}
              onFiles={addFiles}
              disabled={busy || loading}
            />
            {loading ? <p className={optionHelp}>Reading GIF…</p> : null}
            {error ? (
              <p className={inlineDanger} role="alert">
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3">
            <FileList
              summary={
                info
                  ? `${info.width} × ${info.height} · ${info.frameCount} ${info.frameCount === 1 ? "frame" : "frames"} · ${formatBytes(info.size)}`
                  : formatBytes(file.size)
              }
              onAdd={() => inputRef.current?.click()}
              addLabel="Replace"
              disabled={busy || loading}
            >
              <FileRow
                name={file.name}
                size={file.size}
                meta={info ? `${info.width} × ${info.height} · ${formatDuration(info.durationMs / 1000)}` : "GIF"}
                thumbnail={<Icon name="film" size={18} />}
                onRemove={clear}
                disabled={busy || loading}
              />
            </FileList>
            {loading ? <p className={optionHelp}>Reading GIF…</p> : null}
            {notice ? (
              <p className={inlineWarning} role="status">
                {notice}
              </p>
            ) : null}
            {error ? (
              <p className={inlineDanger} role="alert">
                {error}
              </p>
            ) : null}
            <input
              ref={inputRef}
              type="file"
              accept="image/gif,.gif"
              className="sr-only"
              tabIndex={-1}
              disabled={busy || loading}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length) void addFiles(files);
                event.target.value = "";
              }}
            />
          </div>
        )}

        <JobStatus job={job} onRetry={start} />

        {result ? (
          <ResultShell
            title="Compressed GIF"
            stats={[
              { label: "Before", value: formatBytes(result.originalSize) },
              { label: "After", value: formatBytes(result.blob.size) },
              { label: "Frames", value: `${result.originalFrames} → ${result.frameCount}` },
              { label: "Dimensions", value: `${result.width} × ${result.height}` },
            ]}
            preview={
              resultUrl ? (
                <div className={cn(resultPreview, "mb-4 p-4")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt="Compressed animated GIF" className="max-h-[360px] w-auto" />
                </div>
              ) : null
            }
            actions={
              <>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:brightness-90"
                  onClick={() => downloadBlob(result.blob, `${baseName(file?.name ?? "animation")}-compressed.gif`)}
                >
                  <Icon name="download" size={15} /> Download compressed GIF
                </button>
                {result.blob.size > result.originalSize ? (
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink hover:border-line-strong"
                    onClick={() => file && downloadBlob(file, file.name)}
                  >
                    <Icon name="download" size={15} /> Download original
                  </button>
                ) : null}
                <StartOver onClick={startOver} />
              </>
            }
          >
            <SizeStats original={result.originalSize} output={result.blob.size} />
            <p className="mt-3 text-xs text-ink-muted">
              Output duration: {formatDuration(result.durationMs / 1000)} · loop{" "}
              {result.loop === 0 ? "infinite" : result.loop > 0 ? `${result.loop} times` : "once"}.
            </p>
            {result.blob.size > result.originalSize ? (
              <p className={inlineWarning}>
                The compressed GIF is larger than the original. Re-encoding can add overhead on an
                already optimized file. Download the original instead if it is smaller.
              </p>
            ) : null}
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Compress GIF"
          onAction={start}
          disabled={!ready || Boolean(result)}
          busy={busy}
          job={job}
          onRetry={start}
          note={
            <p className={optionHelp}>
              {!file
                ? "Add a GIF to begin."
                : info
                  ? `${info.frameCount} frames · ${formatDuration(info.durationMs / 1000)} · ${sourceFps.toFixed(1)} fps average.`
                  : formatBytes(file.size)}
            </p>
          }
        >
          <Field
            label="Width (px)"
            htmlFor="gif-compress-width"
            help={
              widthMode === "original"
                ? `Original width is capped at 800 px. Source: ${info?.width ?? "—"} px.`
                : "Height follows the source aspect ratio. 120 to 1,200 px."
            }
          >
            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <select
                className={select}
                value={widthMode}
                onChange={(event) => setWidthMode(event.target.value as WidthMode)}
                disabled={busy}
              >
                <option value="original">Original</option>
                <option value="custom">Custom</option>
              </select>
              <input
                id="gif-compress-width"
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

          <Field
            label="Frame rate"
            htmlFor="gif-compress-fps"
            help={
              info && fps !== "keep" && Number(fps) > sourceFps
                ? "The source is already below this rate. Higher FPS will not add frames."
                : "Lower rates accumulate delays so the duration stays close."
            }
          >
            <select
              id="gif-compress-fps"
              className={select}
              value={fps}
              onChange={(event) =>
                setFps(event.target.value === "keep" ? "keep" : (Number(event.target.value) as Fps))
              }
              disabled={busy}
            >
              <option value="keep">Keep source</option>
              <option value={24}>24 fps</option>
              <option value={15}>15 fps</option>
              <option value={12}>12 fps</option>
              <option value={10}>10 fps</option>
              <option value={8}>8 fps</option>
            </select>
          </Field>

          <Field label="Colors" htmlFor="gif-compress-colors">
            <select
              id="gif-compress-colors"
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

          <label className={checkboxRow} htmlFor="gif-compress-dither">
            <input
              id="gif-compress-dither"
              type="checkbox"
              checked={dither}
              onChange={(event) => setDither(event.target.checked)}
              disabled={busy}
            />
            Dither colors
          </label>

          <Field label="Loop" htmlFor="gif-compress-loop">
            <select
              id="gif-compress-loop"
              className={select}
              value={loop}
              onChange={(event) => setLoop(event.target.value as "keep" | "infinite" | "once")}
              disabled={busy}
            >
              <option value="keep">Keep source</option>
              <option value="infinite">Infinite</option>
              <option value="once">Once</option>
            </select>
          </Field>

          <div className="rounded-md border border-line bg-code px-3 py-2.5 text-xs leading-normal text-ink-muted">
            Re-encoding is lossy. Resizing and fewer colors usually save the most space. An
            already-optimized GIF can grow; the original is offered when that happens.
          </div>
          <p className={optionHelp}>Up to {LIMITS.gif.maxFrames} frames and {formatBytes(LIMITS.gif.perFile)}.</p>
        </OptionsPanel>
      </div>
    </div>
  );
}
