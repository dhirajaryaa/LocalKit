"use client";

import { useEffect } from "react";
import { recordRecent } from "@/lib/search/recents";

export function ToolViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    recordRecent(slug);
  }, [slug]);
  return null;
}
