"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { compressImage, loadImage, releaseImage, type LoadedImage } from "@/lib/engines/image";
import { downloadBlob } from "@/lib/files/download";
import { formatSaved, formatBytes } from "@/lib/files/format";
import { Icon } from "@/components/ui/icon";

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
    <div className="demo" id="demo" ref={cardRef} aria-label="Live image compressor demo">
      <div className="demo-head">
        <span>Try it</span>
        <strong>Image compressor</strong>
      </div>
      <div className="demo-media">
        {sampleUrlRef.current && result ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sampleUrlRef.current} alt="Bundled coastal landscape sample" width={1600} height={1200} />
        ) : (
          <div className="demo-skeleton">{error ? "Sample unavailable" : "Compressing locally..."}</div>
        )}
        {busy && result ? <span className="demo-busy">Working</span> : null}
      </div>
      <div className="demo-body">
        <div className="demo-slider">
          <label className="field-label" htmlFor="demo-quality">
            Quality
          </label>
          <span className="option-value">{quality}</span>
        </div>
        <input
          id="demo-quality"
          className="range demo-range"
          type="range"
          min={40}
          max={95}
          step={1}
          value={quality}
          onChange={(event) => setQuality(Number(event.target.value))}
          aria-valuetext={`${quality} percent`}
        />
        <p className="option-help" style={{ marginTop: 4 }}>
          Output format: WebP
        </p>

        <div className="demo-stats" aria-live="polite">
          <div className="demo-stat">
            <span>Original</span>
            <strong className="tabular">{result ? formatBytes(result.originalSize) : "—"}</strong>
          </div>
          <div className="demo-stat">
            <span>Result</span>
            <strong className="tabular">{result ? formatBytes(result.outputSize) : "—"}</strong>
          </div>
          <div className="demo-stat">
            <span>Change</span>
            <strong className="tabular">{result ? saved : "—"}</strong>
          </div>
        </div>

        {error ? (
          <p className="inline-note danger" role="alert" style={{ marginBottom: 14 }}>
            {error}
          </p>
        ) : null}

        <div className="demo-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={download}
            disabled={!result || busy}
          >
            <Icon name="download" size={14} />
            Download result
          </button>
          <Link className="text-link" href="/tools/image-compressor">
            Open the full tool
            <Icon name="arrow-right" size={14} />
          </Link>
        </div>
        {result ? (
          <p className="demo-note">
            {result.width} × {result.height} px · quality {quality}
          </p>
        ) : null}
        <p className="demo-note">
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
