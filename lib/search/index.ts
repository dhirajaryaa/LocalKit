import Fuse, { type FuseResultMatch } from "fuse.js";
import { TOOLS } from "@/lib/tools/registry";
import { CATEGORIES } from "@/lib/tools/types";
import type { Tool } from "@/lib/tools/types";

export interface SearchDoc {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  categoryLabel: string;
  keywords: string;
  aliases: string;
  input: string;
  output: string;
}

export interface SearchHit {
  tool: Tool;
  score: number;
  matches: readonly FuseResultMatch[];
}

let fuse: Fuse<SearchDoc> | null = null;
let docs: SearchDoc[] = [];

export function buildIndex(): SearchDoc[] {
  return TOOLS.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    description: tool.description,
    category: tool.category,
    categoryLabel: CATEGORIES.find((category) => category.id === tool.category)?.name ?? "",
    keywords: tool.keywords.join(" "),
    aliases: tool.aliases.join(" "),
    input: tool.inputFormats.join(" "),
    output: tool.outputFormats.join(" "),
  }));
}

export function searchTools(query: string): SearchHit[] {
  if (!fuse) {
    docs = buildIndex();
    fuse = new Fuse(docs, {
      includeScore: true,
      includeMatches: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: "name", weight: 0.45 },
        { name: "aliases", weight: 0.25 },
        { name: "keywords", weight: 0.15 },
        { name: "description", weight: 0.1 },
        { name: "categoryLabel", weight: 0.05 },
      ],
    });
  }
  const normalized = normalize(query);
  if (!normalized) {
    return TOOLS.map((tool) => ({ tool, score: 0, matches: [] }));
  }
  const tokens = normalized.split(" ").filter(Boolean);
  const results = fuse.search(normalized);
  const ranked = results.map((result) => {
    const tool = TOOLS.find((candidate) => candidate.slug === result.item.slug);
    if (!tool) return null;
    const searchable = normalize(
      [
        tool.name,
        tool.aliases.join(" "),
        tool.keywords.join(" "),
        tool.description,
        tool.inputFormats.join(" "),
        tool.outputFormats.join(" "),
      ].join(" "),
    );
    const allTokens = tokens.every((token) => searchable.includes(token));
    const prefix = normalize(tool.name).startsWith(tokens[0] ?? "");
    return {
      tool,
      score: (result.score ?? 1) + (allTokens ? -0.25 : 0) + (prefix ? -0.2 : 0),
      matches: result.matches ?? [],
    };
  });
  const seen = new Set<string>();
  const filtered: SearchHit[] = [];
  for (const hit of ranked) {
    if (!hit || seen.has(hit.tool.slug)) continue;
    seen.add(hit.tool.slug);
    filtered.push(hit);
  }
  // Registry order is the final tie-breaker.
  return filtered.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.01) {
      return TOOLS.indexOf(a.tool) - TOOLS.indexOf(b.tool);
    }
    return a.score - b.score;
  });
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function highlightRanges(name: string, query: string): Array<{ text: string; match: boolean }> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [{ text: name, match: false }];
  const lower = name.toLowerCase();
  const exact = lower.indexOf(normalizedQuery);
  if (exact >= 0) {
    return [
      { text: name.slice(0, exact), match: false },
      { text: name.slice(exact, exact + normalizedQuery.length), match: true },
      { text: name.slice(exact + normalizedQuery.length), match: false },
    ].filter((part) => part.text);
  }
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const ranges: Array<[number, number]> = [];
  for (const token of tokens) {
    let start = 0;
    while (start < lower.length) {
      const index = lower.indexOf(token, start);
      if (index < 0) break;
      ranges.push([index, index + token.length]);
      start = index + token.length;
    }
  }
  if (ranges.length === 0) return [{ text: name, match: false }];
  ranges.sort((a, b) => a[0] - b[0]);
  const parts: Array<{ text: string; match: boolean }> = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start < cursor) continue;
    if (start > cursor) parts.push({ text: name.slice(cursor, start), match: false });
    parts.push({ text: name.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < name.length) parts.push({ text: name.slice(cursor), match: false });
  return parts;
}
