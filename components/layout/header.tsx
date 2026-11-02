"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useSearch } from "@/components/search/search-provider";
import { Icon } from "@/components/ui/icon";
import { TOOLS } from "@/lib/tools/registry";
import { brand, brandMark, headerNav, iconButton, kbd } from "@/lib/ui";
import { cn } from "@/lib/ui";
import { BrandMark } from "./footer";

export function Header() {
  const { open } = useSearch();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shortcut, setShortcut] = useState("Ctrl K");
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K");
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const trigger = document.getElementById("mobile-menu-trigger");
        if (!trigger?.contains(event.target as Node)) setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onClick);
    };
  }, [menuOpen]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 border-b border-line bg-bg">
        <div className="mx-auto flex h-full w-[calc(100%-2.5rem)] max-w-[1200px] items-center justify-between gap-6 md:w-[calc(100%-5rem)]">
          <Link href="/" className={brand} aria-label="LocalKit home">
            <BrandMark />
            LocalKit
          </Link>

          <nav className={headerNav} aria-label="Primary">
            <Link href="/tools" className="inline-flex items-center gap-1.5">
              Tools
              <span className={toolCountBadge}>{TOOLS.length}</span>
            </Link>
            <Link href="/#faq">FAQ</Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-2">
            <button
              type="button"
              className="hidden h-9 items-center gap-2.5 rounded-lg border border-line bg-surface px-2.5 pl-3 text-[13px] text-ink-muted transition-colors hover:border-line-strong hover:text-ink md:inline-flex"
              onClick={open}
              aria-label="Search tools"
            >
              <Icon name="search" size={16} />
              <span>Search</span>
              <span className={kbd} aria-hidden="true">
                {shortcut}
              </span>
            </button>
            <button
              type="button"
              className={cn(iconButton, "hidden md:inline-flex")}
              onClick={toggleTheme}
              aria-label={
                mounted
                  ? `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`
                  : "Switch theme"
              }
              title="Switch theme"
            >
              <Icon name={mounted && resolvedTheme === "dark" ? "sun" : "moon"} size={18} />
            </button>
            <button
              type="button"
              className={cn(iconButton, "md:hidden")}
              onClick={open}
              aria-label="Search tools"
            >
              <Icon name="search" size={19} />
            </button>
            <button
              id="mobile-menu-trigger"
              type="button"
              className={cn(iconButton, "md:hidden")}
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <Icon name={menuOpen ? "close" : "menu"} size={20} />
            </button>
          </div>
        </div>
      </header>
      <div
        id="mobile-menu"
        ref={menuRef}
        className={cn(
          "fixed inset-x-0 top-16 z-30 border-b border-line bg-raised p-5 md:hidden",
          menuOpen ? "block" : "hidden",
        )}
        aria-hidden={!menuOpen}
      >
        <nav className="grid gap-1" aria-label="Mobile">
          <Link href="/tools" tabIndex={menuOpen ? 0 : -1} className={mobileLink}>
            <span>Tools</span>
            <span className={cn(toolCountBadge, "ml-auto")}>{TOOLS.length}</span>
          </Link>
          <Link href="/#faq" tabIndex={menuOpen ? 0 : -1} className={mobileLink}>
            FAQ
          </Link>
          <Link href="/privacy" tabIndex={menuOpen ? 0 : -1} className={mobileLink}>
            Privacy
          </Link>
          <Link href="/licenses" tabIndex={menuOpen ? 0 : -1} className={mobileLink}>
            Licenses
          </Link>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              open();
            }}
            tabIndex={menuOpen ? 0 : -1}
            className={mobileLink}
          >
            <span className="inline-flex items-center gap-2">
              <Icon name="search" size={16} /> Search tools
            </span>
            <span className={cn(kbd, "ml-auto")}>{shortcut}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              toggleTheme();
              setMenuOpen(false);
            }}
            tabIndex={menuOpen ? 0 : -1}
            className={mobileLink}
          >
            <span className="inline-flex items-center gap-2">
              <Icon name={mounted && resolvedTheme === "dark" ? "sun" : "moon"} size={16} />
              {mounted ? `Use ${resolvedTheme === "dark" ? "light" : "dark"} theme` : "Toggle theme"}
            </span>
          </button>
        </nav>
      </div>
    </>
  );
}

const mobileLink =
  "flex min-h-11 items-center border-0 border-b border-line bg-transparent px-0 py-2 text-left text-base text-ink";

const toolCountBadge =
  "inline-flex h-5 min-w-5 items-center justify-center rounded bg-code px-1 font-mono text-[10px] tabular-nums text-ink-muted";
