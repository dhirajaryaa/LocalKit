import type { ProfileData } from "@/lib/profile";

export function ProfileCard({ profile }: { profile: ProfileData }) {
  return (
    <div className="profile-block" aria-live="polite">
      <span className="profile-name">{profile.name}</span>
      {profile.bio ? <span className="profile-bio">{profile.bio}</span> : null}
      <a className="text-link" href={profile.site} target="_blank" rel="noopener noreferrer me">
        dhirajarya.in
      </a>
    </div>
  );
}
