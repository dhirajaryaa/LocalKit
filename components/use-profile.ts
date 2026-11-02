"use client";

import { useEffect, useState } from "react";
import { FALLBACK_PROFILE, PROFILE_ENDPOINT, PROFILE_TTL, STORAGE_KEYS } from "@/lib/constants";
import { parseProfile, type ProfileData } from "@/lib/profile";

interface CachedProfile {
  data: ProfileData;
  at: number;
}

export function useProfile(): ProfileData {
  const [profile, setProfile] = useState<ProfileData>(FALLBACK_PROFILE);

  useEffect(() => {
    let cancelled = false;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEYS.profile);
      if (raw) {
        const parsed = JSON.parse(raw) as CachedProfile;
        if (parsed?.data && Date.now() - parsed.at < PROFILE_TTL) {
          setProfile({
            ...FALLBACK_PROFILE,
            ...parsed.data,
            links: parsed.data.links ?? FALLBACK_PROFILE.links,
            featured: parsed.data.featured ?? FALLBACK_PROFILE.featured,
          });
          return;
        }
      }
    } catch {
      // A cache miss is fine.
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);
    fetch(PROFILE_ENDPOINT, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
      headers: { Accept: "text/plain" },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Profile unavailable");
        return response.text();
      })
      .then((text) => {
        if (cancelled) return;
        const parsed = parseProfile(text);
        const resolved = {
          ...parsed,
          name: parsed.name || FALLBACK_PROFILE.name,
          bio: parsed.bio || FALLBACK_PROFILE.bio,
          site: parsed.site || FALLBACK_PROFILE.site,
          writing: parsed.writing || FALLBACK_PROFILE.writing,
          feed: parsed.feed || FALLBACK_PROFILE.feed,
          links: parsed.links.length > 0 ? parsed.links : FALLBACK_PROFILE.links,
          featured: parsed.featured.length > 0 ? parsed.featured : FALLBACK_PROFILE.featured,
        };
        setProfile(resolved);
        try {
          window.sessionStorage.setItem(
            STORAGE_KEYS.profile,
            JSON.stringify({ data: resolved, at: Date.now() }),
          );
        } catch {
          // Caching is optional.
        }
      })
      .catch(() => {
        // The committed fallback stays in place.
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return profile;
}
