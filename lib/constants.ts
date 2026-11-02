export { SITE_URL, absoluteUrl } from "@/lib/env";

export const SITE_NAME = "LocalKit";
export const SITE_TAGLINE = "Everyday file tools that never leave your device.";
export const SITE_DESCRIPTION =
  "Compress, convert, merge, trim, and extract images, PDFs, video, GIFs, and audio. Every tool runs in your browser.";
export const OG_IMAGE = "/og/localkit.png";

export const LIMITS = {
  image: {
    perFile: 30 * 1024 * 1024,
    count: 100,
    total: 300 * 1024 * 1024,
    maxSide: 16384,
    maxPixels: 100_000_000,
  },
  pdf: {
    perFile: 150 * 1024 * 1024,
    count: 30,
    total: 300 * 1024 * 1024,
    maxPages: 1000,
    organizeMaxPages: 500,
  },
  video: {
    perFile: 500 * 1024 * 1024,
    count: 1,
    maxSeconds: 20 * 60,
    gifMaxSeconds: 30,
  },
  gif: {
    perFile: 30 * 1024 * 1024,
    maxFrames: 300,
    maxAnimationSeconds: 30,
  },
  audio: {
    perFile: 200 * 1024 * 1024,
    maxSeconds: 2 * 60 * 60,
  },
} as const;

export const STORAGE_KEYS = {
  theme: "theme",
  recents: "localkit.recentTools",
  profile: "localkit.profile",
} as const;

export const PROFILE_ENDPOINT = "https://dhirajarya.in/llms.txt";
export const PROFILE_TTL = 6 * 60 * 60 * 1000;

export const FALLBACK_PROFILE = {
  name: "Dhiraj Arya",
  bio: "",
  site: "https://dhirajarya.in",
  links: [] as Array<{ label: string; url: string }>,
};
