"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  compressImage,
  convertImage,
  loadImage,
  releaseImage,
  resizeImage,
  type ImageFormat,
  type LoadedImage,
} from "@/lib/engines/image";
import { downloadBlob } from "@/lib/files/download";
import { formatBytes, formatSaved } from "@/lib/files/format";
import { Icon } from "@/components/ui/icon";
import {
  btnPrimary,
  btnSecondary,
  btnSm,
  cn,
  fieldLabel,
  inlineDanger,
  accentBadge,
  optionHelp,
  optionValue,
  range,
  segmented,
  segmentedButton,
  select,
  textLink,
} from "@/lib/ui";

type DemoTool = "compress" | "convert" | "resize";

interface DemoResult {
  blob: Blob;
  fileName: string;
  outputSize: number;
  width: number;
  height: number;
}

const DEMO_TOOLS: Array<{ id: DemoTool; label: string }> = [
  { id: "compress", label: "Compress" },
  { id: "convert", label: "Convert" },
  { id: "resize", label: "Resize" },
];

const AUTO_CYCLE: DemoTool[] = ["compress", "convert", "resize"];
const AUTO_WORKING_MS = 850;
const AUTO_RESULT_MS = 2200;

export function HeroDemo() {
  const [tool, setTool] = useState<DemoTool>("compress");
  const [quality, setQuality] = useState(72);
  const [format, setFormat] = useState<ImageFormat>("webp");
  const [resizeWidth, setResizeWidth] = useState(1200);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [originalDimensions, setOriginalDimensions] = useState("");
  const [sampleUrl, setSampleUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [autoPlay, setAutoPlay] = useState(true);
  const loadedRef = useRef<LoadedImage | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/samples/sample-photo.jpg");
        if (!response.ok) throw new Error("Sample could not be loaded.");
        const blob = await response.blob();
        const file = new File([blob], "sample-photo.jpg", { type: "image/jpeg" });
        const loaded = await loadImage(file);
        if (cancelled) {
          releaseImage(loaded);
          return;
        }
        loadedRef.current = loaded;
        setSampleUrl(loaded.objectUrl);
        setOriginalSize(loaded.file.size);
        setOriginalDimensions(`${loaded.width} × ${loaded.height} px`);
      } catch {
        if (!cancelled) {
          setError("The demo could not run in this browser. Open the full tool to try your own file.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
      requestRef.current += 1;
      releaseImage(loadedRef.current);
      loadedRef.current = null;
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const respectPreference = () => {
      if (query.matches) setAutoPlay(false);
    };
    respectPreference();
    query.addEventListener("change", respectPreference);
    return () => query.removeEventListener("change", respectPreference);
  }, []);

  const resetResult = () => {
    requestRef.current += 1;
    setResult(null);
    setError("");
    setBusy(false);
  };

  const chooseTool = (next: DemoTool) => {
    setAutoPlay(false);
    resetResult();
    setTool(next);
  };

  const runPreview = useCallback(
    async (nextTool: DemoTool, withWorkingCue = false): Promise<boolean> => {
      const loaded = loadedRef.current;
      if (!loaded) return false;
      const request = requestRef.current + 1;
      requestRef.current = request;
      setBusy(true);
      setError("");
      setResult(null);
      const started = performance.now();

      try {
        let output;
        if (nextTool === "compress") {
          output = await compressImage(loaded, {
            mode: "quality",
            quality,
            targetBytes: 0,
            format: "webp",
            maxWidth: 1600,
            maxHeight: 0,
          });
        } else if (nextTool === "convert") {
          output = await convertImage(loaded, {
            format,
            quality: 82,
            background: "#FFFFFF",
          });
        } else {
          const targetWidth = Math.min(resizeWidth, loaded.width);
          const targetHeight = Math.max(
            1,
            Math.round(loaded.height * (targetWidth / loaded.width)),
          );
          output = await resizeImage(loaded, {
            mode: "dimensions",
            width: targetWidth,
            height: targetHeight,
            percentage: 100,
            fit: "stretch",
            allowUpscale: false,
            background: "#FFFFFF",
            format: "webp",
            quality: 82,
          });
        }

        if (withWorkingCue) {
          const remaining = AUTO_WORKING_MS - (performance.now() - started);
          if (remaining > 0) {
            await new Promise((resolve) => window.setTimeout(resolve, remaining));
          }
        }
        if (request !== requestRef.current) return false;
        setResult({
          blob: output.blob,
          fileName: output.fileName,
          outputSize: output.blob.size,
          width: output.width,
          height: output.height,
        });
        return true;
      } catch {
        if (request !== requestRef.current) return false;
        setError("The preview could not finish. Open the full tool to try your own file.");
        return false;
      } finally {
        if (request === requestRef.current) setBusy(false);
      }
    },
    [format, quality, resizeWidth],
  );

  useEffect(() => {
    if (!sampleUrl || !autoPlay) return;
    let cancelled = false;
    let index = 0;
    const timers = new Set<number>();
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          resolve();
        }, ms);
        timers.add(timer);
      });

    const loop = async () => {
      while (!cancelled) {
        const nextTool = AUTO_CYCLE[index % AUTO_CYCLE.length];
        index += 1;
        setTool(nextTool);
        await wait(450);
        if (cancelled) return;
        const completed = await runPreview(nextTool, true);
        if (cancelled) return;
        await wait(completed ? AUTO_RESULT_MS : 1400);
      }
    };

    void loop();
    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
      timers.clear();
    };
  }, [autoPlay, runPreview, sampleUrl]);

  const run = async () => {
    setAutoPlay(false);
    await runPreview(tool);
  };

  const download = () => {
    if (!result) return;
    setAutoPlay(false);
    downloadBlob(result.blob, result.fileName);
  };

  const outputFormat =
    tool === "convert" ? format.toUpperCase() : "WebP";
  const change = result ? formatSaved(originalSize, result.outputSize) : "—";

  return (
    <div
      className="motion-rise motion-rise-2 w-full max-w-[620px] overflow-hidden rounded-xl border border-line bg-surface scroll-mt-[84px] min-[900px]:max-w-none"
      id="demo"
      aria-label="Live image tool preview"
    >
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted">
            Try a tool
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-muted transition-colors hover:text-ink"
              onClick={() => setAutoPlay((value) => !value)}
              aria-pressed={autoPlay}
              aria-label={autoPlay ? "Pause auto preview" : "Resume auto preview"}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  autoPlay ? "bg-accent" : "bg-line-strong",
                  autoPlay && busy ? "working-cursor" : "",
                )}
                aria-hidden="true"
              />
              {autoPlay ? "Auto" : "Paused"}
            </button>
            <span className={accentBadge}>
              <Icon name="laptop" size={12} />
              Local
            </span>
          </div>
        </div>
        <div className={cn(segmented, "mt-2.5")} role="group" aria-label="Preview tool">
          {DEMO_TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(segmentedButton, "h-8")}
              aria-pressed={tool === item.id}
              onClick={() => chooseTool(item.id)}
              disabled={busy}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden bg-code">
        {sampleUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="block size-full object-cover"
            src={sampleUrl}
            alt="Bundled coastal landscape sample"
            width={1600}
            height={1200}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-code text-xs text-ink-muted">
            {error && !loading ? "Sample unavailable" : "Loading sample..."}
          </div>
        )}
        {loading ? (
          <span className="absolute left-2.5 top-2.5 rounded border border-line bg-raised px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em]">
            Loading
          </span>
        ) : busy ? (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded border border-line bg-raised px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em]">
            Working
            <span className="working-cursor inline-block h-2.5 w-[2px] bg-accent" aria-hidden="true" />
          </span>
        ) : (
          <span className="absolute left-2.5 top-2.5 rounded border border-line bg-raised px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em]">
            {tool === "compress" ? "Compressor" : tool === "convert" ? "Converter" : "Resizer"}
          </span>
        )}
        {busy ? (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="working-scan absolute inset-x-0 top-0 h-full">
              <div className="h-px w-full bg-accent/80" />
            </div>
            <span className="demo-pointer absolute left-[47%] top-[44%] text-ink">
              <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                <path
                  d="M3 2.5 16.5 12.5 10 13.8 6.6 20.5 3 2.5Z"
                  fill="currentColor"
                  stroke="#F4F1EA"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="demo-click absolute left-0 top-0 size-7 rounded-full border border-accent/70" />
            </span>
            <div className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-accent/15">
              <div className="working-progress h-full w-1/3 bg-accent" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="p-4">
        {tool === "compress" ? (
          <>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label className={fieldLabel} htmlFor="demo-quality">
                Quality
              </label>
              <span className={optionValue}>{quality}</span>
            </div>
            <input
              id="demo-quality"
              className={cn(range, "w-full")}
              type="range"
              min={40}
              max={95}
              step={1}
              value={quality}
              onChange={(event) => {
                setAutoPlay(false);
                setQuality(Number(event.target.value));
                resetResult();
              }}
              aria-valuetext={`${quality} percent`}
            />
            <p className={cn(optionHelp, "mt-1")}>Output format: WebP</p>
          </>
        ) : tool === "convert" ? (
          <>
            <label className={cn(fieldLabel, "mb-1 block")} htmlFor="demo-format">
              Output format
            </label>
            <select
              id="demo-format"
              className={select}
              value={format}
              onChange={(event) => {
                setAutoPlay(false);
                setFormat(event.target.value as ImageFormat);
                resetResult();
              }}
            >
              <option value="webp">WebP</option>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
            <p className={cn(optionHelp, "mt-1")}>JPG uses a white background for transparency.</p>
          </>
        ) : (
          <>
            <label className={cn(fieldLabel, "mb-1 block")} htmlFor="demo-width">
              Target width
            </label>
            <select
              id="demo-width"
              className={select}
              value={resizeWidth}
              onChange={(event) => {
                setAutoPlay(false);
                setResizeWidth(Number(event.target.value));
                resetResult();
              }}
            >
              <option value={1600}>1,600 px</option>
              <option value={1200}>1,200 px</option>
              <option value={800}>800 px</option>
              <option value={480}>480 px</option>
            </select>
            <p className={cn(optionHelp, "mt-1")}>Height follows the original aspect ratio.</p>
          </>
        )}

        <div
          className="my-[18px] grid grid-cols-3 gap-2 border-y border-line py-3"
          aria-live="polite"
        >
          <div>
            <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-[0.07em] text-ink-muted">
              Original
            </span>
            <strong className="text-[13px] font-medium tabular-nums">
              {originalSize ? formatBytes(originalSize) : "—"}
            </strong>
          </div>
          <div>
            <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-[0.07em] text-ink-muted">
              Result
            </span>
            <strong className="text-[13px] font-medium tabular-nums">
              {result ? formatBytes(result.outputSize) : "—"}
            </strong>
          </div>
          <div>
            <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-[0.07em] text-ink-muted">
              Change
            </span>
            <strong className="text-[13px] font-medium tabular-nums">{change}</strong>
          </div>
        </div>

        {error ? (
          <p className={cn(inlineDanger, "mb-3.5")} role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={cn(btnPrimary, btnSm)}
            onClick={() => void run()}
            disabled={!sampleUrl || busy}
          >
            {busy ? "Working..." : result ? "Run again" : "Run preview"}
          </button>
          <button
            type="button"
            className={cn(btnSecondary, btnSm)}
            onClick={download}
            disabled={!result || busy}
          >
            <Icon name="download" size={14} />
            Download
          </button>
          <Link className={textLink} href={`/tools/${tool === "compress" ? "image-compressor" : tool === "convert" ? "image-converter" : "image-resizer"}`}>
            Open full tool
            <Icon name="arrow-right" size={14} />
          </Link>
        </div>
        {result ? (
          <p className="mt-3.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
            <span>{result.width} × {result.height} px</span>
            <span aria-hidden="true">·</span>
            <span>{outputFormat}</span>
            {originalDimensions ? (
              <>
                <span aria-hidden="true">·</span>
                <span>from {originalDimensions}</span>
              </>
            ) : null}
          </p>
        ) : (
          <p className="mt-3.5 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-muted">
            <Icon name={autoPlay ? "refresh" : "play"} size={13} />
            {autoPlay ? (
              "Auto preview cycles through all three tools."
            ) : (
              <>
                Preview paused.
                <button
                  type="button"
                  className="underline decoration-line-strong underline-offset-2 transition-colors hover:text-ink hover:decoration-accent"
                  onClick={() => setAutoPlay(true)}
                >
                  Resume auto
                </button>
              </>
            )}
          </p>
        )}
        <p className="mt-3.5 flex items-center gap-1.5 text-xs text-ink-muted">
          <Icon name="lock" size={13} />
          Processed on your device. Nothing uploaded.
        </p>
      </div>
    </div>
  );
}
