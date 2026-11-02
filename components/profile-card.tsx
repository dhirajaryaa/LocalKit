import type { ProfileData } from "@/lib/profile";
import { cn, textLink } from "@/lib/ui";

export function ProfileCard({ profile }: { profile: ProfileData }) {
  return (
    <div className="mt-6 flex min-h-[92px] max-w-[380px] flex-col gap-1" aria-live="polite">
      <span className="text-sm font-medium">{profile.name}</span>
      {profile.bio ? <span className="text-[13px] text-ink-muted">{profile.bio}</span> : null}
      <a className={cn(textLink, "mt-1")} href={profile.site} target="_blank" rel="noopener noreferrer me">
        dhirajarya.in
      </a>
    </div>
  );
}
