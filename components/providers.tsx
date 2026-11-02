"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, type ReactNode } from "react";
import { SearchProvider } from "@/components/search/search-provider";
import { Header } from "@/components/layout/header";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="theme" disableTransitionOnChange>
      <ThemeColor />
      <SearchProvider>
        <Header />
        {children}
      </SearchProvider>
    </ThemeProvider>
  );
}

function ThemeColor() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const content = resolvedTheme === "dark" ? "#0E0E0C" : "#F4F1EA";
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  }, [resolvedTheme]);
  return null;
}
