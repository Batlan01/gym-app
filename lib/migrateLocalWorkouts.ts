"use client";

import type { Workout } from "@/lib/types";
import { LS_PROFILES, GUEST_PROFILE_ID, profileKey } from "@/lib/profiles";
import { batchUploadWorkouts } from "@/lib/workoutsCloud";

type ProfileRow = { id: string; name: string; createdAt: string };

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function lsSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function dedupeWorkouts(items: Workout[]) {
  const map = new Map<string, Workout>();
  for (const w of items) {
    if (!w?.id) continue;
    const prev = map.get(w.id);
    if (!prev) map.set(w.id, w);
    else {
      const a = new Date(prev.startedAt).getTime();
      const b = new Date(w.startedAt).getTime();
      if (b >= a) map.set(w.id, w);
    }
  }
  return Array.from(map.values());
}

export function getLocalWorkoutsStats() {
  const profiles = lsGet<ProfileRow[]>(LS_PROFILES, []);
  const ids = new Set<string>([GUEST_PROFILE_ID, ...profiles.map((p) => p.id)]);
  const localIds = Array.from(ids).filter((id) => !id.startsWith("fb:"));

  const perProfileCounts: Record<string, number> = {};
  let total = 0;

  for (const pid of localIds) {
    const key = profileKey(pid, "workouts");
    const items = lsGet<Workout[]>(key, []);
    perProfileCounts[pid] = items.length;
    total += items.length;
  }

  return { total, perProfileCounts, localIds };
}

/**
 * Összes lokális profil edzését feltolja Cloud-ba.
 * Biztonság: BACKUP kulcsba mentjük a lokál workouthistory-t.
 */
export async function migrateAllLocalWorkoutsToCloud(uid: string, opts?: { clearLocal?: boolean }) {
  const clearLocal = opts?.clearLocal ?? false;

  const profiles = lsGet<ProfileRow[]>(LS_PROFILES, []);
  const ids = new Set<string>([GUEST_PROFILE_ID, ...profiles.map((p) => p.id)]);
  const localIds = Array.from(ids).filter((id) => !id.startsWith("fb:"));

  const all: Workout[] = [];
  const perProfileCounts: Record<string, number> = {};

  for (const pid of localIds) {
    const key = profileKey(pid, "workouts");
    const items = lsGet<Workout[]>(key, []);
    perProfileCounts[pid] = items.length;

    for (const w of items) {
      if (!w?.id) continue;
      all.push(w);
    }
  }

  const unique = dedupeWorkouts(all);

  // Feltöltés (cloud)
  if (unique.length > 0) {
    await batchUploadWorkouts(uid, unique);
  }

  // backup + opcionális lokál törlés
  for (const pid of localIds) {
    const key = profileKey(pid, "workouts");
    const backupKey = profileKey(pid, "workouts_backup");
    const items = lsGet<Workout[]>(key, []);

    if (items.length > 0) {
      lsSet(backupKey, items);
      if (clearLocal) lsSet(key, []);
    }
  }

  return {
    uploaded: unique.length,
    perProfileCounts,
    clearLocal,
  };
}

/**
 * Csak 1 lokál profil edzéseit tölti fel.
 */
export async function migrateOneLocalProfileToCloud(uid: string, localProfileId: string, opts?: { clearLocal?: boolean }) {
  const clearLocal = opts?.clearLocal ?? false;

  if (!localProfileId || localProfileId.startsWith("fb:")) {
    return { uploaded: 0, clearLocal, profileId: localProfileId };
  }

  const key = profileKey(localProfileId, "workouts");
  const items = lsGet<Workout[]>(key, []);
  const unique = dedupeWorkouts(items);

  if (unique.length > 0) {
    await batchUploadWorkouts(uid, unique);
  }

  const backupKey = profileKey(localProfileId, "workouts_backup");
  if (items.length > 0) {
    lsSet(backupKey, items);
    if (clearLocal) lsSet(key, []);
  }

  return { uploaded: unique.length, clearLocal, profileId: localProfileId };
}
