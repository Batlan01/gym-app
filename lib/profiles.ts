// lib/profiles.ts
export type Profile = {
  id: string;
  name: string;
  createdAt: string;
};

export const LS_PROFILES = "gym.profiles";
export const LS_ACTIVE_PROFILE = "gym.activeProfileId";
export const GUEST_PROFILE_ID = "guest";

export function profileKey(profileId: string, suffix: string) {
  return `gym.${profileId}.${suffix}`;
}
