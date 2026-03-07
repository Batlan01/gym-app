"use client";

import { lsGet, lsSet } from "@/lib/storage";

export type ProfileMeta = {
  displayName: string;           // pl. "Nikolas"
  age?: number;                  // opcionális
  weightKg?: number;             // opcionális
  heightCm?: number;             // opcionális
  goal?: "cut" | "bulk" | "maintain" | "strength" | "hypertrophy" | "endurance";
  trainingPlace?: "gym" | "home" | "both";
  focus?: string[];              // pl. ["upper", "legs"]
  updatedAt: string;
  createdAt: string;
};

export function metaKey(profileId: string) {
  return `gym.${profileId}.meta`;
}

export function getProfileMeta(profileId: string): ProfileMeta | null {
  return lsGet<ProfileMeta | null>(metaKey(profileId), null);
}

export function setProfileMeta(profileId: string, meta: ProfileMeta) {
  lsSet(metaKey(profileId), meta);
}

/**
 * Minimum követelmény az onboarding “kész”-hez.
 * (Ezt bármikor szigoríthatjuk később.)
 */
export function isMetaComplete(meta: ProfileMeta | null): boolean {
  if (!meta) return false;
  if (!meta.displayName?.trim()) return false;
  // most ennyi elég, később: goal/trainingPlace/etc kötelező lehet
  return true;
}

export function needsOnboarding(profileId: string | null | undefined): boolean {
  if (!profileId) return true;
  const meta = getProfileMeta(profileId);
  return !isMetaComplete(meta);
}
