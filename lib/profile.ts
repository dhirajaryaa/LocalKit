import { FALLBACK_PROFILE } from "@/lib/constants";

export interface ProfileLink {
  label: string;
  url: string;
}

export interface ProfileData {
  name: string;
  bio: string;
  site: string;
  links: ProfileLink[];
}

export function parseProfile(source: string): ProfileData {
  const profile: ProfileData = { ...FALLBACK_PROFILE, links: [] };
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const headingIndex = lines.findIndex((line) => /^#\s+\S/.test(line.trim()));
  if (headingIndex >= 0) {
    const heading = lines[headingIndex].replace(/^#\s+/, "").trim();
    if (heading) profile.name = stripMarkdown(heading).slice(0, 120);
  }

  const afterHeading = lines.slice(Math.max(0, headingIndex + 1));
  for (const line of afterHeading) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^#{1,6}\s/.test(trimmed)) break;
    if (trimmed.startsWith(">") || (!trimmed.startsWith("#") && !trimmed.startsWith("-") && !trimmed.startsWith("*"))) {
      const bio = stripMarkdown(trimmed.replace(/^>\s?/, "")).trim();
      if (bio) {
        profile.bio = bio.slice(0, 220);
        break;
      }
    }
  }

  const siteMatch = source.match(/https:\/\/(?:www\.)?dhirajarya\.in\/?(?![\w.-])[^\s)>\]]*/i);
  if (siteMatch) profile.site = normalizeUrl(siteMatch[0]);

  const linkRegex = /\[([^\]]{1,40})\]\(([^)\s]+)\)/g;
  const known: Record<string, string> = {
    "github.com": "GitHub",
    "x.com": "X",
    "twitter.com": "X",
    "linkedin.com": "LinkedIn",
    "youtube.com": "YouTube",
  };
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(source)) !== null && profile.links.length < 5) {
    const label = stripMarkdown(match[1]).trim();
    const url = safeHttpsUrl(match[2]);
    if (!url) continue;
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    const knownLabel = Object.entries(known).find(
      ([domain]) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
    if (!knownLabel) continue;
    if (url === profile.site) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    profile.links.push({ label: label || knownLabel[1], url });
  }
  return profile;
}

function stripMarkdown(value: string): string {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    return FALLBACK_PROFILE.site;
  }
}

function safeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
