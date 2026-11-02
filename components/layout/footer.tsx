"use client";

import Link from "next/link";
import { useProfile } from "@/components/use-profile";
import { ProfileCard } from "@/components/profile-card";
import { TOOLS } from "@/lib/tools/registry";
import { FOOTER_TOOL_SLUGS } from "@/lib/tools/registry";

const footerTools = FOOTER_TOOL_SLUGS.map((slug) => TOOLS.find((tool) => tool.slug === slug)).filter(
  (tool): tool is (typeof TOOLS)[number] => Boolean(tool),
);

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
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="brand">
              <BrandMark />
              LocalKit
            </Link>
            <p>Everyday file tools that never leave your device.</p>
            <ProfileCard profile={profile} />
          </div>
          <div className="footer-columns" style={{ gridTemplateColumns: hasProfileLinks ? undefined : "1fr 1fr" }}>
            <div className="footer-column">
              <h3>Tools</h3>
              <ul>
                {footerTools.map((tool) => (
                  <li key={tool.slug}>
                    <Link href={`/tools/${tool.slug}`}>{tool.name}</Link>
                  </li>
                ))}
                <li>
                  <Link href="/tools">All tools</Link>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Project</h3>
              <ul>
                <li>
                  <Link href="/privacy">Privacy</Link>
                </li>
                <li>
                  <Link href="/licenses">Licenses</Link>
                </li>
                <li>
                  <a href={profileSite} target="_blank" rel="noopener noreferrer me">
                    dhirajarya.in
                  </a>
                </li>
              </ul>
            </div>
            {hasProfileLinks ? (
              <div className="footer-column">
                <h3>Elsewhere</h3>
                <ul>
                  {links.map((link) => (
                    <li key={link.url}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer me">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {year} LocalKit · Built by Dhiraj Arya ·{" "}
            <a href={profileSite} target="_blank" rel="noopener noreferrer me">
              dhirajarya.in
            </a>
          </span>
          <span className="privacy-line">All processing happens in your browser.</span>
        </div>
      </div>
    </footer>
  );
}

export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 4H5v16h4M15 4h4v16h-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.25" />
    </svg>
  );
}
