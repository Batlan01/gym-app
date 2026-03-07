// lib/profiles.ts
export type Profile = { id: string; name: string; createdAt: string };

export const LS_PROFILES = "gym.profiles";
export const LS_ACTIVE_PROFILE = "gym.activeProfileId";
export const GUEST_PROFILE_ID = "guest";

export function isCloudProfileId(pid: string) {
  return pid.startsWith("fb:");
}
// alias – ha valahol így hívod
export const isFirebaseProfileId = isCloudProfileId;

export function fbProfileId(uid: string) {
  return `fb:${uid}`;
}

export function cloudUidFromProfileId(pid: string) {
  return pid.slice(3).trim();
}

export function profileKey(profileId: string, key: string) {
  return `gym.${profileId}.${key}`;
}

export function onboardedKey(profileId: string) {
  return `gym.${profileId}.onboarded`;
}

export function profileMetaKey(profileId: string) {
  return `gym.${profileId}.profileMeta`;
}

/** ---- Onboarding meta ---- */
export type Goal = "lose" | "maintain" | "gain";
export type TrainingPlace = "gym" | "home" | "mixed";
export type Level = "beginner" | "intermediate" | "advanced";
export type TrainingSplit = "fullbody" | "upperlower" | "ppl" | "custom";

export type ProfileMeta = {
  fullName?: string;

  // opcionális, de ha van érték, lehet null is (user kitörölte)
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;

  goal?: Goal;
  trainingPlace?: TrainingPlace;
  daysPerWeek?: number | null;

  level?: Level;
  split?: TrainingSplit;

  focus?: string[]; // mindig tömbként kezeljük
  notes?: string;
};
