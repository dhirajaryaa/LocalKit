"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "./search-provider";
import { searchTools, highlightRanges, type SearchHit } from "@/lib/search";
import { recentTools, clearRecents, type RecentTool } from "@/lib/search/recents";
import { CATEGORIES } from "@/lib/tools/types";
import type { CategoryId, Tool } from "@/lib/tools/types";
import { TOOLS } from "@/lib/tools/registry";
import { Icon } from "@/components/ui/icon";
import { btnSecondary, btnSm, cn, iconButton, kbd } from "@/lib/ui";

interface CommandPaletteProps {
  onClose: () => void;
}

interface OptionItem {
  id: string;
  kind: "tool" | "action";
  label: string;
  description?: string;
  category?: string;
  icon: "image" | "file" | "video" | "film" | "audio" | "sun" | "grid" | "trash";
  tool?: Tool;
  action?: "theme" | "all-tools" | "clear-recents";
}

interface Group {
  id: string;
  label: string;
  options: OptionItem[];
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<Tool[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [shortcut, setShortcut] = useState("Ctrl K");
  const [announcement, setAnnouncement] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const previousAnnouncement = useRef("");

  useEffect(() => {
    try {
      setRecents(recentTools());
    } catch {
      setRecents([]);
    }
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
    setShortcut(isMac ? "⌘ K" : "Ctrl K");
    inputRef.current?.focus();
  }, []);

  const actions = useMemo<OptionItem[]>(() => {
    const list: OptionItem[] = [
      {
        id: "action-theme",
        kind: "action",
        label: "Toggle theme",
        description: "Switch between light and dark",
        icon: "sun",
        action: "theme",
      },
      {
        id: "action-all-tools",
        kind: "action",
        label: "Go to all tools",
        description: "Open the full toolbox",
        icon: "grid",
        action: "all-tools",
      },
    ];
    if (recents.length > 0) {
      list.push({
        id: "action-clear-recents",
        kind: "action",
        label: "Clear recent tools",
        description: "Remove locally stored recents",
        icon: "trash",
        action: "clear-recents",
      });
    }
    return list;
  }, [recents.length]);

  const groups = useMemo<Group[]>(() => {
    const normalized = query.trim().toLowerCase();
    const matchesAction = (action: OptionItem) =>
      !normalized ||
      action.label.toLowerCase().includes(normalized) ||
      (action.description ?? "").toLowerCase().includes(normalized);
    const matchedActions = actions.filter(matchesAction);

    if (!normalized) {
      const recentGroups: Group[] =
        recents.length > 0
          ? [
              {
                id: "recent",
                label: "Recent",
                options: recents.map(toolToOption),
              },
            ]
          : [];
      const allGroups: Group[] = CATEGORIES.map((category) => ({
        id: `all-${category.id}`,
        label: category.name,
        options: TOOLS.filter((tool) => tool.category === category.id).map(toolToOption),
      })).filter((group) => group.options.length > 0);
      return [
        ...recentGroups,
        ...allGroups,
        ...(matchedActions.length ? [{ id: "actions", label: "Actions", options: matchedActions }] : []),
      ];
    }

    const hits = searchTools(normalized).slice(0, 20);
    const toolGroups: Group[] = [];
    for (const category of CATEGORIES) {
      const categoryHits = hits.filter((hit) => hit.tool.category === category.id);
      if (!categoryHits.length) continue;
      toolGroups.push({
        id: `results-${category.id}`,
        label: category.name,
        options: categoryHits.map((hit) => toolToOption(hit.tool)),
      });
    }
    return [
      ...toolGroups,
      ...(matchedActions.length ? [{ id: "actions", label: "Actions", options: matchedActions }] : []),
    ];
  }, [query, recents, actions]);

  const options = useMemo(() => groups.flatMap((group) => group.options), [groups]);
  const optionIds = useMemo(() => options.map((option) => option.id), [options]);
  const activeIndex = Math.max(0, optionIds.indexOf(activeId));

  useEffect(() => {
    setActiveId(optionIds[0] ?? "");
  }, [optionIds]);

  useEffect(() => {
    const count = options.filter((option) => option.kind === "tool").length;
    const message = query
      ? `${count} ${count === 1 ? "tool" : "tools"} found`
      : `${TOOLS.length} tools available`;
    if (message !== previousAnnouncement.current) {
      setAnnouncement(message);
      previousAnnouncement.current = message;
    }
  }, [options, query]);

  useEffect(() => {
    const active = optionRefs.current.get(activeId);
    active?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "Tab") {
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'input, button:not([tabindex="-1"]), a[href], [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => !element.hasAttribute("disabled"));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    dialog.addEventListener("keydown", onKey);
    return () => dialog.removeEventListener("keydown", onKey);
  }, [onClose]);

  const activate = (option: OptionItem | undefined) => {
    if (!option) return;
    if (option.kind === "tool" && option.tool) {
      router.push(`/tools/${option.tool.slug}`);
      onClose();
      return;
    }
    if (option.action === "theme") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
      onClose();
      return;
    }
    if (option.action === "all-tools") {
      router.push("/tools");
      onClose();
      return;
    }
    if (option.action === "clear-recents") {
      clearRecents();
      setRecents([]);
      setAnnouncement("Recent tools cleared");
    }
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!options.length) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const next = (activeIndex + delta + options.length) % options.length;
      setActiveId(options[next].id);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveId(options[0]?.id ?? "");
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveId(options[options.length - 1]?.id ?? "");
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      activate(options[activeIndex]);
    }
  };

  const noResults = query.trim().length > 0 && options.filter((option) => option.kind === "tool").length === 0;
  const suggestions = ["compress image", "merge pdf", "trim video", "make gif", "convert audio"];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-bg/85 p-5 pt-[15vh] max-md:items-stretch max-md:p-0"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="flex max-h-[70vh] w-[min(640px,100%)] flex-col overflow-hidden rounded-xl border border-line bg-raised shadow-sm max-md:h-dvh max-md:max-h-dvh max-md:w-full max-md:rounded-none max-md:border-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="palette-title"
      >
        <h2 id="palette-title" className="sr-only">
          Search tools
        </h2>
        <div className="flex items-center gap-3 border-b border-line px-4 max-md:min-h-16 max-md:pt-[env(safe-area-inset-top)]">
          <Icon name="search" size={18} className="text-ink-muted" />
          <input
            ref={inputRef}
            id="palette-search-input"
            className="h-14 flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted"
            type="text"
            value={query}
            placeholder={`Search ${TOOLS.length} tools...`}
            aria-label="Search tools"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={activeId || undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
          />
          <span className={kbd} aria-hidden="true">
            Esc
          </span>
          <button
            type="button"
            className={cn(iconButton, "md:hidden")}
            aria-label="Close search"
            onClick={onClose}
            data-palette-tab
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div
          id="search-results"
          className="overflow-y-auto overscroll-contain p-2"
          role="listbox"
          aria-label="Search results"
        >
          {noResults ? (
            <div className="px-5 py-7">
              <p className="text-sm text-ink-muted">No tool matches “{query.trim()}”.</p>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="h-7 rounded border border-line bg-transparent px-2.5 text-xs text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
                    onClick={() => setQuery(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={cn(btnSecondary, btnSm, "mt-4")}
                onClick={() => {
                  router.push("/tools");
                  onClose();
                }}
              >
                Browse all tools
              </button>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id} role="group" aria-labelledby={`group-${group.id}`}>
                <div
                  className="px-2.5 pb-1.5 pt-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted"
                  id={`group-${group.id}`}
                >
                  {group.label}
                </div>
                {group.options.map((option) => {
                  const selected = option.id === activeId;
                  return (
                    <button
                      key={option.id}
                      ref={(node) => {
                        if (node) optionRefs.current.set(option.id, node);
                        else optionRefs.current.delete(option.id);
                      }}
                      id={option.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      tabIndex={-1}
                      className={cn(
                        "flex min-h-14 w-full items-center gap-3 rounded-md border-0 bg-transparent px-2.5 py-2 text-left text-ink hover:bg-code",
                        selected && "bg-code",
                      )}
                      onMouseMove={() => setActiveId(option.id)}
                      onClick={() => activate(option)}
                    >
                      <span
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-line text-ink-muted"
                        aria-hidden="true"
                      >
                        <Icon name={option.icon} size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-sm font-medium",
                            selected && "underline decoration-accent underline-offset-[3px]",
                          )}
                        >
                          <HighlightedName name={option.label} query={query} />
                        </span>
                        {option.description ? (
                          <span className="block truncate text-xs text-ink-muted">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                      {option.category ? (
                        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-muted">
                          {option.category}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-2.5 font-mono text-[10px] text-ink-muted max-md:pb-[calc(10px+env(safe-area-inset-bottom))]">
          <span>
            <span className={cn(kbd, "mr-1")}>↑</span>
            <span className={cn(kbd, "mr-1")}>↓</span> navigate
            <span className="mx-2.5">·</span>
            <span className={cn(kbd, "mr-1")}>Enter</span> open
            <span className="mx-2.5">·</span>
            <span className={cn(kbd, "mr-1")}>Esc</span> close
          </span>
          <span>
            {TOOLS.length} tools · 0 uploads
          </span>
        </div>
        <div className="sr-only" role="status" aria-live="polite">
          {announcement}
        </div>
      </div>
    </div>
  );
}

function HighlightedName({ name, query }: { name: string; query: string }) {
  const parts = highlightRanges(name, query);
  return (
    <>
      {parts.map((part, index) =>
        part.match ? (
          <span key={index} className="underline decoration-accent underline-offset-[3px]">
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

function toolToOption(tool: Tool): OptionItem {
  return {
    id: `tool-${tool.slug}`,
    kind: "tool",
    label: tool.name,
    description: tool.tagline,
    category: CATEGORIES.find((category) => category.id === tool.category)?.name,
    icon: iconForCategory(tool.category),
    tool,
  };
}

function iconForCategory(category: CategoryId): OptionItem["icon"] {
  if (category === "images") return "image";
  if (category === "pdf") return "file";
  if (category === "video") return "video";
  if (category === "gif") return "film";
  return "audio";
}
