"use client";

import { STORAGE_KEYS } from "@/lib/constants";
import { TOOL_BY_SLUG } from "@/lib/tools/registry";
import type { Tool } from "@/lib/tools/types";

export interface RecentTool {
  slug: string;
  at: number;
}

export function readRecents(): RecentTool[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.recents);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is RecentTool =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as RecentTool).slug === "string" &&
          typeof (entry as RecentTool).at === "number" &&
          TOOL_BY_SLUG.has((entry as RecentTool).slug),
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}

export function recordRecent(slug: string): void {
  if (typeof window === "undefined") return;
  if (!TOOL_BY_SLUG.has(slug)) return;
  try {
    const current = readRecents().filter((entry) => entry.slug !== slug);
    current.unshift({ slug, at: Date.now() });
    window.localStorage.setItem(STORAGE_KEYS.recents, JSON.stringify(current.slice(0, 5)));
  } catch {
    // Recents are optional.
  }
}

export function clearRecents(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.recents);
  } catch {
    // Recents are optional.
  }
}

export function recentTools(): Tool[] {
  return readRecents()
    .map((entry) => TOOL_BY_SLUG.get(entry.slug))
    .filter((tool): tool is Tool => Boolean(tool));
}
