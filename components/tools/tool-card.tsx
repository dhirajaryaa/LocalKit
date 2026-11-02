import Link from "next/link";
import { CategoryIcon, Icon } from "@/components/ui/icon";
import type { Tool } from "@/lib/tools/types";

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link href={`/tools/${tool.slug}`} className="tool-card" aria-label={`${tool.name}: ${tool.tagline}`}>
      <div className="tool-card-top">
        <span className="tool-icon" aria-hidden="true">
          <CategoryIcon category={tool.category} size={20} />
        </span>
        <span className="tool-card-arrow" aria-hidden="true">
          <Icon name="arrow-right" size={18} />
        </span>
      </div>
      <h3>{tool.name}</h3>
      <p>{tool.tagline}</p>
      <div className="tool-formats" aria-label={`Formats: ${tool.inputFormats.join(", ")} to ${tool.outputFormats.join(", ")}`}>
        {tool.inputFormats.slice(0, 2).map((format) => (
          <span key={format} className="chip">
            {format}
          </span>
        ))}
        <span className="chip" aria-hidden="true">
          →
        </span>
        {tool.outputFormats.slice(0, 2).map((format) => (
          <span key={`out-${format}`} className="chip">
            {format}
          </span>
        ))}
      </div>
    </Link>
  );
}
