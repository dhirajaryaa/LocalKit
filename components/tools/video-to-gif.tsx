"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Field,
  JobStatus,
  OptionsPanel,
  ResultShell,
  StartOver,
  useBlobUrl,
  useJob,
} from "@/components/tools/tool-kit";
import {
  VideoPicker,
  VideoPreview,
  VideoTimeField,
  VideoTimeline,
  useSingleVideo,
} from "@/components/tools/video-kit";
import { Icon } from "@/components/ui/icon";
import {
  videoToGif,
  type GifDither,
  type GifLoop,
  type VideoOutput,
} from "@/lib/engines/video";
import { downloadBlob } from "@/lib/files/download";
import {
  clamp,
  formatBytes,
  formatDuration,
  formatDurationExact,
} from "@/lib/files/format";
import { SAMPLES } from "@/lib/files/sample";
import {
  cn,
  inlineDanger,
  inlineWarning,
  input,
  optionHelp,
  select,
  shell,
  twoCol,
} from "@/lib/ui";

const FPS_OPTIONS = [8, 10, 12, 15, 20, 24];
const WIDTH_OPTIONS = [320, 480, 640, 800];

export function VideoToGifTool() {
  const video = useSingleVideo({ sample: SAMPLES.video });
  const job = useJob();
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(5);
  const [fps, setFps] = useState(12);
  const [width, setWidth] = useState(480);
  const [customWidth, setCustomWidth] = useState("480");
  const [colors, setColors] = useState<256 | 128 | 64>(256);
  const [dither, setDither] = useState<GifDither>("floyd_steinberg");
  const [loop, setLoop] = useState<GifLoop>("infinite");
  const [loopCount, setLoopCount] = useState(3);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<VideoOutput | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const resultUrl = useBlobUrl(result?.blob);
  const busy = job.state.status === "running";
  const item = video.item;
  const duration = item?.duration ?? 0;
  const selection = Math.max(0, end - start);
  const widthValid = width >= 120 && width <= 1200;
  const selectionValid =
    Boolean(item) &&
    duration > 0 &&
    start >= 0 &&
    end <= duration + 0.001 &&
    selection >= 0.2 &&
    selection <= 30.0001 &&
    widthValid;
  const effectiveWidth = item?.width ? Math.min(width, item.width) : width;
  const outputHeight =
    item?.width && item.height
      ? Math.max(2, Math.round((item.height * effectiveWidth) / item.width / 2) * 2)
      : 0;
  const largeGif = result ? result.blob.size > 20 * 1024 * 1024 : false;

  useEffect(() => {
    if (!item) {
      setStart(0);
      setEnd(0);
      return;
    }
    setStart(0);
    setEnd(Math.min(5, item.duration));
    setResult(null);
  }, [item?.file]);

  useEffect(() => {
    return () => {
      previewRef.current?.pause();
    };
  }, []);

  const updateSelection = (nextStart: number, nextEnd: number) => {
    setStart(clamp(nextStart, 0, duration));
    setEnd(clamp(nextEnd, 0.2, duration));
    setPlaying(false);
    previewRef.current?.pause();
    setResult(null);
  };

  const playSelection = async () => {
    const player = previewRef.current;
    if (!player || !selectionValid) return;
    if (playing) {
      player.pause();
      setPlaying(false);
      return;
    }
    player.currentTime = start;
    try {
      await player.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  const startGif = async () => {
    if (!item || !selectionValid) return;
    setResult(null);
    previewRef.current?.pause();
    setPlaying(false);
    await job.run(async (signal, report) => {
      const output = await videoToGif(item, {
        start,
        end,
        fps,
        width,
        colors,
        dither,
        loop,
        loopCount,
        signal,
        onStage: (stage) => report({ stage }),
        onProgress: (fraction) => report({ progress: fraction }),
      });
      if (signal.aborted) throw new Error("Cancelled");
      setResult(output);
      report({ stage: "Done", progress: 1 });
    });
  };

  const startOver = () => {
    job.reset();
    video.clear();
    setResult(null);
    setStart(0);
    setEnd(0);
    setFps(12);
    setWidth(480);
    setCustomWidth("480");
    setColors(256);
    setDither("floyd_steinberg");
    setLoop("infinite");
    setLoopCount(3);
    setPlaying(false);
  };

  const selectionSummary = useMemo(() => {
    if (!duration) return "Select a video with a readable duration.";
    return `${formatDurationExact(start)} – ${formatDurationExact(end)} · ${formatDuration(selection)} selected`;
  }, [duration, end, selection, start]);

  return (
    <div
      className={cn(
        shell,
        "grid grid-cols-1 items-start gap-8 pb-[72px] pt-8 min-[1101px]:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <VideoPicker source={video} disabled={busy} />
        <JobStatus job={job} onRetry={startGif} />

        {item ? (
          <div className="rounded-xl border border-line bg-surface p-4">
            <VideoPreview
              source={item}
              videoRef={previewRef}
              onTimeUpdate={() => {
                const player = previewRef.current;
                if (!player || !playing) return;
                if (player.currentTime >= end - 0.01) {
                  player.pause();
                  setPlaying(false);
                }
              }}
              className="border-0"
            />
            <div className="mt-4">
              <VideoTimeline
                duration={duration}
                start={start}
                end={end}
                disabled={busy || duration <= 0}
                onChange={updateSelection}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-[11px] text-ink-muted">{selectionSummary}</div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs text-ink hover:border-line-strong disabled:opacity-40"
                  onClick={() => void playSelection()}
                  disabled={busy || !selectionValid}
                >
                  <Icon name={playing ? "pause" : "play"} size={13} />
                  {playing ? "Stop preview" : "Play selection"}
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs text-ink hover:border-line-strong disabled:opacity-40"
                  onClick={() => {
                    const player = previewRef.current;
                    if (!player) return;
                    updateSelection(clamp(player.currentTime, 0, duration), end);
                  }}
                  disabled={busy || duration <= 0}
                >
                  Set start to playhead
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs text-ink hover:border-line-strong disabled:opacity-40"
                  onClick={() => {
                    const player = previewRef.current;
                    if (!player) return;
                    updateSelection(start, clamp(player.currentTime, start + 0.2, duration));
                  }}
                  disabled={busy || duration <= 0}
                >
                  Set end to playhead
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <VideoTimeField
                label="Start"
                value={start}
                max={Math.max(0, end - 0.2)}
                onCommit={(value) => updateSelection(value, end)}
                disabled={busy || duration <= 0}
              />
              <VideoTimeField
                label="End"
                value={end}
                max={duration}
                onCommit={(value) => updateSelection(start, value)}
                disabled={busy || duration <= 0}
              />
            </div>
            {!selectionValid && duration > 0 ? (
              <p className="mt-3 text-xs text-danger" role="alert">
                Choose a selection between 0.2 and 30 seconds, with the end after the start.
              </p>
            ) : null}
            {selection > 10 && selection <= 30 ? (
              <p className={cn(inlineWarning, "mt-3")}>
                GIFs longer than 10 seconds are usually large. A shorter range or a smaller width
                will help.
              </p>
            ) : null}
            {selection > 30 ? (
              <p className={cn(inlineDanger, "mt-3")} role="alert">
                A GIF selection must be 30 seconds or shorter.
              </p>
            ) : null}
          </div>
        ) : null}

        {result && item ? (
          <ResultShell
            title="Animated GIF"
            stats={[
              { label: "File", value: formatBytes(result.blob.size) },
              { label: "Duration", value: formatDuration(result.duration) },
              { label: "Size", value: `${effectiveWidth} × ${outputHeight} px` },
            ]}
            preview={
              resultUrl ? (
                <div className="flex items-center justify-center overflow-hidden rounded-lg border border-line bg-code p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="max-h-[420px] max-w-full"
                    src={resultUrl}
                    alt="Animated GIF preview"
                  />
                </div>
              ) : null
            }
            actions={
              <>
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-accent bg-accent px-3 text-[13px] font-medium text-accent-ink"
                  onClick={() => downloadBlob(result.blob, result.fileName)}
                >
                  <Icon name="download" size={14} />
                  Download GIF
                </button>
                <StartOver onClick={startOver} />
              </>
            }
          >
            {largeGif ? (
              <p className={cn(inlineWarning, "mt-3")} role="status">
                This GIF is larger than 20 MB. It may be slow to share or open on older devices.
              </p>
            ) : null}
            <p className="mt-3 text-xs text-ink-muted">
              {fps} fps · {colors} colors · dither {dither === "floyd_steinberg" ? "Floyd–Steinberg" : dither}
            </p>
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Create GIF"
          onAction={startGif}
          disabled={!selectionValid}
          busy={busy}
          job={job}
          onRetry={startGif}
          note={
            <p className={optionHelp}>
              {!item
                ? "Add a video to begin."
                : !duration
                  ? "This video's duration could not be read, so a GIF range cannot be chosen."
                  : selectionValid
                    ? `${formatDuration(selection)} at ${fps} fps. The real output size is reported after encoding.`
                    : "Set a valid range between 0.2 and 30 seconds."}
            </p>
          }
        >
          <Field
            label="Frame rate"
            htmlFor="gif-fps"
            help="Higher frame rates look smoother but make larger files."
          >
            <select
              id="gif-fps"
              className={select}
              value={fps}
              onChange={(event) => setFps(Number(event.target.value))}
              disabled={busy}
            >
              {FPS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value} fps
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Width"
            htmlFor="gif-width"
            help="Height follows the video's aspect ratio. The output never upscales beyond the source."
          >
            <select
              id="gif-width"
              className={select}
              value={WIDTH_OPTIONS.includes(width) ? String(width) : "custom"}
              onChange={(event) => {
                if (event.target.value === "custom") {
                  const next = Number(customWidth) || 480;
                  setWidth(clamp(next, 120, 1200));
                  return;
                }
                setWidth(Number(event.target.value));
              }}
              disabled={busy}
            >
              {WIDTH_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value} px
                </option>
              ))}
              <option value="custom">Custom width</option>
            </select>
            {!WIDTH_OPTIONS.includes(width) ? (
              <div className={twoCol}>
                <input
                  className={input}
                  type="number"
                  min={120}
                  max={1200}
                  value={customWidth}
                  onChange={(event) => {
                    const next = event.target.value;
                    setCustomWidth(next);
                    const parsed = Number(next);
                    if (Number.isFinite(parsed)) setWidth(clamp(parsed, 120, 1200));
                  }}
                  aria-label="Custom GIF width in pixels"
                  disabled={busy}
                />
                <span className="inline-flex h-10 items-center rounded-lg border border-line bg-code px-3 font-mono text-xs text-ink-muted">
                  px
                </span>
              </div>
            ) : null}
            {!widthValid ? (
              <span className="text-xs text-danger" role="alert">
                Use a width from 120 to 1,200 px.
              </span>
            ) : null}
            {item?.width && width > item.width ? (
              <span className={optionHelp}>
                Your source is {item.width} px wide, so the GIF will use {item.width} px.
              </span>
            ) : null}
          </Field>

          <Field label="Colors" htmlFor="gif-colors" help="Fewer colors can reduce the file size and change the look.">
            <select
              id="gif-colors"
              className={select}
              value={colors}
              onChange={(event) => setColors(Number(event.target.value) as 256 | 128 | 64)}
              disabled={busy}
            >
              <option value={256}>256 colors</option>
              <option value={128}>128 colors</option>
              <option value={64}>64 colors</option>
            </select>
          </Field>

          <Field label="Dither" htmlFor="gif-dither" help="Floyd–Steinberg usually looks best for photos. Bayer is more graphic.">
            <select
              id="gif-dither"
              className={select}
              value={dither}
              onChange={(event) => setDither(event.target.value as GifDither)}
              disabled={busy}
            >
              <option value="floyd_steinberg">Floyd–Steinberg</option>
              <option value="bayer">Bayer</option>
              <option value="none">None</option>
            </select>
          </Field>

          <Field label="Loop" htmlFor="gif-loop">
            <select
              id="gif-loop"
              className={select}
              value={loop}
              onChange={(event) => setLoop(event.target.value as GifLoop)}
              disabled={busy}
            >
              <option value="infinite">Loop forever</option>
              <option value="once">Play once</option>
              <option value="count">Repeat a set number</option>
            </select>
            {loop === "count" ? (
              <div className={twoCol}>
                <input
                  className={input}
                  type="number"
                  min={2}
                  max={10}
                  value={loopCount}
                  onChange={(event) => setLoopCount(clamp(Number(event.target.value), 2, 10))}
                  aria-label="Loop count"
                  disabled={busy}
                />
                <span className="inline-flex h-10 items-center rounded-lg border border-line bg-code px-3 font-mono text-xs text-ink-muted">
                  loops
                </span>
              </div>
            ) : null}
          </Field>

          <div className="rounded-md border border-line bg-code px-3 py-2.5 text-xs leading-normal text-ink-muted">
            A two-pass palette keeps colors cleaner. The output is a real GIF at the selected width
            and frame rate.
          </div>

          <p className={optionHelp}>
            Video encoding runs locally and is slow on phones. A desktop browser is recommended.
          </p>
        </OptionsPanel>
      </div>
    </div>
  );
}
