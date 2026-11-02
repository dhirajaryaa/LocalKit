"use client";

import { useEffect, useState } from "react";
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
  useSingleVideo,
} from "@/components/tools/video-kit";
import { Icon } from "@/components/ui/icon";
import {
  compressVideo,
  fitVideoDimensions,
  type VideoFrameRate,
  type VideoOutput,
  type VideoQuality,
  type VideoResolution,
} from "@/lib/engines/video";
import { downloadBlob } from "@/lib/files/download";
import { formatBytes, formatSaved } from "@/lib/files/format";
import { SAMPLES } from "@/lib/files/sample";
import {
  checkboxRow,
  cn,
  fieldLabel,
  inlineWarning,
  input,
  optionHelp,
  select,
  shell,
} from "@/lib/ui";

const QUALITY_CRF: Record<Exclude<VideoQuality, "custom">, number> = {
  light: 28,
  balanced: 23,
  high: 20,
};

export function VideoCompressorTool() {
  const video = useSingleVideo({ sample: SAMPLES.video });
  const job = useJob();
  const [quality, setQuality] = useState<VideoQuality>("balanced");
  const [crf, setCrf] = useState(23);
  const [resolution, setResolution] = useState<VideoResolution>("keep");
  const [targetEnabled, setTargetEnabled] = useState(false);
  const [targetMb, setTargetMb] = useState(10);
  const [removeAudio, setRemoveAudio] = useState(false);
  const [frameRate, setFrameRate] = useState<VideoFrameRate>("keep");
  const [result, setResult] = useState<VideoOutput | null>(null);
  const resultUrl = useBlobUrl(result?.blob);
  const busy = job.state.status === "running";
  const item = video.item;
  const duration = item?.duration ?? 0;
  const targetBytes = targetEnabled ? Math.round(targetMb * 1024 * 1024) : null;
  const targetValid = !targetEnabled || (targetMb >= 10 && targetMb <= 2048);
  const targetNeedsDuration = Boolean(targetEnabled && !duration);
  const dimensions = item
    ? fitVideoDimensions(
        item.width,
        item.height,
        resolution === "keep" ? null : Number(resolution),
      )
    : null;
  const ready = Boolean(item) && targetValid && !targetNeedsDuration;

  useEffect(() => {
    setResult(null);
  }, [item?.file]);

  const start = async () => {
    if (!item || !ready) return;
    setResult(null);
    await job.run(async (signal, report) => {
      const output = await compressVideo(item, {
        quality,
        crf,
        resolution,
        targetBytes,
        removeAudio,
        frameRate,
        sourceWidth: item.width,
        sourceHeight: item.height,
        sourceDuration: item.duration,
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
    setTargetEnabled(false);
    setQuality("balanced");
    setCrf(23);
    setResolution("keep");
    setRemoveAudio(false);
    setFrameRate("keep");
  };

  const smallerThanInput = Boolean(item && result && result.blob.size < item.file.size);
  const crfForRequest =
    quality === "custom" ? crf : QUALITY_CRF[quality as Exclude<VideoQuality, "custom">];

  return (
    <div
      className={cn(
        shell,
        "grid grid-cols-1 items-start gap-8 pb-[72px] pt-8 min-[1101px]:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <VideoPicker source={video} disabled={busy} />
        <JobStatus job={job} onRetry={start} />

        {item ? <VideoPreview source={item} /> : null}

        {result && item ? (
          <ResultShell
            title="Compressed video"
            stats={[
              { label: "Before", value: formatBytes(item.file.size) },
              { label: "After", value: formatBytes(result.blob.size) },
              {
                label: "Change",
                value: formatSaved(item.file.size, result.blob.size),
              },
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
                {!smallerThanInput ? (
                  <button
                    type="button"
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[13px] text-ink"
                    onClick={() => downloadBlob(item.file, item.file.name)}
                  >
                    <Icon name="download" size={14} />
                    Keep original
                  </button>
                ) : null}
                <StartOver onClick={startOver} />
              </>
            }
          >
            <div className="mt-3 grid gap-1.5 text-xs text-ink-muted">
              <span>
                {result.width} × {result.height} px · H.264 MP4 ·{" "}
                {removeAudio ? "no audio" : "AAC audio"}
              </span>
              {!smallerThanInput ? (
                <span className={inlineWarning}>
                  The encoded file is larger than the original. Re-encoding can do that to an
                  already-small video; keeping the original is the better choice.
                </span>
              ) : null}
            </div>
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Compress video"
          onAction={start}
          disabled={!ready}
          busy={busy}
          job={job}
          onRetry={start}
          note={
            <p className={optionHelp}>
              {!item
                ? "Add a video to begin."
                : !duration
                  ? "The duration could not be read, so target size is unavailable."
                  : targetEnabled
                    ? `Target: about ${targetMb} MB. The result is approximate.`
                    : `Balanced quality · ${item.width} × ${item.height} px in.`}
            </p>
          }
        >
          <Field
            label="Quality"
            htmlFor="video-quality"
            help="Balanced is the practical default. Light makes a smaller file; High keeps more detail."
          >
            <select
              id="video-quality"
              className={select}
              value={quality}
              onChange={(event) => setQuality(event.target.value as VideoQuality)}
              disabled={busy}
            >
              <option value="light">Light · smaller</option>
              <option value="balanced">Balanced · recommended</option>
              <option value="high">High · more detail</option>
              <option value="custom">Custom CRF</option>
            </select>
          </Field>

          {quality === "custom" ? (
            <Field label={`CRF · ${crf}`} htmlFor="video-crf" help="Lower is better quality. 18 to 32 is the useful range.">
              <input
                id="video-crf"
                className="w-full accent-accent"
                type="range"
                min={18}
                max={32}
                value={crf}
                onChange={(event) => setCrf(Number(event.target.value))}
                disabled={busy}
              />
            </Field>
          ) : null}

          <Field label="Resolution" htmlFor="video-resolution" help="Never upscales. Even dimensions keep H.264 playback reliable.">
            <select
              id="video-resolution"
              className={select}
              value={resolution}
              onChange={(event) => setResolution(event.target.value as VideoResolution)}
              disabled={busy}
            >
              <option value="keep">Keep original</option>
              <option value="1080">1080p</option>
              <option value="720">720p</option>
              <option value="480">480p</option>
            </select>
          </Field>

          <div className="grid gap-2">
            <label className={checkboxRow} htmlFor="video-target-enabled">
              <input
                id="video-target-enabled"
                type="checkbox"
                checked={targetEnabled}
                onChange={(event) => setTargetEnabled(event.target.checked)}
                disabled={busy}
              />
              Aim for a target size
            </label>
            {targetEnabled ? (
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  className={input}
                  type="number"
                  min={10}
                  max={2048}
                  step={1}
                  value={targetMb}
                  onChange={(event) => setTargetMb(Number(event.target.value))}
                  aria-label="Target size in megabytes"
                  disabled={busy || !duration}
                />
                <span className="inline-flex h-10 items-center rounded-lg border border-line bg-code px-3 font-mono text-xs text-ink-muted">
                  MB
                </span>
              </div>
            ) : null}
            {targetEnabled ? (
              <p className={optionHelp}>
                Single-pass bitrate target from 10 MB to 2 GB. It is an estimate, not a guarantee.
              </p>
            ) : null}
            {!targetValid ? (
              <span className="text-xs text-danger" role="alert">
                Use a target between 10 MB and 2,048 MB.
              </span>
            ) : null}
            {targetNeedsDuration ? (
              <span className="text-xs text-danger" role="alert">
                A readable duration is needed for target size.
              </span>
            ) : null}
          </div>

          <Field label="Frame rate" htmlFor="video-fps">
            <select
              id="video-fps"
              className={select}
              value={frameRate}
              onChange={(event) => setFrameRate(event.target.value as VideoFrameRate)}
              disabled={busy}
            >
              <option value="keep">Keep original</option>
              <option value="30">30 fps</option>
              <option value="24">24 fps</option>
            </select>
          </Field>

          <label className={checkboxRow} htmlFor="video-remove-audio">
            <input
              id="video-remove-audio"
              type="checkbox"
              checked={removeAudio}
              onChange={(event) => setRemoveAudio(event.target.checked)}
              disabled={busy}
            />
            Remove audio
          </label>

          <div className="rounded-md border border-line bg-code px-3 py-2.5 text-xs leading-normal text-ink-muted">
            <span className={cn(fieldLabel, "mb-1 block")}>Output</span>
            MP4 · H.264 video · {removeAudio ? "no audio" : "AAC 128 kbps"} · CRF {crfForRequest}
            {dimensions ? ` · ${dimensions.width} × ${dimensions.height} px` : ""}
          </div>

          <p className={optionHelp}>
            Video encoding runs locally and is slow on phones. A desktop browser is recommended.
          </p>
        </OptionsPanel>
      </div>
    </div>
  );
}
