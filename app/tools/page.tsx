import type { Metadata } from "next";
import { ToolsDirectory } from "@/components/tools/tools-directory";
import { SITE_NAME, absoluteUrl } from "@/lib/constants";

export const metadata: Metadata = {
  title: "All tools",
  description:
    "The complete LocalKit toolbox: compress and convert images, edit PDFs, trim video, make GIFs, and convert audio. Everything runs in your browser.",
  alternates: { canonical: absoluteUrl("/tools") },
  openGraph: {
    title: `All tools · ${SITE_NAME}`,
    description: "19 private file tools that run in your browser.",
    url: absoluteUrl("/tools"),
  },
};

export default function ToolsPage() {
  return <ToolsDirectory />;
}
