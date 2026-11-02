"use client";

import { useEffect, useRef, useState } from "react";
import { PdfPicker, useSinglePdf } from "@/components/tools/pdf-kit";
import {
  JobStatus,
  OptionsPanel,
  ResultShell,
  StartOver,
  useJob,
} from "@/components/tools/tool-kit";
import { Icon } from "@/components/ui/icon";
import { LIMITS } from "@/lib/constants";
import {
  loadPdfJs,
  normalizeRotation,
  organizePdf,
  renderPdfThumbnail,
  type PdfJsLike,
} from "@/lib/engines/pdf";
import { downloadBlob } from "@/lib/files/download";
import { baseName, formatBytes } from "@/lib/files/format";
import { SAMPLES } from "@/lib/files/sample";
import {
  btnGhost,
  btnSecondary,
  btnSm,
  cn,
  inlineWarning,
  optionHelp,
  resultPreview,
  shell,
} from "@/lib/ui";

interface OrganizeItem {
  key: string;
  sourceIndex: number;
  rotation: number;
}

function PageThumb({
  document,
  pageNumber,
  rotation,
  alt,
}: {
  document: PdfJsLike | null;
  pageNumber: number;
  rotation: number;
  alt: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUrl(null);
    setError(false);
    if (!document) return;
    let cancelled = false;
    const target = holder.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void renderPdfThumbnail(document, pageNumber, 180)
          .then((next) => {
            if (!cancelled) setUrl(next);
          })
          .catch(() => {
            if (!cancelled) setError(true);
          });
      },
      { rootMargin: "240px" },
    );
    observer.observe(target);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [document, pageNumber]);

  return (
    <div
      ref={holder}
      className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-white"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          className="max-h-full max-w-full object-contain transition-transform"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      ) : error ? (
        <span className="px-2 text-center text-[10px] text-ink-muted">Preview unavailable</span>
      ) : (
        <span className="size-5 animate-pulse rounded-full border-2 border-line border-t-ink-muted" />
      )}
    </div>
  );
}

export function OrganizePdfTool() {
  const pdf = useSinglePdf({ maxPages: LIMITS.pdf.organizeMaxPages, sample: SAMPLES.pdf });
  const job = useJob();
  const [pages, setPages] = useState<OrganizeItem[]>([]);
  const [document, setDocument] = useState<PdfJsLike | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ item: OrganizeItem; index: number } | null>(null);
  const [result, setResult] = useState<{ blob: Blob; name: string; preview: string | null } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const dragKey = useRef<string | null>(null);
  const busy = job.state.status === "running";
  const ready = Boolean(pdf.item) && pages.length > 0 && !pdf.loading;

  useEffect(() => {
    setPages([]);
    setDocument(null);
    setResult(null);
    setLastDeleted(null);
    if (!pdf.item) return;
    let cancelled = false;
    let loaded: PdfJsLike | null = null;
    void loadPdfJs(pdf.item.file)
      .then((next) => {
        if (cancelled) {
          void next.destroy();
          return;
        }
        loaded = next;
        setDocument(next);
        setPages(
          Array.from({ length: pdf.item?.pageCount ?? 0 }, (_, index) => ({
            key: `${pdf.item?.id}-${index}`,
            sourceIndex: index,
            rotation: 0,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setDocument(null);
      });
    return () => {
      cancelled = true;
      if (loaded) void loaded.destroy();
    };
  }, [pdf.item?.id]);

  const restoreOriginal = () => {
    if (!pdf.item) return;
    setPages(
      Array.from({ length: pdf.item.pageCount }, (_, index) => ({
        key: `${pdf.item?.id}-${index}-${Date.now()}`,
        sourceIndex: index,
        rotation: 0,
      })),
    );
    setLastDeleted(null);
    setAnnouncement("All pages restored to the original order.");
  };

  const move = (key: string, direction: -1 | 1) => {
    setPages((previous) => {
      const index = previous.findIndex((page) => page.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setAnnouncement("Page moved.");
    setResult(null);
  };

  const dropOn = (targetKey: string) => {
    const sourceKey = dragKey.current;
    dragKey.current = null;
    if (!sourceKey || sourceKey === targetKey) return;
    setPages((previous) => {
      const from = previous.findIndex((page) => page.key === sourceKey);
      const to = previous.findIndex((page) => page.key === targetKey);
      if (from < 0 || to < 0) return previous;
      const next = [...previous];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setAnnouncement("Page moved.");
    setResult(null);
  };

  const rotate = (key: string, direction: -1 | 1) => {
    setPages((previous) =>
      previous.map((page) =>
        page.key === key ? { ...page, rotation: normalizeRotation(page.rotation + 90 * direction) } : page,
      ),
    );
    setAnnouncement("Page rotated.");
    setResult(null);
  };

  const remove = (key: string) => {
    if (pages.length <= 1) return;
    const index = pages.findIndex((page) => page.key === key);
    if (index < 0) return;
    setLastDeleted({ item: pages[index], index });
    setPages((previous) => previous.filter((page) => page.key !== key));
    setAnnouncement("Page deleted. Undo is available.");
    setResult(null);
  };

  const undoDelete = () => {
    if (!lastDeleted) return;
    setPages((previous) => {
      const next = [...previous];
      next.splice(Math.min(lastDeleted.index, next.length), 0, lastDeleted.item);
      return next;
    });
    setLastDeleted(null);
    setAnnouncement("Deletion undone.");
    setResult(null);
  };

  const start = async () => {
    if (!pdf.item || !ready) return;
    setResult(null);
    await job.run(async (signal, report) => {
      report({ stage: "Saving reorganized pages", progress: 0.3 });
      const name = `${baseName(pdf.item?.file.name ?? "document")}-organized.pdf`;
      const bytes = await organizePdf(
        pdf.item!.file,
        pages.map((page) => ({ sourceIndex: page.sourceIndex, rotation: page.rotation })),
        name.replace(/\.pdf$/i, ""),
      );
      if (signal.aborted) throw new Error("Cancelled");
      report({ stage: "Creating a preview", progress: 0.85 });
      let preview: string | null = null;
      try {
        const doc = await loadPdfJs(new Uint8Array(bytes));
        preview = await renderPdfThumbnail(doc, 1, 260);
        await doc.destroy();
      } catch {
        preview = null;
      }
      setResult({
        blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
        name,
        preview,
      });
      report({ stage: "Done", progress: 1 });
    });
  };

  const startOver = () => {
    job.reset();
    pdf.clear();
    setPages([]);
    setDocument(null);
    setResult(null);
    setLastDeleted(null);
  };

  return (
    <div
      className={cn(
        shell,
        "grid grid-cols-1 items-start gap-8 pb-[72px] pt-8 min-[1101px]:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <PdfPicker source={pdf} disabled={busy} />
        <JobStatus job={job} onRetry={start} />

        {pdf.item && pages.length > 0 ? (
          <div className="rounded-xl border border-line bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {pdf.item.pageCount} pages in, {pages.length} pages out
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Drag to reorder, or use the arrow buttons. Rotations apply when you save.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lastDeleted ? (
                  <button type="button" className={cn(btnSecondary, btnSm)} onClick={undoDelete} disabled={busy}>
                    Undo delete
                  </button>
                ) : null}
                <button type="button" className={cn(btnGhost, btnSm)} onClick={restoreOriginal} disabled={busy}>
                  <Icon name="refresh" size={13} /> Reset
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
              {pages.map((page, index) => (
                <div
                  key={page.key}
                  draggable={!busy}
                  onDragStart={(event) => {
                    dragKey.current = page.key;
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    dropOn(page.key);
                  }}
                  className="overflow-hidden rounded-lg border border-line bg-bg"
                >
                  <div className="relative">
                    <PageThumb
                      document={document}
                      pageNumber={page.sourceIndex + 1}
                      rotation={page.rotation}
                      alt={`Page ${index + 1} preview`}
                    />
                    <span className="absolute left-2 top-2 rounded bg-ink px-1.5 py-0.5 font-mono text-[10px] text-bg">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {page.rotation !== 0 ? (
                      <span className="absolute right-2 top-2 rounded bg-bg/90 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                        {page.rotation}°
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-1 border-t border-line px-1.5 py-1.5">
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        className="inline-flex size-7 items-center justify-center rounded text-ink-muted hover:bg-code hover:text-ink disabled:opacity-30"
                        aria-label={`Move page ${index + 1} left`}
                        disabled={busy || index === 0}
                        onClick={() => move(page.key, -1)}
                      >
                        <Icon name="arrow-left" size={13} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex size-7 items-center justify-center rounded text-ink-muted hover:bg-code hover:text-ink disabled:opacity-30"
                        aria-label={`Move page ${index + 1} right`}
                        disabled={busy || index === pages.length - 1}
                        onClick={() => move(page.key, 1)}
                      >
                        <Icon name="arrow-right" size={13} />
                      </button>
                    </div>
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        className="inline-flex size-7 items-center justify-center rounded text-ink-muted hover:bg-code hover:text-ink"
                        aria-label={`Rotate page ${index + 1} left`}
                        disabled={busy}
                        onClick={() => rotate(page.key, -1)}
                      >
                        <Icon name="rotate-left" size={13} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex size-7 items-center justify-center rounded text-ink-muted hover:bg-code hover:text-ink"
                        aria-label={`Rotate page ${index + 1} right`}
                        disabled={busy}
                        onClick={() => rotate(page.key, 1)}
                      >
                        <Icon name="rotate-right" size={13} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex size-7 items-center justify-center rounded text-ink-muted hover:bg-code hover:text-danger"
                        aria-label={`Delete page ${index + 1}`}
                        disabled={busy || pages.length <= 1}
                        onClick={() => remove(page.key)}
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {result ? (
          <ResultShell
            title="Reorganized PDF"
            stats={[
              { label: "Pages out", value: String(pages.length) },
              { label: "Size", value: formatBytes(result.blob.size) },
              { label: "Rotation", value: pages.some((page) => page.rotation) ? "Applied" : "None" },
            ]}
            preview={
              result.preview ? (
                <div className={cn(resultPreview, "mb-4 p-4")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.preview}
                    alt="First page of the reorganized PDF"
                    className="max-h-[320px] w-auto rounded border border-line bg-white"
                  />
                </div>
              ) : null
            }
            actions={
              <>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:brightness-90"
                  onClick={() => downloadBlob(result.blob, result.name)}
                >
                  <Icon name="download" size={15} /> Download PDF
                </button>
                <StartOver onClick={startOver} />
              </>
            }
          />
        ) : null}
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Save PDF"
          onAction={start}
          disabled={!ready || Boolean(result)}
          busy={busy}
          job={job}
          onRetry={start}
          note={
            <p className={optionHelp}>
              {pages.length <= 1 ? "Keep at least one page." : `${pdf.item?.pageCount ?? 0} pages in, ${pages.length} pages out.`}
            </p>
          }
        >
          <div className="rounded-md border border-line bg-code px-3 py-2.5 text-xs leading-normal text-ink-muted">
            Text and vector content stay intact. Page sizes and unusual dimensions are preserved.
          </div>
          <p className={optionHelp}>
            Drag and drop works with a mouse. Use Move left and Move right for keyboard and touch
            access.
          </p>
          {pages.length <= 1 ? (
            <p className={inlineWarning}>A PDF must keep at least one page.</p>
          ) : null}
        </OptionsPanel>
      </div>
    </div>
  );
}
