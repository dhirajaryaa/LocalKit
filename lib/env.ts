const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

/**
 * One place for the public app origin. Set NEXT_PUBLIC_SITE_URL at build time
 * (for example https://localkit.example) so canonical URLs, OG images, the
 * sitemap, robots.txt, and structured data all use the same host.
 */
export const SITE_URL = (configured || "http://localhost:3000").replace(/\/+$/, "");

export function absoluteUrl(path = "/"): string {
  return new URL(path.startsWith("/") ? path : `/${path}`, `${SITE_URL}/`).toString();
}
