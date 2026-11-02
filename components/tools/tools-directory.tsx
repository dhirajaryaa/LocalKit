"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "@/components/search/search-provider";
import { ToolCard } from "@/components/tools/tool-card";
import { Icon } from "@/components/ui/icon";
import { TOOLS, getCategoryCounts } from "@/lib/tools/registry";
import { CATEGORIES, type CategoryId } from "@/lib/tools/types";
import {
  bodyL,
  btnGhost,
  btnSecondary,
  cn,
  displayL,
  eyebrow,
  shell,
  textLink,
  toolGrid,
} from "@/lib/ui";

type Filter = CategoryId | "all";

const counts = getCategoryCounts();

const categoryTab =
  "relative h-10 whitespace-nowrap border-0 bg-transparent px-3 text-[13px] text-ink-muted after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-transparent hover:text-ink aria-pressed:text-ink aria-pressed:after:bg-accent";

export function ToolsDirectory() {
  const { open } = useSearch();
  const [category, setCategory] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const params = new URLSearchParams(window.location.search);
    const initialCategory = params.get("category");
    const initialQuery = params.get("q") ?? "";
    if (initialCategory && isCategory(initialCategory)) setCategory(initialCategory);
    if (initialQuery) setQuery(initialQuery);
    const onPop = () => {
      const next = new URLSearchParams(window.location.search);
      const nextCategory = next.get("category");
      setCategory(nextCategory && isCategory(nextCategory) ? nextCategory : "all");
      setQuery(next.get("q") ?? "");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (query.trim()) params.set("q", query.trim());
    const suffix = params.toString();
    const next = `${window.location.pathname}${suffix ? `?${suffix}` : ""}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [category, query]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      if (category !== "all" && tool.category !== category) return false;
      if (!normalized) return true;
      const haystack = [
        tool.name,
        tool.tagline,
        tool.description,
        tool.keywords.join(" "),
        tool.aliases.join(" "),
        tool.inputFormats.join(" "),
        tool.outputFormats.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [category, query]);

  const grouped = category === "all" && !query.trim();
  const clear = () => {
    setQuery("");
    setCategory("all");
    inputRef.current?.focus();
  };

  const label = results.length === 1 ? "1 tool" : `${results.length} tools`;
  const summary = query.trim()
    ? `${label} match “${query.trim()}”`
    : category === "all"
      ? `${label} in the toolbox`
      : `${label} in ${CATEGORIES.find((item) => item.id === category)?.name}`;

  return (
    <>
      <section className="border-b border-line pb-12 pt-16">
        <div className={shell}>
          <p className={cn(eyebrow, "mb-[18px]")}>The toolbox</p>
          <h1 className={cn(displayL, "mb-4")}>All 19 tools.</h1>
          <p className={cn(bodyL, "max-w-[640px] text-ink-muted")}>
            Images, PDFs, video, GIFs, and audio. Pick one. Nothing leaves your device.
          </p>
        </div>
      </section>

      <div className={shell}>
        <div className="flex flex-wrap items-center gap-4 border-b border-line py-5 max-md:items-stretch">
          <div className="relative min-w-[220px] flex-1 max-w-[360px] max-md:max-w-none">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            >
              <Icon name="search" size={16} />
            </span>
            <input
              ref={inputRef}
              className="h-10 w-full rounded-lg border border-line bg-surface py-0 pl-[38px] pr-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              type="search"
              value={query}
              placeholder="Filter tools"
              aria-label="Filter tools"
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div
            className="flex flex-wrap gap-0.5 max-md:overflow-x-auto max-md:flex-nowrap"
            role="group"
            aria-label="Filter by category"
          >
            <button
              type="button"
              className={categoryTab}
              aria-pressed={category === "all"}
              onClick={() => setCategory("all")}
            >
              All {TOOLS.length}
            </button>
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={categoryTab}
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
              >
                {item.name} {counts[item.id]}
              </button>
            ))}
          </div>
        </div>

        <div className="pb-24 pt-10">
          <p
            className="min-h-6 font-mono text-[11px] uppercase tracking-[0.04em] text-ink-muted"
            role="status"
            aria-live="polite"
          >
            {summary}
          </p>

          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line-strong px-6 py-16 text-center">
              <h2 className="mb-2 text-2xl">No tool matches “{query.trim()}”</h2>
              <p className="mx-auto text-sm text-ink-muted">
                Try a shorter word, a format like PNG, or browse everything.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" className={btnSecondary} onClick={clear}>
                  Clear filter
                </button>
                <button type="button" className={btnGhost} onClick={open}>
                  Search all tools
                </button>
              </div>
            </div>
          ) : grouped ? (
            <>
              {CATEGORIES.map((item) => {
                const tools = results.filter((tool) => tool.category === item.id);
                if (!tools.length) return null;
                return (
                  <section key={item.id} aria-labelledby={`category-${item.id}`}>
                    <h2 id={`category-${item.id}`} className="mb-4 mt-8 text-[22px] first:mt-0">
                      {item.name}
                    </h2>
                    <div className={toolGrid}>
                      {tools.map((tool) => (
                        <ToolCard key={tool.slug} tool={tool} />
                      ))}
                    </div>
                  </section>
                );
              })}
              <p className="mt-8">
                <Link href="/privacy" className={textLink}>
                  Every tool runs in your browser
                  <Icon name="arrow-right" size={14} />
                </Link>
              </p>
            </>
          ) : (
            <div className={toolGrid}>
              {results.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function isCategory(value: string): value is CategoryId {
  return CATEGORIES.some((category) => category.id === value);
}
