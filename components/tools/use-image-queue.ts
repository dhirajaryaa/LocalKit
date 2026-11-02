"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadImage, processBatch, releaseImage, type LoadedImage } from "@/lib/engines/image";
import { formatBytes } from "@/lib/files/format";
import { LIMITS } from "@/lib/constants";

export interface ImageItem {
  id: string;
  file: File;
  loaded?: LoadedImage;
  error?: string;
  loading: boolean;
}

export interface ImageQueue {
  items: ImageItem[];
  notice: string;
  loading: boolean;
  ready: boolean;
  addFiles: (files: File[]) => Promise<void>;
  remove: (id: string) => void;
  move: (id: string, direction: -1 | 1) => void;
  clear: () => void;
  setNotice: (message: string) => void;
}

export function useImageQueue(options?: { maxCount?: number; maxTotal?: number }): ImageQueue {
  const maxCount = options?.maxCount ?? LIMITS.image.count;
  const maxTotal = options?.maxTotal ?? LIMITS.image.total;
  const [items, setItems] = useState<ImageItem[]>([]);
  const [notice, setNotice] = useState("");
  const itemsRef = useRef<ImageItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(
    () => () => {
      for (const item of itemsRef.current) releaseImage(item.loaded);
    },
    [],
  );

  const addFiles = useCallback(
    async (files: File[]) => {
      setNotice("");
      const accepted: ImageItem[] = [];
      const errors: string[] = [];
      let count = itemsRef.current.length;
      let total = itemsRef.current.reduce((sum, item) => sum + item.file.size, 0);
      for (const file of files) {
        if (count >= maxCount) {
          errors.push(`You can add up to ${maxCount} images at a time.`);
          break;
        }
        if (file.size === 0) {
          errors.push(`${file.name} is empty.`);
          continue;
        }
        if (file.size > LIMITS.image.perFile) {
          errors.push(`${file.name} is ${formatBytes(file.size)}. The limit is 30 MB per image.`);
          continue;
        }
        if (total + file.size > maxTotal) {
          errors.push("This batch would exceed 300 MB in total.");
          break;
        }
        accepted.push({
          id: crypto.randomUUID(),
          file,
          loading: true,
        });
        count += 1;
        total += file.size;
      }
      if (errors.length > 0) setNotice(errors[0]);
      if (accepted.length === 0) return;

      setItems((previous) => [...previous, ...accepted]);
      await processBatch(
        accepted,
        async (item) => {
          try {
            const loaded = await loadImage(item.file);
            setItems((previous) =>
              previous.map((candidate) =>
                candidate.id === item.id
                  ? { ...candidate, loaded, loading: false }
                  : candidate,
              ),
            );
          } catch (error) {
            setItems((previous) =>
              previous.map((candidate) =>
                candidate.id === item.id
                  ? {
                      ...candidate,
                      loading: false,
                      error: error instanceof Error ? error.message : "This image could not be read.",
                    }
                  : candidate,
              ),
            );
          }
        },
        2,
      );
    },
    [maxCount, maxTotal],
  );

  const remove = useCallback((id: string) => {
    setItems((previous) => {
      const target = previous.find((item) => item.id === id);
      releaseImage(target?.loaded);
      return previous.filter((item) => item.id !== id);
    });
  }, []);

  const move = useCallback((id: string, direction: -1 | 1) => {
    setItems((previous) => {
      const index = previous.findIndex((item) => item.id === id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= previous.length) return previous;
      const copy = [...previous];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  }, []);

  const clear = useCallback(() => {
    setItems((previous) => {
      for (const item of previous) releaseImage(item.loaded);
      return [];
    });
    setNotice("");
  }, []);

  const loading = items.some((item) => item.loading);
  const ready = items.length > 0 && !loading && items.every((item) => item.loaded);

  return { items, notice, loading, ready, addFiles, remove, move, clear, setNotice };
}
