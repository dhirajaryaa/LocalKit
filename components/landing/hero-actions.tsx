"use client";

import Link from "next/link";
import { useSearch } from "@/components/search/search-provider";
import { Icon } from "@/components/ui/icon";

export function HeroActions() {
  const { open } = useSearch();
  return (
    <div className="hero-actions">
      <a className="btn btn-primary btn-lg" href="#tools">
        Browse the toolbox
        <Icon name="arrow-down" size={16} />
      </a>
      <button type="button" className="btn btn-secondary btn-lg" onClick={open}>
        Search tools
        <span className="kbd" aria-hidden="true">
          Ctrl K
        </span>
      </button>
      <span className="sr-only">
        Press Command K on macOS or Control K on Windows and Linux to search.
      </span>
    </div>
  );
}

export function FeaturedFooterLink() {
  return (
    <div style={{ marginTop: 24 }}>
      <Link href="/tools" className="text-link">
        View all 19 tools
        <Icon name="arrow-right" size={15} />
      </Link>
    </div>
  );
}
