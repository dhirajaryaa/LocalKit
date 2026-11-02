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
import { trimVideo, type VideoOutput } from "@/lib/engines/video";
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
  inlineWarning,
  optionHelp,
  segmented,
  segmentedButton,
  shell,
} from "@/lib/ui";

export function VideoTrimmerTool() {
  const video = useSingleVideo({ sample: SAMPLES.video });
  const job = useJob();
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [quality, setQuality] = useState<"balanced" | "high">("balanced");
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<VideoOutput | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const resultUrl = useBlobUrl(result?.blob);
  const busy = job.state.status === "running";
  const item = video.item;
  const duration = item?.duration ?? 0;
  const selection = Math.max(0, end - start);
  const selectionValid =
    Boolean(item) && duration > 0 && start >= 0 && end <= duration + 0.001 && selection >= 0.1;
  const wholeFile = duration > 0 && start <= 0.001 && Math.abs(end - duration) < 0.001;

  useEffect(() => {
    if (!item) {
      setStart(0);
      setEnd(0);
      return;
    }
    setStart(0);
    setEnd(item.duration);
    setResult(null);
  }, [item?.file]);

  useEffect(() => {
    return () => {
      previewRef.current?.pause();
    };
  }, []);

  const updateSelection = (nextStart: number, nextEnd: number) => {
    setStart(clamp(nextStart, 0, duration));
    setEnd(clamp(nextEnd, 0.1, duration));
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

  const startTrim = async () => {
    if (!item || !selectionValid) return;
    setResult(null);
    previewRef.current?.pause();
    setPlaying(false);
    await job.run(async (signal, report) => {
      const output = await trimVideo(item, {
        start,
        end,
        quality,
        sourceWidth: item.width,
        sourceHeight: item.height,
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
    setQuality("balanced");
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
        <JobStatus job={job} onRetry={startTrim} />

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
                    updateSelection(start, clamp(player.currentTime, start + 0.1, duration));
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
                max={Math.max(0, end - 0.1)}
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
                Choose an end time after the start time. The minimum clip is 0.1 seconds.
              </p>
            ) : null}
            {wholeFile ? (
              <p className={cn(inlineWarning, "mt-3")}>
                This selection is the whole video, so it will be re-encoded from beginning to end.
              </p>
            ) : null}
          </div>
        ) : null}

        {result && item ? (
          <ResultShell
            title="Trimmed video"
            stats={[
              { label: "Before", value: `${formatDuration(item.duration)} · ${formatBytes(item.file.size)}` },
              { label: "After", value: `${formatDuration(result.duration)} · ${formatBytes(result.blob.size)}` },
              { label: "Selection", value: formatDuration(selection) },
            ]}
            preview={
              resultUrl ? (
                <div className="overflow-hidden rounded-lg border border-line bg-code">
                  <video
                    className="max-h-[420px] w-full bg-black"
                    src={resultUrl}
                    controls
                    playsInline
                    preload="metadata"
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
                  Download MP4
                </button>
                <StartOver onClick={startOver} />
              </>
            }
          >
            <p className="mt-3 text-xs text-ink-muted">
              {result.width} × {result.height} px · H.264 MP4 · {quality === "high" ? "CRF 20" : "CRF 23"}
            </p>
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Trim video"
          onAction={startTrim}
          disabled={!selectionValid}
          busy={busy}
          job={job}
          onRetry={startTrim}
          note={
            <p className={optionHelp}>
              {!item
                ? "Add a video to begin."
                : !duration
                  ? "This video's duration could not be read, so trimming is blocked."
                  : selectionValid
                    ? `${formatDuration(selection)} will be re-encoded for an accurate cut.`
                    : "Set a valid start and end time first."}
            </p>
          }
        >
          <Field
            label="Output quality"
            htmlFor="trim-quality"
            help="The selection is re-encoded, not stream-copied, so the cut stays accurate."
          >
            <div className={segmented} id="trim-quality">
              <button
                type="button"
                className={segmentedButton}
                aria-pressed={quality === "balanced"}
                onClick={() => setQuality("balanced")}
                disabled={busy}
              >
                Balanced
              </button>
              <button
                type="button"
                className={segmentedButton}
                aria-pressed={quality === "high"}
                onClick={() => setQuality("high")}
                disabled={busy}
              >
                High
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <VideoTimeField
              label="Start"
              value={start}
              max={Math.max(0, end - 0.1)}
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

          <div className="rounded-md border border-line bg-code px-3 py-2.5 text-xs leading-normal text-ink-muted">
            Start is applied before the input for a fast seek, then the selection is decoded and
            re-encoded. Audio is kept when the source has it.
          </div>

          <p className={optionHelp}>
            Video encoding runs locally and is slow on phones. A desktop browser is recommended.
          </p>
        </OptionsPanel>
      </div>
    </div>
  );
}
