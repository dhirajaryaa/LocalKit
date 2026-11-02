"use client";

import Link from "next/link";
import { useProfile } from "@/components/use-profile";
import { ProfileCard } from "@/components/profile-card";
import { TOOLS } from "@/lib/tools/registry";
import { FOOTER_TOOL_SLUGS } from "@/lib/tools/registry";
import { SUPPORT_URL } from "@/lib/constants";
import { brand, brandMark, cn } from "@/lib/ui";

const footerTools = FOOTER_TOOL_SLUGS.map((slug) => TOOLS.find((tool) => tool.slug === slug)).filter(
  (tool): tool is (typeof TOOLS)[number] => Boolean(tool),
);

const columnTitle =
  "mb-3.5 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-ink-muted";
const columnList = "grid list-none gap-2 p-0";
const columnLink =
  "text-[13px] text-ink-muted transition-colors hover:text-ink";

export function Footer() {
  const year = new Date().getFullYear();
  const profile = useProfile();
  const links = profile.links.filter((link) => {
    try {
      return new URL(link.url).protocol === "https:";
    } catch {
      return false;
    }
  });
  const profileSite = profile.site;
  const hasProfileLinks = links.length > 0;

  return (
    <footer className="border-t border-line pt-16">
      <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1200px] md:w-[calc(100%-5rem)]">
        <div className="flex flex-wrap items-start justify-between gap-8 border-b border-line pb-10">
          <div>
            <Link href="/" className={brand}>
              <BrandMark />
              LocalKit
            </Link>
            <p className="mt-3 max-w-[380px] text-sm text-ink-muted">
              Everyday file tools that never leave your device.
            </p>
            <ProfileCard profile={profile} />
          </div>
          <div
            className={cn(
              "grid w-full grid-cols-2 gap-8 min-[900px]:w-auto min-[900px]:min-w-[480px] min-[900px]:gap-12",
              hasProfileLinks ? "min-[900px]:grid-cols-3" : "min-[900px]:grid-cols-2",
            )}
          >
            <div>
              <h3 className={columnTitle}>Tools</h3>
              <ul className={columnList}>
                {footerTools.map((tool) => (
                  <li key={tool.slug}>
                    <Link href={`/tools/${tool.slug}`} className={columnLink}>
                      {tool.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/tools" className={columnLink}>
                    All tools
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className={columnTitle}>Project</h3>
              <ul className={columnList}>
                <li>
                  <Link href="/privacy" className={columnLink}>
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/licenses" className={columnLink}>
                    Licenses
                  </Link>
                </li>
                <li>
                  <a href={profileSite} target="_blank" rel="noopener noreferrer me" className={columnLink}>
                    dhirajarya.in
                  </a>
                </li>
                <li>
                  <a
                    href={SUPPORT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(columnLink, "text-accent hover:text-ink")}
                  >
                    Support my work ↗
                  </a>
                </li>
              </ul>
            </div>
            {hasProfileLinks ? (
              <div>
                <h3 className={columnTitle}>Elsewhere</h3>
                <ul className={columnList}>
                  {links.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer me"
                        className={columnLink}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2 py-6 font-mono text-[11px] tracking-[0.02em] text-ink-muted min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-6">
          <span>
            © {year} LocalKit · Built by Dhiraj Arya ·{" "}
            <a href={profileSite} target="_blank" rel="noopener noreferrer me">
              dhirajarya.in
            </a>
          </span>
          <span>All processing happens in your browser.</span>
        </div>
      </div>
    </footer>
  );
}

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      className={brandMark}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8.5 4H5v16h3.5M15.5 4H19v16h-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="4.25" />
    </svg>
  );
}
