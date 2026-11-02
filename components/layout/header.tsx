"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useSearch } from "@/components/search/search-provider";
import { Icon } from "@/components/ui/icon";
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
      <header className="site-header">
        <div className="shell header-inner">
          <Link href="/" className="brand" aria-label="LocalKit home">
            <BrandMark />
            LocalKit
          </Link>

          <nav className="header-nav" aria-label="Primary">
            <Link href="/tools">Tools</Link>
            <Link href="/#faq">FAQ</Link>
          </nav>

          <div className="header-actions">
            <button type="button" className="search-trigger" onClick={open} aria-label="Search tools">
              <Icon name="search" size={16} />
              <span>Search</span>
              <span className="kbd" aria-hidden="true">
                {shortcut}
              </span>
            </button>
            <button
              type="button"
              className="icon-button theme-toggle"
              onClick={toggleTheme}
              aria-label={mounted ? `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme` : "Switch theme"}
              title="Switch theme"
            >
              <Icon name={mounted && resolvedTheme === "dark" ? "sun" : "moon"} size={18} />
            </button>
            <button
              type="button"
              className="icon-button mobile-search-button"
              onClick={open}
              aria-label="Search tools"
            >
              <Icon name="search" size={19} />
            </button>
            <button
              id="mobile-menu-trigger"
              type="button"
              className="icon-button mobile-menu-button"
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
        className={`mobile-menu${menuOpen ? " open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Mobile">
          <Link href="/tools" tabIndex={menuOpen ? 0 : -1}>
            Tools
          </Link>
          <Link href="/#faq" tabIndex={menuOpen ? 0 : -1}>
            FAQ
          </Link>
          <Link href="/privacy" tabIndex={menuOpen ? 0 : -1}>
            Privacy
          </Link>
          <Link href="/licenses" tabIndex={menuOpen ? 0 : -1}>
            Licenses
          </Link>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              open();
            }}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="search" size={16} /> Search tools
            </span>
            <span className="kbd" style={{ marginLeft: "auto" }}>
              {shortcut}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              toggleTheme();
              setMenuOpen(false);
            }}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name={mounted && resolvedTheme === "dark" ? "sun" : "moon"} size={16} />
              {mounted ? `Use ${resolvedTheme === "dark" ? "light" : "dark"} theme` : "Toggle theme"}
            </span>
          </button>
        </nav>
      </div>
    </>
  );
}
