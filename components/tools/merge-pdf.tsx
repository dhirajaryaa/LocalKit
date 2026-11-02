"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dropzone,
  Field,
  FileList,
  FileRow,
  JobStatus,
  OptionsPanel,
  ResultShell,
  StartOver,
  useJob,
} from "@/components/tools/tool-kit";
import { Icon } from "@/components/ui/icon";
import { LIMITS } from "@/lib/constants";
import { getPdfInfo, loadPdfJs, mergePdfFiles, renderPdfThumbnail } from "@/lib/engines/pdf";
import { downloadBlob } from "@/lib/files/download";
import { baseName, formatBytes, formatSaved } from "@/lib/files/format";
import {
  cn,
  fileMeta,
  fileName,
  input,
  inlineWarning,
  optionHelp,
  resultPreview,
  shell,
} from "@/lib/ui";

interface MergeItem {
  id: string;
  file: File;
  pageCount: number;
  loading: boolean;
  error?: string;
}

export function MergePdfTool() {
  const [items, setItems] = useState<MergeItem[]>([]);
  const [notice, setNotice] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [outputName, setOutputName] = useState("merged.pdf");
  const [nameTouched, setNameTouched] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    pages: number;
    thumbnail: string | null;
  } | null>(null);
  const job = useJob();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragId = useRef<string | null>(null);
  const busy = job.state.status === "running";
  const valid = items.filter((item) => !item.error && item.pageCount > 0);
  const pageTotal = valid.reduce((sum, item) => sum + item.pageCount, 0);
  const sizeTotal = items.reduce((sum, item) => sum + item.file.size, 0);
  const tooManyPages = pageTotal > LIMITS.pdf.maxPages;
  const ready = valid.length >= 2 && !tooManyPages && !items.some((item) => item.loading);

  useEffect(() => {
    if (!nameTouched && items[0]) {
      setOutputName(`${baseName(items[0].file.name)}-merged.pdf`);
    }
  }, [items, nameTouched]);

  const addFiles = async (files: File[]) => {
    setNotice("");
    const openSlots = Math.max(0, LIMITS.pdf.count - items.length);
    if (openSlots === 0) {
      setNotice(`Merge PDF accepts up to ${LIMITS.pdf.count} PDFs.`);
      return;
    }
    const selected = files.slice(0, openSlots);
    if (files.length > openSlots) {
      setNotice(`Only the first ${openSlots} files were added. Merge PDF accepts up to ${LIMITS.pdf.count}.`);
    }
    const additions: MergeItem[] = selected.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      pageCount: 0,
      loading: true,
    }));
    setItems((previous) => [...previous, ...additions]);
    let runningSize = items.reduce((sum, item) => sum + item.file.size, 0);
    for (const addition of additions) {
      try {
        if (addition.file.size === 0) throw new Error("This file is empty.");
        if (addition.file.size > LIMITS.pdf.perFile) {
          throw new Error(`This PDF is ${formatBytes(addition.file.size)}. The limit is ${formatBytes(LIMITS.pdf.perFile)} per file.`);
        }
        if (runningSize + addition.file.size > LIMITS.pdf.total) {
          throw new Error("The combined files would exceed the 300 MB total limit.");
        }
        const info = await getPdfInfo(addition.file);
        runningSize += addition.file.size;
        setItems((previous) =>
          previous.map((item) =>
            item.id === addition.id
              ? {
                  ...item,
                  pageCount: info.pageCount,
                  loading: false,
                  error: info.pageCount === 0 ? "This PDF has no pages." : undefined,
                }
              : item,
          ),
        );
      } catch (caught) {
        setItems((previous) =>
          previous.map((item) =>
            item.id === addition.id
              ? {
                  ...item,
                  loading: false,
                  error: caught instanceof Error ? caught.message : "This PDF could not be read.",
                }
              : item,
          ),
        );
      }
    }
  };

  const remove = (id: string) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
    setResult(null);
  };

  const move = (id: string, direction: -1 | 1) => {
    setItems((previous) => {
      const index = previous.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setAnnouncement("File order updated.");
    setResult(null);
  };

  const dropOn = (targetId: string) => {
    const sourceId = dragId.current;
    dragId.current = null;
    if (!sourceId || sourceId === targetId) return;
    setItems((previous) => {
      const sourceIndex = previous.findIndex((item) => item.id === sourceId);
      const targetIndex = previous.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return previous;
      const next = [...previous];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setAnnouncement("File moved.");
    setResult(null);
  };

  const start = async () => {
    if (!ready) return;
    setResult(null);
    await job.run(async (signal, report) => {
      report({ stage: `Merging ${valid.length} PDFs`, progress: 0.15 });
      const title = outputName.replace(/\.pdf$/i, "") || "merged";
      const bytes = await mergePdfFiles(
        valid.map((item) => item.file),
        title,
      );
      if (signal.aborted) throw new Error("Cancelled");
      report({ stage: "Creating a preview", progress: 0.85 });
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      let thumbnail: string | null = null;
      try {
        const pdf = await loadPdfJs(new Uint8Array(bytes));
        thumbnail = await renderPdfThumbnail(pdf, 1, 260);
        await pdf.destroy();
      } catch {
        thumbnail = null;
      }
      setResult({ blob, pages: pageTotal, thumbnail });
      report({ stage: "Done", progress: 1 });
    });
  };

  const startOver = () => {
    job.reset();
    setItems([]);
    setResult(null);
    setNotice("");
    setOutputName("merged.pdf");
    setNameTouched(false);
  };

  return (
    <div
      className={cn(
        shell,
        "grid grid-cols-1 items-start gap-8 pb-[72px] pt-8 min-[1101px]:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        {items.length === 0 ? (
          <div className="grid gap-3">
            <Dropzone
              accept="application/pdf,.pdf"
              formats="PDF"
              limitText={`up to ${formatBytes(LIMITS.pdf.perFile)} each`}
              onFiles={addFiles}
              multiple
              disabled={busy}
            />
            {notice ? (
              <p className={inlineWarning} role="status">
                {notice}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3">
            <FileList
              summary={`${items.length} ${items.length === 1 ? "PDF" : "PDFs"} · ${formatBytes(sizeTotal)} · ${pageTotal} ${pageTotal === 1 ? "page" : "pages"}`}
              onAdd={items.length < LIMITS.pdf.count ? () => inputRef.current?.click() : undefined}
              addLabel="Add more"
              disabled={busy}
            >
              {items.map((item, index) => (
                <div
                  key={item.id}
                  draggable={!busy}
                  onDragStart={(event) => {
                    dragId.current = item.id;
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    dropOn(item.id);
                  }}
                >
                  <FileRow
                    index={index}
                    name={item.file.name}
                    size={item.file.size}
                    meta={item.loading ? "Reading…" : item.pageCount > 0 ? `${item.pageCount} pages` : "PDF"}
                    thumbnail={<Icon name="file" size={18} />}
                    onRemove={() => remove(item.id)}
                    onMoveUp={() => move(item.id, -1)}
                    onMoveDown={() => move(item.id, 1)}
                    canMoveUp={index > 0}
                    canMoveDown={index < items.length - 1}
                    disabled={busy}
                    error={item.error}
                  />
                </div>
              ))}
            </FileList>
            {tooManyPages ? (
              <p className={inlineWarning} role="alert">
                These files total {pageTotal} pages. Merge PDF accepts up to {LIMITS.pdf.maxPages} pages.
              </p>
            ) : null}
            {notice ? (
              <p className={inlineWarning} role="status">
                {notice}
              </p>
            ) : null}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length) void addFiles(files);
                event.target.value = "";
              }}
            />
          </div>
        )}

        <JobStatus job={job} onRetry={start} />

        {result ? (
          <ResultShell
            title="Merged PDF"
            stats={[
              { label: "Pages", value: String(result.pages) },
              { label: "Size", value: formatBytes(result.blob.size) },
              { label: "Files", value: String(valid.length) },
            ]}
            preview={
              result.thumbnail ? (
                <div className={cn(resultPreview, "mb-4 p-4")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.thumbnail}
                    alt="First page of the merged PDF"
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
                  onClick={() => downloadBlob(result.blob, outputName || "merged.pdf")}
                >
                  <Icon name="download" size={15} /> Download PDF
                </button>
                <StartOver onClick={startOver} />
              </>
            }
          >
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
              <div>
                <div className={fileName}>{outputName || "merged.pdf"}</div>
                <div className={cn(fileMeta, "mt-0.5")}>
                  <span>{formatBytes(result.blob.size)}</span>
                  <span>{formatSaved(sizeTotal, result.blob.size)} from sources</span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Interactive forms and annotations may not survive merging.
            </p>
          </ResultShell>
        ) : null}
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Merge PDFs"
          onAction={start}
          disabled={!ready || Boolean(result)}
          busy={busy}
          job={job}
          onRetry={start}
          note={
            <p className={optionHelp}>
              {valid.length < 2
                ? "Add at least two valid PDFs."
                : `${valid.length} PDFs · ${pageTotal} pages ready.`}
            </p>
          }
        >
          <Field
            label="Output file name"
            htmlFor="merge-name"
            help="The PDF title metadata uses this name. Keep the .pdf extension."
          >
            <input
              id="merge-name"
              className={input}
              type="text"
              value={outputName}
              disabled={busy}
              onChange={(event) => {
                setOutputName(event.target.value);
                setNameTouched(true);
              }}
            />
          </Field>
          <div className="rounded-md border border-line bg-code px-3 py-2.5 text-xs leading-normal text-ink-muted">
            Drag files to reorder them or use the arrow buttons. Page order inside each PDF is preserved.
          </div>
          <div className="rounded-md border border-line bg-code px-3 py-2.5 text-xs leading-normal text-ink-muted">
            Output pages: {pageTotal || "—"}
          </div>
        </OptionsPanel>
      </div>
    </div>
  );
}
