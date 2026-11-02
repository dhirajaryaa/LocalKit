import type { ProfileData } from "@/lib/profile";
import { cn } from "@/lib/ui";

const miniLink =
  "text-[12px] text-ink-muted underline decoration-line-strong underline-offset-[3px] transition-colors hover:text-ink hover:decoration-accent";

export function ProfileCard({ profile }: { profile: ProfileData }) {
  return (
    <div className="mt-6 flex min-h-[92px] max-w-[380px] flex-col" aria-live="polite">
      <span className="text-sm font-medium">{profile.name}</span>
      {profile.bio ? (
        <span className="mt-0.5 text-[13px] leading-normal text-ink-muted">{profile.bio}</span>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <a
          className={miniLink}
          href={profile.writing}
          target="_blank"
          rel="noopener noreferrer me"
        >
          Writing
        </a>
        <a className={miniLink} href={profile.feed} target="_blank" rel="noopener noreferrer">
          RSS feed
        </a>
        <a className={miniLink} href={profile.site} target="_blank" rel="noopener noreferrer me">
          dhirajarya.in
        </a>
      </div>
      {profile.featured.length > 0 ? (
        <div className="mt-4 border-t border-line pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-muted">
            More of my work
          </span>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {profile.featured.map((item) => (
              <a
                key={item.url}
                className={cn(miniLink, "font-medium")}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
