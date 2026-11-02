"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AudioPicker, useSingleAudio } from "@/components/tools/audio-kit";
import {
  Field,
  JobStatus,
  OptionsPanel,
  ResultShell,
  StartOver,
  useBlobUrl,
  useJob,
} from "@/components/tools/tool-kit";
import { Icon } from "@/components/ui/icon";
import {
  audioMetadataText,
  exportAudio,
  getWaveformPeaks,
  sliceAudioBuffer,
} from "@/lib/engines/audio";
import { downloadBlob } from "@/lib/files/download";
import {
  baseName,
  clamp,
  formatBytes,
  formatDuration,
  formatDurationExact,
  parseTimeInput,
} from "@/lib/files/format";
import { SAMPLES } from "@/lib/files/sample";
import { cn, inlineWarning, optionHelp, range, select, shell } from "@/lib/ui";

function Waveform({
  peaks,
  start,
  end,
  duration,
  disabled,
  onChange,
}: {
  peaks: number[];
  start: number;
  end: number;
  duration: number;
  disabled: boolean;
  onChange: (start: number, end: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const drag = useRef<"start" | "end" | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = 900;
    const height = 140;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    const styles = getComputedStyle(canvas);
    const code = styles.getPropertyValue("--code-bg").trim() || "#ece8df";
    const ink = styles.getPropertyValue("--ink-muted").trim() || "#6a665d";
    const accent = styles.getPropertyValue("--accent").trim() || "#c93a12";
    context.fillStyle = code;
    context.fillRect(0, 0, width, height);
    const startX = duration > 0 ? (start / duration) * width : 0;
    const endX = duration > 0 ? (end / duration) * width : width;
    context.fillStyle = accent;
    context.globalAlpha = 0.12;
    context.fillRect(startX, 0, Math.max(0, endX - startX), height);
    context.globalAlpha = 1;
    const count = Math.max(1, peaks.length);
    const barWidth = width / count;
    context.fillStyle = ink;
    for (let index = 0; index < count; index += 1) {
      const peak = Math.max(0.02, peaks[index] ?? 0);
      const barHeight = Math.max(2, peak * height * 0.78);
      context.fillRect(index * barWidth, (height - barHeight) / 2, Math.max(1, barWidth * 0.68), barHeight);
    }
    context.fillStyle = accent;
    context.fillRect(startX - 1, 0, 2, height);
    context.fillRect(endX - 1, 0, 2, height);
    context.fillStyle = accent;
    context.fillRect(startX, 0, 8, 8);
    context.fillRect(endX - 8, height - 8, 8, 8);
  }, [peaks, start, end, duration, resolvedTheme]);

  const updateFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || duration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const time = clamp(((event.clientX - rect.left) / rect.width) * duration, 0, duration);
    if (!drag.current) {
      drag.current = Math.abs(time - start) <= Math.abs(time - end) ? "start" : "end";
    }
    if (drag.current === "start") {
      onChange(Math.min(time, end - 0.1), end);
    } else {
      onChange(start, Math.max(time, start + 0.1));
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="h-[140px] w-full touch-none rounded-lg border border-line"
      role="img"
      aria-label="Audio waveform. Drag the start and end handles to change the selection."
      onPointerDown={(event) => {
        if (disabled) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromEvent(event);
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        updateFromEvent(event);
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    />
  );
}

function TimeField({
  label,
  value,
  onCommit,
  max,
  disabled,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  max: number;
  disabled: boolean;
}) {
  const [text, setText] = useState(formatDurationExact(value));
  useEffect(() => setText(formatDurationExact(value)), [value]);
  return (
    <Field label={label} help="mm:ss.mmm">
      <input
        className="h-10 w-full rounded-lg border border-line bg-raised px-2.5 font-mono text-sm tabular-nums text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-55"
        type="text"
        value={text}
        disabled={disabled}
        onChange={(event) => {
          setText(event.target.value);
          const parsed = parseTimeInput(event.target.value);
          if (parsed !== null) onCommit(clamp(parsed, 0, max));
        }}
        onBlur={() => setText(formatDurationExact(value))}
      />
    </Field>
  );
}

export function AudioTrimmerTool() {
  const audio = useSingleAudio({ sample: SAMPLES.audio });
  const job = useJob();
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [format, setFormat] = useState<"mp3" | "wav">("mp3");
  const [bitrate, setBitrate] = useState(192);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string; duration: number } | null>(null);
  const previewRef = useRef<HTMLAudioElement>(null);
  const sourceUrl = useBlobUrl(audio.item?.file);
  const resultUrl = useBlobUrl(result?.blob);
  const busy = job.state.status === "running";
  const duration = audio.item?.duration ?? 0;
  const peaks = useMemo(
    () => (audio.item ? getWaveformPeaks(audio.item.buffer, 900) : []),
    [audio.item],
  );
  const selection = Math.max(0, end - start);
  const effectiveFadeIn = Math.min(fadeIn, selection / 2);
  const effectiveFadeOut = Math.min(fadeOut, selection / 2);
  const fadesClamped = effectiveFadeIn < fadeIn - 0.001 || effectiveFadeOut < fadeOut - 0.001;
  const selectionValid = selection >= 0.1 && end <= duration + 0.001 && start >= 0;
  const wholeFile = audio.item ? start <= 0.001 && Math.abs(end - duration) < 0.001 : false;
  const ready = Boolean(audio.item) && !audio.loading && selectionValid;

  useEffect(() => {
    if (!audio.item) {
      setStart(0);
      setEnd(0);
      return;
    }
    setStart(0);
    setEnd(audio.item.duration);
    setResult(null);
  }, [audio.item?.file]);

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

  const preview = async () => {
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
    if (!audio.item || !ready) return;
    setResult(null);
    const player = previewRef.current;
    player?.pause();
    setPlaying(false);
    await job.run(async (signal, report) => {
      report({ stage: "Slicing audio", progress: 0.1 });
      const sliced = sliceAudioBuffer(
        audio.item!.buffer,
        start,
        end,
        effectiveFadeIn,
        effectiveFadeOut,
      );
      report({ stage: "Encoding audio", progress: 0.25 });
      const blob = await exportAudio(sliced, format, {
        bitrate,
        signal,
        onProgress: (fraction) => report({ progress: 0.25 + fraction * 0.7 }),
      });
      if (signal.aborted) throw new Error("Cancelled");
      setResult({
        blob,
        name: `${baseName(audio.item!.file.name)}-trimmed.${format}`,
        duration: sliced.duration,
      });
      report({ stage: "Done", progress: 1 });
    });
  };

  const startOver = () => {
    job.reset();
    audio.clear();
    setResult(null);
    setStart(0);
    setEnd(0);
    setFadeIn(0);
    setFadeOut(0);
    setFormat("mp3");
    setBitrate(192);
    setPlaying(false);
  };

  return (
    <div
      className={cn(
        shell,
        "grid grid-cols-1 items-start gap-8 pb-[72px] pt-8 min-[1101px]:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <AudioPicker source={audio} disabled={busy} />
        <JobStatus job={job} onRetry={startTrim} />

        {audio.item ? (
          <div className="rounded-xl border border-line bg-surface p-4">
            <Waveform
              peaks={peaks}
              start={start}
              end={end}
              duration={duration}
              disabled={busy}
              onChange={updateSelection}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-[11px] text-ink-muted">
                {formatDurationExact(start)} – {formatDurationExact(end)} · selection{" "}
                {formatDuration(selection)}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs text-ink hover:border-line-strong disabled:opacity-40"
                  onClick={() => updateSelection(0, end)}
                  disabled={busy}
                >
                  Set start to 0
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs text-ink hover:border-line-strong disabled:opacity-40"
                  onClick={() => updateSelection(start, duration)}
                  disabled={busy}
                >
                  Set end to end
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs text-ink hover:border-line-strong disabled:opacity-40"
                onClick={() => void preview()}
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
                disabled={busy}
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
                disabled={busy}
              >
                Set end to playhead
              </button>
            </div>
            <audio
              ref={previewRef}
              src={sourceUrl ?? undefined}
              className="hidden"
              onTimeUpdate={(event) => {
                if (event.currentTarget.currentTime >= end) {
                  event.currentTarget.pause();
                  setPlaying(false);
                }
              }}
              onEnded={() => setPlaying(false)}
            />
          </div>
        ) : null}

        {result ? (
          <ResultShell
            title="Trimmed audio"
            stats={[
              { label: "Selection", value: formatDuration(result.duration) },
              { label: "Output", value: format.toUpperCase() },
              { label: "Size", value: formatBytes(result.blob.size) },
            ]}
            preview={
              resultUrl ? (
                <audio className="mb-4 w-full" controls src={resultUrl}>
                  Your browser cannot preview this audio.
                </audio>
              ) : null
            }
            actions={
              <>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:brightness-90"
                  onClick={() => downloadBlob(result.blob, result.name)}
                >
                  <Icon name="download" size={15} /> Download {format.toUpperCase()}
                </button>
                <StartOver onClick={startOver} />
              </>
            }
          >
            <p className="mt-3 text-xs text-ink-muted">
              Original: {formatDuration(duration)} · Fades: {effectiveFadeIn.toFixed(2)}s in,{" "}
              {effectiveFadeOut.toFixed(2)}s out.
            </p>
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Trim audio"
          onAction={startTrim}
          disabled={!ready || Boolean(result)}
          busy={busy}
          job={job}
          onRetry={startTrim}
          note={
            <p className={optionHelp}>
              {!audio.item
                ? "Add an audio file to begin."
                : `${audioMetadataText(audio.item)} · ${formatDuration(selection)} selected.`}
            </p>
          }
        >
          <div className="grid grid-cols-2 gap-2.5">
            <TimeField
              label="Start"
              value={start}
              max={duration}
              disabled={busy}
              onCommit={(value) => updateSelection(value, Math.max(value + 0.1, end))}
            />
            <TimeField
              label="End"
              value={end}
              max={duration}
              disabled={busy}
              onCommit={(value) => updateSelection(Math.min(start, value - 0.1), value)}
            />
          </div>
          {!selectionValid ? (
            <p className="text-xs text-danger" role="alert">
              Select at least 0.1 seconds. The end must be after the start.
            </p>
          ) : null}
          {wholeFile ? (
            <p className={inlineWarning}>The whole file is selected. It will still be re-encoded.</p>
          ) : null}

          <Field label={`Fade in · ${fadeIn.toFixed(1)}s`} htmlFor="audio-fade-in">
            <input
              id="audio-fade-in"
              className={range}
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={fadeIn}
              onChange={(event) => setFadeIn(Number(event.target.value))}
              disabled={busy}
            />
          </Field>
          <Field label={`Fade out · ${fadeOut.toFixed(1)}s`} htmlFor="audio-fade-out">
            <input
              id="audio-fade-out"
              className={range}
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={fadeOut}
              onChange={(event) => setFadeOut(Number(event.target.value))}
              disabled={busy}
            />
          </Field>
          {fadesClamped ? (
            <p className={inlineWarning}>
              Fades are capped at half the selection. The exported fades will be shorter than
              requested.
            </p>
          ) : null}

          <Field label="Output format" htmlFor="audio-trim-format">
            <select
              id="audio-trim-format"
              className={select}
              value={format}
              onChange={(event) => setFormat(event.target.value as "mp3" | "wav")}
              disabled={busy}
            >
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
            </select>
          </Field>
          {format === "mp3" ? (
            <Field label="Bitrate" htmlFor="audio-trim-bitrate">
              <select
                id="audio-trim-bitrate"
                className={select}
                value={bitrate}
                onChange={(event) => setBitrate(Number(event.target.value))}
                disabled={busy}
              >
                <option value={128}>128 kbps</option>
                <option value={192}>192 kbps</option>
                <option value={256}>256 kbps</option>
                <option value={320}>320 kbps</option>
              </select>
            </Field>
          ) : null}
          <p className={optionHelp}>The waveform is downsampled for drawing; the export is sample-accurate.</p>
        </OptionsPanel>
      </div>
    </div>
  );
}
