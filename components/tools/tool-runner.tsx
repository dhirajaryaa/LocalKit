"use client";

import type { ComponentType } from "react";
import { ImageConverterTool } from "@/components/tools/image-converter";
import { ImageCompressorTool } from "@/components/tools/image-compressor";
import { ImageResizerTool } from "@/components/tools/image-resizer";
import { FaviconStudioTool } from "@/components/tools/favicon-studio";
import { MergePdfTool } from "@/components/tools/merge-pdf";
import { SplitPdfTool } from "@/components/tools/split-pdf";
import { CompressPdfTool } from "@/components/tools/compress-pdf";
import { PdfToImagesTool } from "@/components/tools/pdf-to-images";
import { OrganizePdfTool } from "@/components/tools/organize-pdf";
import { WatermarkPdfTool } from "@/components/tools/watermark-pdf";
import { PdfPageNumbersTool } from "@/components/tools/pdf-page-numbers";
import { ImagesToPdfTool } from "@/components/tools/images-to-pdf";
import { AudioConverterTool } from "@/components/tools/audio-converter";
import { AudioTrimmerTool } from "@/components/tools/audio-trimmer";
import { cn, inlineWarning, shell } from "@/lib/ui";

const RUNNERS: Partial<Record<string, ComponentType>> = {
  "image-converter": ImageConverterTool,
  "image-compressor": ImageCompressorTool,
  "image-resizer": ImageResizerTool,
  "favicon-studio": FaviconStudioTool,
  "merge-pdf": MergePdfTool,
  "split-pdf": SplitPdfTool,
  "compress-pdf": CompressPdfTool,
  "pdf-to-images": PdfToImagesTool,
  "organize-pdf": OrganizePdfTool,
  "watermark-pdf": WatermarkPdfTool,
  "pdf-page-numbers": PdfPageNumbersTool,
  "images-to-pdf": ImagesToPdfTool,
  "audio-converter": AudioConverterTool,
  "audio-trimmer": AudioTrimmerTool,
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
