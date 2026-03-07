"use client";

import type { Workout } from "@/lib/types";
import { lsGet, lsSet } from "@/lib/storage";
import { LS_PROFILES, GUEST_PROFILE_ID, profileKey } from "@/lib/profiles";
import { batchUploadWorkouts } from "@/lib/workoutsCloud";

/**
 * Összes lokális profil edzését összeszedi és feltolja a Cloud-ba.
 * Biztonságból: BACKUP kulcsba mentjük a lokál workouthistory-t.
 */
export async function migrateAllLocalWorkoutsToCloud(uid: string, opts?: { clearLocal?: boolean }) {
  const clearLocal = opts?.clearLocal ?? false;

  // Lokális profil lista (Guest is lehet, plusz a user által létrehozottak)
  const profiles = lsGet<{ id: string; name: string; createdAt: string }[]>(LS_PROFILES, []);
  const ids = new Set<string>([GUEST_PROFILE_ID, ...profiles.map((p) => p.id)]);

  // Cloud profilok (fb:...) kihagyása – azok nem "lokál user" profilok
  const localIds = Array.from(ids).filter((id) => !id.startsWith("fb:"));

  // Összes workout összegyűjtése
  const all: Workout[] = [];
  const perProfileCounts: Record<string, number> = {};

  for (const pid of localIds) {
    const key = profileKey(pid, "workouts");
    const items = lsGet<Workout[]>(key, []);
    perProfileCounts[pid] = items.length;

    for (const w of items) {
      // basic sanity: legyen id
      if (!w?.id) continue;
      all.push(w);
    }
  }

  // dedupe workout.id alapján
  const map = new Map<string, Workout>();
  for (const w of all) {
    const prev = map.get(w.id);
    if (!prev) map.set(w.id, w);
    else {
      // ha duplikáció van, tartsuk meg a "későbbi" startedAt-et
      const a = new Date(prev.startedAt).getTime();
      const b = new Date(w.startedAt).getTime();
      if (b >= a) map.set(w.id, w);
    }
  }

  const unique = Array.from(map.values());

  // feltöltés
  if (unique.length > 0) {
    await batchUploadWorkouts(uid, unique);
  }

  // lokál backup + opcionális törlés
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
 * Csak az aktuális lokál profil edzéseit tölti fel.
 * (Ha ezt akarod a UI-n, egyszerűbb és “biztonságosabb”.)
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
