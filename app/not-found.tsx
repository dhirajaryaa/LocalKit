import type { Metadata } from "next";
import Link from "next/link";
import { SearchTrigger } from "@/components/search/search-trigger";
import { ToolCard } from "@/components/tools/tool-card";
import { Icon } from "@/components/ui/icon";
import { TOOLS, getTool } from "@/lib/tools/registry";
import { btnLg, btnPrimary, btnSecondary, bodyL, cn, displayL, eyebrow, shell, textLink, toolGrid } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page is not in the LocalKit toolbox.",
};

const popularSlugs = ["image-compressor", "merge-pdf", "video-to-gif"];
const popular = popularSlugs
  .map((slug) => getTool(slug))
  .filter((tool): tool is NonNullable<ReturnType<typeof getTool>> => Boolean(tool));

export default function NotFound() {
  return (
    <div className={cn(shell, "py-16 md:py-24")}>
      <p className={cn(eyebrow, "mb-5")}>404 / Not found</p>
      <h1 className={cn(displayL, "max-w-[820px]")}>This page isn&apos;t in the toolbox.</h1>
      <p className={cn(bodyL, "mt-5 max-w-[600px] text-ink-muted")}>
        The link may be old, or the address has a typo. Nothing happened to your files, and no
        processing is running in the background.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-2.5 max-[480px]:flex-col max-[480px]:items-stretch">
        <Link className={cn(btnPrimary, btnLg)} href="/">
          Back to home
          <Icon name="arrow-right" size={16} />
        </Link>
        <Link className={cn(btnSecondary, btnLg)} href="/tools">
          Browse all {TOOLS.length} tools
          <Icon name="arrow-right" size={16} />
        </Link>
        <SearchTrigger />
      </div>

      <section className="mt-16 border-t border-line pt-8 md:mt-20">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">
              Popular tools
            </p>
            <h2 className="mt-2 text-2xl">Start somewhere useful.</h2>
          </div>
          <Link className={textLink} href="/tools">
            View every tool
            <Icon name="arrow-right" size={14} />
          </Link>
        </div>
        <div className={toolGrid}>
          {popular.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  );
}
