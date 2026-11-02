"use client";

import type { ComponentType } from "react";
import { ImageConverterTool } from "@/components/tools/image-converter";
import { ImageCompressorTool } from "@/components/tools/image-compressor";
import { ImageResizerTool } from "@/components/tools/image-resizer";
import { FaviconStudioTool } from "@/components/tools/favicon-studio";
import { cn, inlineWarning, shell } from "@/lib/ui";

const RUNNERS: Partial<Record<string, ComponentType>> = {
  "image-converter": ImageConverterTool,
  "image-compressor": ImageCompressorTool,
  "image-resizer": ImageResizerTool,
  "favicon-studio": FaviconStudioTool,
};

export function ToolRunner({ slug }: { slug: string }) {
  const Runner = RUNNERS[slug];
  if (!Runner) {
    return (
      <div className={cn(shell, "py-12")}>
        <p className={inlineWarning}>This tool is still being wired up.</p>
      </div>
    );
  }
  return <Runner />;
}
