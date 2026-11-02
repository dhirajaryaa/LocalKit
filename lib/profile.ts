import { FALLBACK_PROFILE } from "@/lib/constants";

export interface ProfileLink {
  label: string;
  url: string;
}

export interface ProfileData {
  name: string;
  role: string;
  bio: string;
  site: string;
  writing: string;
  feed: string;
  links: ProfileLink[];
  featured: ProfileLink[];
}

const KNOWN_SOCIAL: Record<string, string> = {
  "github.com": "GitHub",
  "x.com": "X",
  "twitter.com": "X",
  "linkedin.com": "LinkedIn",
  "youtube.com": "YouTube",
  "instagram.com": "Instagram",
  "t.me": "Telegram",
};

export function parseProfile(source: string): ProfileData {
  const profile: ProfileData = {
    ...FALLBACK_PROFILE,
    links: [],
    featured: [],
  };
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const headingIndex = lines.findIndex((line) => /^#\s+\S/.test(line.trim()));
  if (headingIndex >= 0) {
    const heading = lines[headingIndex].replace(/^#\s+/, "").trim();
    const [name, role] = heading.split(/\s+[—–]\s+/, 2);
    if (name) profile.name = stripMarkdown(name).slice(0, 120);
    if (role) profile.role = stripMarkdown(role).slice(0, 120);
  }

  const afterHeading = lines.slice(Math.max(0, headingIndex + 1));
  for (const line of afterHeading) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^#{1,6}\s/.test(trimmed)) break;
    if (trimmed.startsWith("Sections:")) continue;
    if (
      trimmed.startsWith(">") ||
      (!trimmed.startsWith("#") && !trimmed.startsWith("-") && !trimmed.startsWith("*"))
    ) {
      const bio = stripMarkdown(trimmed.replace(/^>\s?/, "")).trim();
      if (bio) {
        profile.bio = bio.slice(0, 220);
        break;
      }
    }
  }

  const website = source.match(/^\s*-\s+\*\*Website:\*\*\s*(https?:\/\/[^\s|]+)/im);
  if (website) profile.site = normalizeUrl(website[1]);

  const writing = source.match(/writing\s*\(([^)]+)\)/i);
  if (writing) {
    const url = safeHttpsUrl(writing[1]);
    if (url) profile.writing = url;
  }

  const feed =
    source.match(/feed\s+at\s+(https?:\/\/[^\s)]+)/i) ??
    source.match(/(https?:\/\/[^\s)]+\/rss\.xml)/i);
  if (feed) {
    const url = safeHttpsUrl(feed[1]);
    if (url) profile.feed = url;
  }

  const socialFromFields = parseFields(source);
  const socialFromMarkdown = parseMarkdownLinks(source, profile.site);
  profile.links = dedupe([...socialFromFields, ...socialFromMarkdown]).slice(0, 6);

  const featured = [
    ...parseProjectSection(lines, /^##\s+Live Tools\b/i),
    ...parseProjectSection(lines, /^##\s+Real-World Projects/i),
  ];
  const uniqueFeatured: ProfileLink[] = [];
  const seenFeatured = new Set<string>();
  for (const item of featured) {
    if (seenFeatured.has(item.url)) continue;
    seenFeatured.add(item.url);
    uniqueFeatured.push(item);
    if (uniqueFeatured.length === 3) break;
  }
  if (uniqueFeatured.length > 0) profile.featured = uniqueFeatured;

  return profile;
}

function parseFields(source: string): ProfileLink[] {
  const links: ProfileLink[] = [];
  const regex = /^\s*-\s+\*\*([^*]+):\*\*\s+(https?:\/\/[^\s|]+)/gim;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    const label = stripMarkdown(match[1]).trim();
    const url = safeHttpsUrl(match[2]);
    if (!url) continue;
    const known = knownSocial(url);
    if (!known) continue;
    links.push({ label: label || known, url });
  }
  return links;
}

function parseMarkdownLinks(source: string, site: string): ProfileLink[] {
  const links: ProfileLink[] = [];
  const regex = /\[([^\]]{1,40})\]\(([^)\s]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    const label = stripMarkdown(match[1]).trim();
    const url = safeHttpsUrl(match[2]);
    if (!url || url === site) continue;
    const known = knownSocial(url);
    if (!known) continue;
    links.push({ label: label || known, url });
  }
  return links;
}

function knownSocial(value: string): string | null {
  try {
    const hostname = new URL(value).hostname.replace(/^www\./, "").toLowerCase();
    const entry = Object.entries(KNOWN_SOCIAL).find(
      ([domain]) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
    return entry?.[1] ?? null;
  } catch {
    return null;
  }
}

function parseProjectSection(lines: string[], heading: RegExp): ProfileLink[] {
  const items: ProfileLink[] = [];
  let inside = false;
  let current = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s+/.test(trimmed)) {
      inside = heading.test(trimmed);
      current = "";
      continue;
    }
    if (!inside) continue;
    const itemHeading = trimmed.match(/^###\s+(?:\d+\.\s*)?(.+?)\s*$/);
    if (itemHeading) {
      current = stripMarkdown(itemHeading[1]).slice(0, 60);
      continue;
    }
    const urlLine = trimmed.match(/^-\s+\*\*URL:\*\*\s+(https?:\/\/\S+)/i);
    if (current && urlLine) {
      const url = safeHttpsUrl(urlLine[1]);
      if (url) items.push({ label: current, url });
      current = "";
    }
  }
  return items;
}

function dedupe(links: ProfileLink[]): ProfileLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
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
    const url = new URL(value.replace(/[),.;]+$/, ""));
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
