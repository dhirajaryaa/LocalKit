"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  DownloadRow,
  ResultShell,
  SizeStats,
  StartOver,
  useBlobUrl,
} from "@/components/tools/tool-kit";
import { downloadBlob, downloadZip } from "@/lib/files/download";
import { formatBytes, timestamp } from "@/lib/files/format";
import type { ImageOutput } from "@/lib/engines/image";
import {
  btnPrimary,
  btnSecondary,
  cn,
  honesty,
  inlineWarning,
  optionHelp,
  resultPreview,
} from "@/lib/ui";

export interface ImageResultItem {
  id: string;
  output: ImageOutput;
  originalFile: File;
  originalSize: number;
  error?: string;
}

interface ImageResultsProps {
  items: ImageResultItem[];
  errors?: string[];
  zipSlug: string;
  onStartOver: () => void;
  allowCompare?: boolean;
  warning?: string;
  notes?: string[];
}

export function ImageResults({
  items,
  errors = [],
  zipSlug,
  onStartOver,
  allowCompare = false,
  warning,
  notes = [],
}: ImageResultsProps) {
  const single = items.length === 1 && !errors.length ? items[0] : null;
  const outputUrl = useBlobUrl(single?.output.blob ?? null);
  const originalUrl = useBlobUrl(single?.originalFile ?? null);
  const [showOriginal, setShowOriginal] = useState(false);
  const totalOriginal = items.reduce((sum, item) => sum + item.originalSize, 0);
  const totalOutput = items.reduce((sum, item) => sum + item.output.blob.size, 0);
  const anyLarger = items.some((item) => item.output.blob.size > item.originalSize);

  const downloadAll = () => {
    void downloadZip(
      items.map((item) => ({ name: item.output.fileName, blob: item.output.blob })),
      `localkit-${zipSlug}-${timestamp()}.zip`,
    );
  };

  return (
    <ResultShell
      title={items.length === 1 ? "Your image" : `${items.length} images ready`}
      stats={[
        { label: "Before", value: formatBytes(totalOriginal) },
        { label: "After", value: formatBytes(totalOutput) },
        {
          label: "Change",
          value:
            totalOriginal > 0
              ? `${Math.round(((totalOutput - totalOriginal) / totalOriginal) * 100)}%`
              : "—",
        },
      ]}
      preview={
        single && outputUrl ? (
          <div>
            <div className={resultPreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="block max-h-[420px] w-auto max-w-full"
                src={showOriginal && originalUrl ? originalUrl : outputUrl}
                alt={showOriginal ? "Original image" : "Processed image"}
              />
            </div>
            {allowCompare && originalUrl ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className={optionHelp}>
                  {single.output.width} × {single.output.height} px · {formatBytes(single.output.blob.size)}
                </span>
                <button
                  type="button"
                  className={cn(btnSecondary, "min-h-8 px-3 text-[13px]")}
                  onClick={() => setShowOriginal((value) => !value)}
                  aria-pressed={showOriginal}
                >
                  {showOriginal ? "Show result" : "Show original"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null
      }
      actions={
        <>
          {items.length === 1 ? (
            <button
              type="button"
              className={btnPrimary}
              onClick={() => downloadBlob(items[0].output.blob, items[0].output.fileName)}
            >
              <Icon name="download" size={15} />
              Download {items[0].output.fileName}
            </button>
          ) : (
            <button type="button" className={btnPrimary} onClick={downloadAll}>
              <Icon name="download" size={15} />
              Download all (.zip)
            </button>
          )}
          {single && single.output.blob.size > single.originalSize ? (
            <button
              type="button"
              className={btnSecondary}
              onClick={() => downloadBlob(single.originalFile, single.originalFile.name)}
            >
              Download original
            </button>
          ) : null}
          <StartOver onClick={onStartOver} />
        </>
      }
    >
      {warning ? (
        <p className={inlineWarning} role="status">
          {warning}
        </p>
      ) : null}
      {anyLarger ? (
        <p className={honesty}>
          One or more results are larger than the original. Re-encoding does not always save
          space; download the original if it is smaller.
        </p>
      ) : null}
      {notes.map((note) => (
        <p className={honesty} key={note}>
          {note}
        </p>
      ))}
      {items.length > 1 ? (
        <div className="mt-3 flex flex-col overflow-hidden rounded-lg border border-line">
          {items.map((item) => (
            <DownloadRow
              key={item.id}
              name={item.output.fileName}
              blob={item.output.blob}
              onDownload={() => downloadBlob(item.output.blob, item.output.fileName)}
              meta={`${item.output.width} × ${item.output.height} · from ${formatBytes(item.originalSize)}`}
            />
          ))}
        </div>
      ) : null}
      {errors.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-danger">
            {errors.length === 1 ? "One file was skipped" : `${errors.length} files were skipped`}
          </h3>
          <ul className="mt-2 list-disc pl-5 text-[13px] text-danger">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </ResultShell>
  );
}

export function ImageErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className={inlineWarning} role="status">
      {message}
    </p>
  );
}
