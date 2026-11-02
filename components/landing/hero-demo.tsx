"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { compressImage, loadImage, releaseImage, type LoadedImage } from "@/lib/engines/image";
import { downloadBlob } from "@/lib/files/download";
import { formatSaved, formatBytes } from "@/lib/files/format";
import { Icon } from "@/components/ui/icon";
import {
  btnPrimary,
  btnSm,
  cn,
  fieldLabel,
  inlineDanger,
  optionHelp,
  optionValue,
  range,
  textLink,
} from "@/lib/ui";

interface DemoResult {
  outputSize: number;
  originalSize: number;
  width: number;
  height: number;
  blob: Blob;
}

export function HeroDemo() {
  const [quality, setQuality] = useState(72);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef<LoadedImage | null>(null);
  const sampleUrlRef = useRef<string>("");
  const requestRef = useRef(0);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    let timer = 0;
    const start = () => {
      if (started) return;
      setStarted(true);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          start();
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    timer = window.setTimeout(start, 1200);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [started]);

  useEffect(() => {
    if (!started) return;
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
        sampleUrlRef.current = loaded.objectUrl;
        await runCompression(quality, true);
      } catch {
        if (!cancelled) {
          setBusy(false);
          setError("The demo could not run in this browser. Open the full tool to try your own file.");
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
      releaseImage(loadedRef.current);
      loadedRef.current = null;
    };
    // The quality effect below handles later runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  useEffect(() => {
    if (!started || !loadedRef.current) return;
    const timer = window.setTimeout(() => {
      void runCompression(quality, false);
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, started]);

  const runCompression = async (value: number, firstRun: boolean) => {
    const loaded = loadedRef.current;
    if (!loaded) return;
    const request = requestRef.current + 1;
    requestRef.current = request;
    setBusy(true);
    setError("");
    try {
      const compression = await compressImage(loaded, {
        mode: "quality",
        quality: value,
        targetBytes: 0,
        format: "webp",
        maxWidth: 1600,
        maxHeight: 0,
      });
      if (request !== requestRef.current) return;
      setResult({
        blob: compression.blob,
        outputSize: compression.outputSize,
        originalSize: compression.originalSize,
        width: compression.width,
        height: compression.height,
      });
    } catch {
      if (request !== requestRef.current) return;
      if (firstRun) {
        setError("The demo could not run in this browser. Open the full tool to try your own file.");
      }
    } finally {
      if (request === requestRef.current) setBusy(false);
    }
  };

  const download = () => {
    if (!result) return;
    downloadBlob(result.blob, "localkit-sample-compressed.webp");
  };

  const saved = result ? formatSaved(result.originalSize, result.outputSize) : "";
  const reduced = useReducedMotion();

  return (
    <div
      className="w-full max-w-[620px] overflow-hidden rounded-xl border border-line bg-surface scroll-mt-[84px] min-[900px]:max-w-none"
      id="demo"
      ref={cardRef}
      aria-label="Live image compressor demo"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted">
        <span>Try it</span>
        <strong className="font-medium text-ink">Image compressor</strong>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden bg-code">
        {sampleUrlRef.current && result ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="block size-full object-cover"
            src={sampleUrlRef.current}
            alt="Bundled coastal landscape sample"
            width={1600}
            height={1200}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-code text-xs text-ink-muted">
            {error ? "Sample unavailable" : "Compressing locally..."}
          </div>
        )}
        {busy && result ? (
          <span className="absolute right-2.5 top-2.5 rounded border border-line bg-raised px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em]">
            Working
          </span>
        ) : null}
      </div>
      <div className="p-4">
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
          onChange={(event) => setQuality(Number(event.target.value))}
          aria-valuetext={`${quality} percent`}
        />
        <p className={cn(optionHelp, "mt-1")}>Output format: WebP</p>

        <div
          className="my-[18px] grid grid-cols-3 gap-2 border-y border-line py-3"
          aria-live="polite"
        >
          <div>
            <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-[0.07em] text-ink-muted">
              Original
            </span>
            <strong className="text-[13px] font-medium tabular-nums">
              {result ? formatBytes(result.originalSize) : "—"}
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
            <strong className="text-[13px] font-medium tabular-nums">{result ? saved : "—"}</strong>
          </div>
        </div>

        {error ? (
          <p className={cn(inlineDanger, "mb-3.5")} role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={cn(btnPrimary, btnSm)}
            onClick={download}
            disabled={!result || busy}
          >
            <Icon name="download" size={14} />
            Download result
          </button>
          <Link className={textLink} href="/tools/image-compressor">
            Open the full tool
            <Icon name="arrow-right" size={14} />
          </Link>
        </div>
        {result ? (
          <p className="mt-3.5 flex items-center gap-1.5 text-xs text-ink-muted">
            {result.width} × {result.height} px · quality {quality}
          </p>
        ) : null}
        <p className="mt-3.5 flex items-center gap-1.5 text-xs text-ink-muted">
          <Icon name="lock" size={13} />
          Processed on your device. Nothing uploaded.
        </p>
      </div>
      <span className="sr-only">{reduced ? "Reduced motion is on." : ""}</span>
    </div>
  );
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listener = () => setReduced(query.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);
  return reduced;
}
