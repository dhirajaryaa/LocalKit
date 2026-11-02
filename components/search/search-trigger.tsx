"use client";

import { useSearch } from "@/components/search/search-provider";
import { Icon } from "@/components/ui/icon";
import { btnSecondary, btnLg, cn } from "@/lib/ui";

export function SearchTrigger({
  label = "Search all tools",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { open } = useSearch();
  return (
    <button type="button" className={cn(btnSecondary, btnLg, className)} onClick={open}>
      <Icon name="search" size={16} />
      {label}
    </button>
  );
}
