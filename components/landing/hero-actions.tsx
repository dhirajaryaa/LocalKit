"use client";

import Link from "next/link";
import { useSearch } from "@/components/search/search-provider";
import { Icon } from "@/components/ui/icon";
import { btnLg, btnPrimary, btnSecondary, cn, kbd, textLink } from "@/lib/ui";

export function HeroActions() {
  const { open } = useSearch();
  return (
    <div className="mt-8 flex flex-wrap items-center gap-2.5 max-[480px]:flex-col max-[480px]:items-stretch">
      <a className={cn(btnPrimary, btnLg)} href="#tools">
        Browse the toolbox
        <Icon name="arrow-down" size={16} />
      </a>
      <button type="button" className={cn(btnSecondary, btnLg)} onClick={open}>
        Search tools
        <span className={kbd} aria-hidden="true">
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
    <Link href="/tools" className={cn(textLink, "mt-6")}>
      View all 19 tools
      <Icon name="arrow-right" size={15} />
    </Link>
  );
}
