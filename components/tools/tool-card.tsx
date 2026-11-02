import Link from "next/link";
import { CategoryIcon, Icon } from "@/components/ui/icon";
import { chip } from "@/lib/ui";
import { CATEGORIES, type Tool } from "@/lib/tools/types";

export function ToolCard({ tool }: { tool: Tool }) {
  const category = CATEGORIES.find((item) => item.id === tool.category);
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group motion-lift relative flex min-h-[220px] flex-col border-b border-r border-line bg-bg p-6 transition-colors hover:bg-surface"
      aria-label={`${tool.name}: ${tool.tagline}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex size-10 items-center justify-center rounded-lg border border-line text-ink transition-colors group-hover:border-line-strong"
            aria-hidden="true"
          >
            <CategoryIcon category={tool.category} size={20} />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-muted">
            {category?.name ?? tool.category}
          </span>
        </div>
        <span
          className="text-line-strong transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:text-accent motion-reduce:transform-none"
          aria-hidden="true"
        >
          <Icon name="arrow-right" size={18} />
        </span>
      </div>
      <h3 className="mt-6 text-[21px]">{tool.name}</h3>
      <p className="mt-1.5 text-sm leading-normal text-ink-muted">{tool.tagline}</p>
      <div
        className="mt-auto flex flex-wrap gap-1 pt-5"
        aria-label={`Formats: ${tool.inputFormats.join(", ")} to ${tool.outputFormats.join(", ")}`}
      >
        {tool.inputFormats.slice(0, 2).map((format) => (
          <span key={format} className={chip}>
            {format}
          </span>
        ))}
        <span className={chip} aria-hidden="true">
          →
        </span>
        {tool.outputFormats.slice(0, 2).map((format) => (
          <span key={`out-${format}`} className={chip}>
            {format}
          </span>
        ))}
      </div>
    </Link>
  );
}
