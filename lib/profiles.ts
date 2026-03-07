// lib/profiles.ts
export type Profile = {
  id: string;
  name: string;
  createdAt: string;
};

export const LS_PROFILES = "gym.profiles";
export const LS_ACTIVE_PROFILE = "gym.activeProfileId";
export const GUEST_PROFILE_ID = "guest";

// általános kulcsgyártó
export function profileKey(profileId: string, suffix: string) {
  return `gym.${profileId}.${suffix}`;
}

// onboarding flag kulcs
export function onboardedKey(profileId: string) {
  return profileKey(profileId, "onboarded");
}

// (ha használod később) meta kulcs
export function profileMetaKey(profileId: string) {
  return profileKey(profileId, "profileMeta");
}
export function isCloudProfileId(profileId: string | null | undefined): boolean {
  return !!profileId && profileId.startsWith("fb:");
}

// (ha kell cloud uid)
export function cloudUidFromProfileId(profileId: string): string {
  return profileId.slice(3).trim();
}
