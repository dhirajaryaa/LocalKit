"use client";

import { useCallback, useRef, useState } from "react";
import { Dropzone, Field, FileList, FileRow } from "@/components/tools/tool-kit";
import { Icon } from "@/components/ui/icon";
import { LIMITS } from "@/lib/constants";
import { getPdfInfo, parsePageRanges, type PdfInfo } from "@/lib/engines/pdf";
import { fetchSampleFile } from "@/lib/files/sample";
import { formatBytes } from "@/lib/files/format";
import { inlineDanger, inlineWarning, input, optionHelp } from "@/lib/ui";

export interface PdfItem extends PdfInfo {
  file: File;
  id: string;
}

export interface PdfSample {
  path: string;
  name: string;
  type: string;
}

interface SinglePdfOptions {
  maxPages?: number;
  sample?: PdfSample;
}

export function useSinglePdf(options: SinglePdfOptions = {}) {
  const maxPages = options.maxPages ?? LIMITS.pdf.maxPages;
  const [item, setItem] = useState<PdfItem | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (file: File) => {
      const id = requestId.current + 1;
      requestId.current = id;
      setError("");
      setNotice("");
      if (file.size === 0) {
        setError("This file is empty.");
        return;
      }
      if (file.size > LIMITS.pdf.perFile) {
        setError(
          `${file.name} is ${formatBytes(file.size)}. The PDF limit is ${formatBytes(LIMITS.pdf.perFile)} per file.`,
        );
        return;
      }
      setLoading(true);
      try {
        const info = await getPdfInfo(file);
        if (requestId.current !== id) return;
        if (info.pageCount === 0) throw new Error("This PDF has no pages.");
        if (info.pageCount > maxPages) {
          throw new Error(`This PDF has ${info.pageCount} pages. This tool supports up to ${maxPages}.`);
        }
        setItem({ ...info, file, id: `${Date.now()}-${file.name}` });
      } catch (caught) {
        if (requestId.current !== id) return;
        setError(caught instanceof Error ? caught.message : "This PDF could not be read.");
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    },
    [maxPages],
  );

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      if (files.length > 1) setNotice("This tool takes one PDF. The first file was used.");
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
    setError,
    setNotice,
    setItem,
  };
}

export type SinglePdfController = ReturnType<typeof useSinglePdf>;

export function PdfPicker({
  source,
  disabled = false,
  sampleLabel = "Try a sample PDF",
}: {
  source: SinglePdfController;
  disabled?: boolean;
  sampleLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { item, loading, error, notice, sampleBusy } = source;

  if (!item) {
    return (
      <div className="grid gap-3">
        <Dropzone
          accept="application/pdf,.pdf"
          formats="PDF"
          limitText={`up to ${formatBytes(LIMITS.pdf.perFile)}`}
          onFiles={source.addFiles}
          disabled={disabled || loading}
          sample={
            source.hasSample && sampleLabel
              ? { label: sampleLabel, onSelect: source.loadSample, busy: sampleBusy }
              : undefined
          }
        />
        {loading ? <p className={optionHelp}>Reading PDF…</p> : null}
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
        summary={`1 PDF · ${item.pageCount} ${item.pageCount === 1 ? "page" : "pages"} · ${formatBytes(item.file.size)}`}
        onAdd={() => inputRef.current?.click()}
        addLabel="Replace"
        disabled={disabled || loading}
      >
        <FileRow
          name={item.file.name}
          size={item.file.size}
          meta={`PDF · ${item.pageCount} ${item.pageCount === 1 ? "page" : "pages"}`}
          thumbnail={<Icon name="file" size={18} />}
          onRemove={source.clear}
          disabled={disabled || loading}
        />
      </FileList>
      {loading ? <p className={optionHelp}>Reading PDF…</p> : null}
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
        accept="application/pdf,.pdf"
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

export function PdfPageRangeField({
  value,
  onChange,
  pageCount,
  disabled = false,
  help,
}: {
  value: string;
  onChange: (value: string) => void;
  pageCount: number;
  disabled?: boolean;
  help?: string;
}) {
  const parsed = parsePageRanges(value, pageCount);
  return (
    <Field
      label="Pages"
      htmlFor="pdf-page-range"
      help={
        <>
          {help ?? "Use numbers and ranges, such as 1-3, 5, 8-10. Output stays in document order."}
          {!parsed.error ? (
            <span className="mt-1 block font-mono text-[10px] text-ink-muted">
              {parsed.pages.length} {parsed.pages.length === 1 ? "page" : "pages"} selected
            </span>
          ) : null}
        </>
      }
    >
      <input
        id="pdf-page-range"
        className={input}
        type="text"
        value={value}
        placeholder={pageCount > 0 ? `1-${pageCount}` : "1-3, 5"}
        disabled={disabled}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(parsed.error)}
      />
      {parsed.error && pageCount > 0 ? (
        <span className={inlineDanger} role="alert">
          {parsed.error}
        </span>
      ) : null}
    </Field>
  );
}

export function allPagesRange(pageCount: number): string {
  return pageCount > 0 ? `1-${pageCount}` : "";
}
