"use client";

import { useRef } from "react";
import { Dropzone, FileList, FileRow } from "@/components/tools/tool-kit";
import type { ImageQueue } from "@/components/tools/use-image-queue";
import { Icon } from "@/components/ui/icon";
import { formatBytes } from "@/lib/files/format";
import { LIMITS } from "@/lib/constants";
import { inlineWarning } from "@/lib/ui";

export function ImageQueueList({
  queue,
  disabled = false,
  multiple = true,
  maxCount = LIMITS.image.count,
  sample,
}: {
  queue: ImageQueue;
  disabled?: boolean;
  multiple?: boolean;
  maxCount?: number;
  sample?: { label: string; onSelect: () => void; busy?: boolean };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const total = queue.items.reduce((sum, item) => sum + item.file.size, 0);

  if (queue.items.length === 0) {
    return (
      <Dropzone
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        formats="PNG, JPG, WebP"
        limitText={`up to ${formatBytes(LIMITS.image.perFile)} each`}
        onFiles={queue.addFiles}
        multiple={multiple}
        disabled={disabled}
        allowPaste
        sample={sample}
      />
    );
  }

  return (
    <div className="grid gap-3">
      <FileList
        summary={`${queue.items.length} ${queue.items.length === 1 ? "image" : "images"} · ${formatBytes(total)}`}
        onAdd={queue.items.length < maxCount ? () => inputRef.current?.click() : undefined}
        addLabel="Add more"
        disabled={disabled}
      >
        {queue.items.map((item, index) => (
          <FileRow
            key={item.id}
            index={multiple ? index : undefined}
            name={item.file.name}
            size={item.file.size}
            meta={
              item.loaded
                ? `${item.loaded.format.toUpperCase()} · ${item.loaded.width} × ${item.loaded.height}`
                : item.loading
                  ? "Reading..."
                  : "Could not read"
            }
            thumbnail={
              item.loaded ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.loaded.objectUrl} alt="" />
              ) : (
                <Icon name="image" size={18} />
              )
            }
            onRemove={() => queue.remove(item.id)}
            onMoveUp={multiple ? () => queue.move(item.id, -1) : undefined}
            onMoveDown={multiple ? () => queue.move(item.id, 1) : undefined}
            canMoveUp={index > 0}
            canMoveDown={index < queue.items.length - 1}
            disabled={disabled}
            error={item.error}
          />
        ))}
      </FileList>
      {queue.notice ? (
        <p className={inlineWarning} role="status">
          {queue.notice}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) void queue.addFiles(files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
