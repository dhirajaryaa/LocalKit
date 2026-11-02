"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { formatBytes, formatDuration, formatSaved } from "@/lib/files/format";
import { describeError } from "@/lib/files/validate";

export type JobStatus = "ready" | "running" | "done" | "error";

export interface JobState {
  status: JobStatus;
  stage: string;
  progress: number | null;
  error: string;
  elapsed: number;
  cancelled: boolean;
}

export interface JobUpdate {
  stage?: string;
  progress?: number | null;
}

export interface JobController {
  state: JobState;
  run: (
    task: (signal: AbortSignal, report: (update: JobUpdate) => void) => Promise<void>,
  ) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

const INITIAL_JOB: JobState = {
  status: "ready",
  stage: "",
  progress: null,
  error: "",
  elapsed: 0,
  cancelled: false,
};

export function useJob(): JobController {
  const [state, setState] = useState<JobState>(INITIAL_JOB);
  const controllerRef = useRef<AbortController | null>(null);
  const runId = useRef(0);
  const timerRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    runId.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    stopTimer();
    setState(INITIAL_JOB);
  }, [stopTimer]);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    stopTimer();
    setState((previous) =>
      previous.status === "running"
        ? {
            ...previous,
            status: "ready",
            stage: "Cancelled. Nothing was downloaded.",
            progress: null,
            cancelled: true,
          }
        : previous,
    );
  }, [stopTimer]);

  const run = useCallback(
    async (
      task: (signal: AbortSignal, report: (update: JobUpdate) => void) => Promise<void>,
    ) => {
      controllerRef.current?.abort();
      const id = runId.current + 1;
      runId.current = id;
      const controller = new AbortController();
      controllerRef.current = controller;
      stopTimer();
      const started = performance.now();
      setState({
        status: "running",
        stage: "Preparing",
        progress: null,
        error: "",
        elapsed: 0,
        cancelled: false,
      });
      timerRef.current = window.setInterval(() => {
        setState((previous) =>
          previous.status === "running"
            ? { ...previous, elapsed: (performance.now() - started) / 1000 }
            : previous,
        );
      }, 250);

      const report = (update: JobUpdate) => {
        if (runId.current !== id) return;
        setState((previous) =>
          previous.status === "running"
            ? {
                ...previous,
                stage: update.stage ?? previous.stage,
                progress:
                  update.progress === undefined
                    ? previous.progress
                    : update.progress === null
                      ? null
                      : Math.max(0, Math.min(1, update.progress)),
              }
            : previous,
        );
      };

      try {
        await task(controller.signal, report);
        if (runId.current !== id) return;
        if (controller.signal.aborted) {
          setState({
            ...INITIAL_JOB,
            stage: "Cancelled. Nothing was downloaded.",
            cancelled: true,
          });
          return;
        }
        setState((previous) => ({
          ...previous,
          status: "done",
          stage: "Done",
          progress: 1,
          error: "",
          elapsed: (performance.now() - started) / 1000,
        }));
      } catch (error) {
        if (runId.current !== id) return;
        if (controller.signal.aborted || isCancellation(error)) {
          setState({
            ...INITIAL_JOB,
            stage: "Cancelled. Nothing was downloaded.",
            cancelled: true,
          });
        } else {
          setState((previous) => ({
            ...previous,
            status: "error",
            stage: "Stopped",
            progress: null,
            error: describeError(
              error,
              error instanceof Error ? error.message : "The file could not be processed.",
            ),
          }));
        }
      } finally {
        if (runId.current === id) {
          stopTimer();
          controllerRef.current = null;
        }
      }
    },
    [stopTimer],
  );

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      stopTimer();
    },
    [stopTimer],
  );

  return { state, run, cancel, reset };
}

export function isCancellation(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message === "Cancelled" || /aborted/i.test(error.message))
  );
}

export function useBlobUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

interface DropzoneProps {
  accept: string;
  formats: string;
  limitText: string;
  onFiles: (files: File[]) => void | Promise<void>;
  multiple?: boolean;
  disabled?: boolean;
  allowPaste?: boolean;
  title?: string;
  sample?: { label: string; onSelect: () => void; busy?: boolean };
  compact?: boolean;
}

export function Dropzone({
  accept,
  formats,
  limitText,
  onFiles,
  multiple = false,
  disabled = false,
  allowPaste = false,
  title,
  sample,
  compact = false,
}: DropzoneProps) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const deliver = useCallback(
    (list: FileList | null | File[]) => {
      if (!list) return;
      const files = Array.from(list).filter((file) => file.size >= 0);
      if (files.length > 0) void onFiles(files);
    },
    [onFiles],
  );

  useEffect(() => {
    if (!allowPaste) return;
    const onPaste = (event: ClipboardEvent) => {
      if (disabled) return;
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      const files = Array.from(event.clipboardData?.files ?? []).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (files.length > 0) {
        event.preventDefault();
        void onFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [allowPaste, disabled, onFiles]);

  return (
    <label
      className={`dropzone${dragging ? " dragging" : ""}${compact ? " compact" : ""}`}
      htmlFor={id}
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current += 1;
        if (!disabled) setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        if (disabled) return;
        deliver(event.dataTransfer.files);
      }}
    >
      <span className="dropzone-icon" aria-hidden="true">
        <Icon name="upload" size={22} />
      </span>
      <h2>{title ?? (multiple ? "Drop files here" : "Drop a file here")}</h2>
      <p>
        or <span className="browse-button">browse from your device</span>
      </p>
      <span className="limits">{formats} · {limitText}</span>
      {sample ? (
        <span className="sample-row">
          <button
            type="button"
            className="text-link"
            disabled={disabled || sample.busy}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              sample.onSelect();
            }}
          >
            {sample.busy ? "Loading sample..." : sample.label}
          </button>
        </span>
      ) : null}
      {allowPaste ? <span className="dropzone-paste">or paste an image</span> : null}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          deliver(event.target.files);
          event.target.value = "";
        }}
      />
    </label>
  );
}

interface FileRowProps {
  name: string;
  size: number;
  meta?: string;
  index?: number;
  thumbnail?: ReactNode;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  disabled?: boolean;
  extra?: ReactNode;
  error?: string;
}

export function FileRow({
  name,
  size,
  meta,
  index,
  thumbnail,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  disabled = false,
  extra,
  error,
}: FileRowProps) {
  return (
    <div className="file-row">
      {index !== undefined ? (
        <span className="file-order" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
      ) : null}
      <span className="file-thumb">{thumbnail ?? <Icon name="file" size={20} />}</span>
      <div className="file-info">
        <div className="file-name" title={name}>
          {middleName(name)}
        </div>
        <div className="file-meta">
          <span>{formatBytes(size)}</span>
          {meta ? <span>{meta}</span> : null}
        </div>
        {error ? (
          <div className="file-error" role="alert">
            {error}
          </div>
        ) : null}
        {extra}
      </div>
      <div className="file-actions">
        {onMoveUp ? (
          <button
            type="button"
            className="file-action reorder"
            aria-label={`Move ${name} up`}
            onClick={onMoveUp}
            disabled={disabled || !canMoveUp}
          >
            <Icon name="arrow-up" size={15} />
          </button>
        ) : null}
        {onMoveDown ? (
          <button
            type="button"
            className="file-action reorder"
            aria-label={`Move ${name} down`}
            onClick={onMoveDown}
            disabled={disabled || !canMoveDown}
          >
            <Icon name="arrow-down" size={15} />
          </button>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            className="file-action danger"
            aria-label={`Remove ${name}`}
            onClick={onRemove}
            disabled={disabled}
          >
            <Icon name="trash" size={15} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function FileList({
  children,
  summary,
  onAdd,
  addLabel = "Add more",
  disabled = false,
}: {
  children: ReactNode;
  summary: string;
  onAdd?: () => void;
  addLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="file-list">
      {children}
      <div className="file-list-footer">
        <span>{summary}</span>
        {onAdd ? (
          <button type="button" className="upload-more" onClick={onAdd} disabled={disabled}>
            <Icon name="plus" size={13} />
            {addLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function OptionsPanel({
  title = "Options",
  children,
  actionLabel,
  onAction,
  disabled = false,
  busy = false,
  job,
  onRetry,
  note,
}: {
  title?: string;
  children: ReactNode;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  busy?: boolean;
  job?: JobController;
  onRetry?: () => void;
  note?: ReactNode;
}) {
  return (
    <form
      className="panel options-panel"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled && !busy) onAction();
      }}
    >
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      <div className="options-scroll">{children}</div>
      <div className="options-footer">
        {note}
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={disabled || busy}
          aria-busy={busy}
        >
          {busy ? "Working..." : actionLabel}
          {!busy ? <Icon name="arrow-right" size={15} /> : null}
        </button>
        {job ? <JobStatus job={job} inline onRetry={onRetry} /> : null}
      </div>
    </form>
  );
}

export function JobStatus({
  job,
  inline = false,
  onRetry,
}: {
  job: JobController;
  inline?: boolean;
  onRetry?: () => void;
}) {
  const { state, cancel } = job;
  if (state.status === "error") {
    return (
      <div className="fatal-error" role="alert">
        <h2>That did not finish</h2>
        <p>{state.error}</p>
        {onRetry ? (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    );
  }
  if (state.status === "running") {
    return (
      <div className={`progress-box${inline ? " inline" : ""}`} aria-live="polite">
        <div className="progress-head">
          <span className="progress-label">{state.stage || "Working"}</span>
          <span className="progress-time">
            {state.progress !== null ? `${Math.round(state.progress * 100)}%` : "Working"}
            {state.elapsed >= 3 ? ` · ${formatDuration(state.elapsed)}` : ""}
          </span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-bar${state.progress === null ? " indeterminate" : ""}`}
            style={state.progress !== null ? { width: `${state.progress * 100}%` } : undefined}
          />
        </div>
        <div className="progress-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }
  if (state.cancelled && state.stage) {
    return (
      <p className="inline-note" role="status">
        {state.stage}
      </p>
    );
  }
  return null;
}

export function ResultShell({
  title = "Result",
  stats,
  preview,
  actions,
  children,
}: {
  title?: string;
  stats?: Array<{ label: string; value: string }>;
  preview?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="result-panel" aria-labelledby="result-title">
      <div className="result-header">
        <h2 id="result-title">{title}</h2>
        <span className="local-badge">
          <Icon name="check" size={12} /> Ready
        </span>
      </div>
      <div className="result-body">
        {stats && stats.length > 0 ? (
          <div className="result-stats">
            {stats.map((stat) => (
              <div className="result-stat" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        ) : null}
        {preview}
        {actions ? <div className="result-actions">{actions}</div> : null}
        {children}
      </div>
    </section>
  );
}

export function StartOver({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={onClick} disabled={disabled}>
      <Icon name="refresh" size={14} />
      Start over
    </button>
  );
}

export function DownloadRow({
  name,
  blob,
  onDownload,
  meta,
}: {
  name: string;
  blob?: Blob;
  onDownload: () => void;
  meta?: string;
}) {
  return (
    <div className="result-file-row">
      <div style={{ minWidth: 0 }}>
        <div className="file-name" title={name}>
          {middleName(name)}
        </div>
        <div className="file-meta">
          {blob ? <span>{formatBytes(blob.size)}</span> : meta ? <span>{meta}</span> : null}
        </div>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onDownload} aria-label={`Download ${name}`}>
        <Icon name="download" size={14} />
        Download
      </button>
    </div>
  );
}

export function SizeStats({
  original,
  output,
  extra,
}: {
  original: number;
  output: number;
  extra?: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="result-stats">
      <div className="result-stat">
        <span>Before</span>
        <strong>{formatBytes(original)}</strong>
      </div>
      <div className="result-stat">
        <span>After</span>
        <strong>{formatBytes(output)}</strong>
      </div>
      <div className="result-stat">
        <span>Change</span>
        <strong>{formatSaved(original, output)}</strong>
      </div>
      {extra?.map((item) => (
        <div className="result-stat" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  help,
  children,
}: {
  label: string;
  htmlFor?: string;
  help?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {help ? <div className="option-help">{help}</div> : null}
    </div>
  );
}

function middleName(name: string, max = 56): string {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot) : "";
  const head = name.slice(0, Math.max(8, Math.floor((max - ext.length) * 0.55)));
  const tail = name.slice(Math.max(head.length, name.length - (max - ext.length - head.length - 1)));
  return `${head}…${tail}`;
}
