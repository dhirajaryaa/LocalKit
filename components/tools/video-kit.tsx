"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dropzone, Field, FileList, FileRow } from "@/components/tools/tool-kit";
import { Icon } from "@/components/ui/icon";
import { LIMITS } from "@/lib/constants";
import { loadVideoFile, releaseVideo, type LoadedVideo } from "@/lib/engines/video";
import { formatBytes, formatDuration, formatDurationExact } from "@/lib/files/format";
import { fetchSampleFile } from "@/lib/files/sample";
import { cn, inlineDanger, inlineWarning, optionHelp } from "@/lib/ui";

export interface VideoSample {
  path: string;
  name: string;
  type: string;
}

export function useSingleVideo(options: { sample?: VideoSample } = {}) {
  const [item, setItem] = useState<LoadedVideo | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    return () => releaseVideo(item);
  }, [item]);

  const load = useCallback(async (file: File) => {
    const id = requestId.current + 1;
    requestId.current = id;
    setError("");
    setNotice("");
    if (file.size === 0) {
      setError("This file is empty.");
      return;
    }
    if (file.size > LIMITS.video.perFile) {
      setError(
        `${file.name} is ${formatBytes(file.size)}. The video limit is ${formatBytes(LIMITS.video.perFile)} per file.`,
      );
      return;
    }
    setLoading(true);
    try {
      const loaded = await loadVideoFile(file);
      if (requestId.current !== id) {
        releaseVideo(loaded);
        return;
      }
      if (loaded.duration > LIMITS.video.maxSeconds) {
        releaseVideo(loaded);
        throw new Error("This video is longer than the 20 minute limit.");
      }
      setItem(loaded);
      if (!loaded.playable) {
        setNotice("Preview is unavailable for this codec, but processing may still work.");
      } else if (!loaded.duration) {
        setNotice("The duration could not be read. Target-size and trimming need a readable duration.");
      }
    } catch (caught) {
      if (requestId.current !== id) return;
      setError(caught instanceof Error ? caught.message : "This video could not be read.");
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      if (files.length > 1) setNotice("This tool takes one video. The first file was used.");
      await load(files[0]);
    },
    [load],
  );

  const loadSample = useCallback(async () => {
    if (!options.sample) return;
    setSampleBusy(true);
    setError("");
    try {
      const file = await fetchSampleFile(
        options.sample.path,
        options.sample.name,
        options.sample.type,
      );
      await load(file);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The sample could not be loaded.");
    } finally {
      setSampleBusy(false);
    }
  }, [load, options.sample]);

  const clear = useCallback(() => {
    requestId.current += 1;
    setItem(null);
    setError("");
    setNotice("");
    setLoading(false);
  }, []);

  return {
    item,
    hasSample: Boolean(options.sample),
    error,
    notice,
    loading,
    sampleBusy,
    addFiles,
    loadSample,
    clear,
  };
}

export type SingleVideoController = ReturnType<typeof useSingleVideo>;

export function VideoPicker({
  source,
  disabled = false,
  sampleLabel = "Try a sample video",
}: {
  source: SingleVideoController;
  disabled?: boolean;
  sampleLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { item, loading, error, notice, sampleBusy } = source;

  if (!item) {
    return (
      <div className="grid gap-3">
        <Dropzone
          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
          formats="MP4, MOV, WebM"
          limitText={`up to ${formatBytes(LIMITS.video.perFile)} · 20 min`}
          onFiles={source.addFiles}
          disabled={disabled || loading}
          sample={
            source.hasSample && sampleLabel
              ? { label: sampleLabel, onSelect: source.loadSample, busy: sampleBusy }
              : undefined
          }
        />
        {loading ? <p className={optionHelp}>Reading video…</p> : null}
        {error ? (
          <p className={inlineDanger} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <FileList
        summary={`1 video · ${formatBytes(item.file.size)}`}
        onAdd={() => inputRef.current?.click()}
        addLabel="Replace"
        disabled={disabled || loading}
      >
        <FileRow
          name={item.file.name}
          size={item.file.size}
          meta={
            item.duration
              ? `${formatDuration(item.duration)}${item.width ? ` · ${item.width} × ${item.height}` : ""}`
              : "Duration unavailable"
          }
          thumbnail={<Icon name="video" size={18} />}
          onRemove={source.clear}
          disabled={disabled || loading}
        />
      </FileList>
      {loading ? <p className={optionHelp}>Reading video…</p> : null}
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
        className="sr-only"
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        tabIndex={-1}
        disabled={disabled || loading}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) void source.addFiles(files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

export function VideoPreview({
  source,
  videoRef,
  onTimeUpdate,
  className,
}: {
  source: LoadedVideo | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onTimeUpdate?: React.ReactEventHandler<HTMLVideoElement>;
  className?: string;
}) {
  if (!source) return null;
  return (
    <div className={cn("overflow-hidden rounded-xl border border-line bg-code", className)}>
      {source.playable ? (
        <video
          ref={videoRef}
          className="max-h-[420px] w-full bg-black"
          src={source.objectUrl}
          controls
          playsInline
          preload="metadata"
          onTimeUpdate={onTimeUpdate}
        />
      ) : (
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 px-6 py-8 text-center">
          <Icon name="video" size={24} />
          <p className="text-sm text-ink-muted">Preview is unavailable for this codec.</p>
          <p className="text-xs text-ink-muted">The local encoder may still process it.</p>
        </div>
      )}
    </div>
  );
}

export function VideoTimeline({
  duration,
  start,
  end,
  disabled,
  onChange,
}: {
  duration: number;
  start: number;
  end: number;
  disabled: boolean;
  onChange: (start: number, end: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<"start" | "end" | null>(null);
  const startPercent = duration > 0 ? (start / duration) * 100 : 0;
  const endPercent = duration > 0 ? (end / duration) * 100 : 0;

  const updateFromEvent = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || duration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const time = Math.min(
      duration,
      Math.max(0, ((event.clientX - rect.left) / rect.width) * duration),
    );
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
    <div className="grid gap-2">
      <div
        ref={trackRef}
        className={cn(
          "relative h-14 touch-none overflow-hidden rounded-lg border border-line bg-code",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair",
        )}
        role="group"
        aria-label="Video selection timeline. Drag the start and end handles."
        onPointerDown={(event) => {
          if (disabled || duration <= 0) return;
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
      >
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, var(--line-strong) 0, var(--line-strong) 1px, transparent 1px, transparent 12.5%)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 border-x-2 border-accent bg-accent/10"
          style={{ left: `${startPercent}%`, width: `${Math.max(0, endPercent - startPercent)}%` }}
          aria-hidden="true"
        />
        <span
          className="absolute top-0 h-full w-2 -translate-x-1/2 rounded-sm border border-accent bg-accent"
          style={{ left: `${startPercent}%` }}
          aria-hidden="true"
        />
        <span
          className="absolute top-0 h-full w-2 -translate-x-1/2 rounded-sm border border-accent bg-accent"
          style={{ left: `${endPercent}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between font-mono text-[10px] tabular-nums text-ink-muted">
        <span>00:00.000</span>
        <span>Drag the orange handles to set the range</span>
        <span>{formatDurationExact(duration)}</span>
      </div>
    </div>
  );
}

export function VideoTimeField({
  label,
  value,
  onCommit,
  max,
  disabled,
  help = "mm:ss.mmm",
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  max: number;
  disabled: boolean;
  help?: string;
}) {
  const [text, setText] = useState(formatDurationExact(value));
  useEffect(() => setText(formatDurationExact(value)), [value]);
  return (
    <Field label={label} help={help}>
      <input
        className="h-10 w-full rounded-lg border border-line bg-raised px-2.5 font-mono text-sm tabular-nums text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-55"
        type="text"
        value={text}
        disabled={disabled}
        onChange={(event) => {
          setText(event.target.value);
          const parts = event.target.value.trim().split(":");
          if (parts.length > 3) return;
          const nums = parts.map((part) => Number(part.replace(",", ".")));
          if (nums.some((num) => !Number.isFinite(num) || num < 0)) return;
          if (nums.slice(1).some((num) => num >= 60)) return;
          const parsed = nums.reduce((total, num) => total * 60 + num, 0);
          onCommit(Math.min(max, Math.max(0, parsed)));
        }}
        onBlur={() => setText(formatDurationExact(value))}
      />
    </Field>
  );
}
