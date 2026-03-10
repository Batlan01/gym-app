// lib/prStorage.ts
// Personal Record tracking - minden gyakorlathoz tároljuk a legjobb setet
import type { Workout, WorkoutSet } from "./types";
import { lsGet, lsSet } from "./storage";

export type PREntry = {
  exerciseId: string;   // exerciseId || name
  name: string;
  bestWeight: number;   // legmagasabb súly (bármennyi rep)
  bestWeightReps: number;
  bestVolume: number;   // legjobb 1 szet volume (weight × reps)
  bestVolumeWeight: number;
  bestVolumeReps: number;
  achievedAt: string;   // ISO, mikor lett ez a PR
  totalSets: number;
  totalVolume: number;
};

export type PRMap = Record<string, PREntry>; // key = exerciseId || name

function prKey(profileId: string) {
  return `arcx:${profileId}:prs`;
}

export function readPRs(profileId: string): PRMap {
  return lsGet<PRMap>(prKey(profileId), {});
}

/** Újraszámolja az összes PR-t az edzéstörténetből */
export function rebuildPRs(profileId: string, workouts: Workout[]): PRMap {
  const map: PRMap = {};

  for (const w of workouts) {
    for (const ex of w.exercises) {
      const key = ex.exerciseId || ex.name;
      const doneSets = ex.sets.filter(s => s.done && s.weight != null && s.reps != null && s.weight > 0 && s.reps > 0);
      if (!doneSets.length) continue;

      const cur = map[key];
      let entry: PREntry = cur ?? {
        exerciseId: key,
        name: ex.name,
        bestWeight: 0,
        bestWeightReps: 0,
        bestVolume: 0,
        bestVolumeWeight: 0,
        bestVolumeReps: 0,
        achievedAt: w.startedAt,
        totalSets: 0,
        totalVolume: 0,
      };

      for (const s of doneSets) {
        const w_ = s.weight!;
        const r_ = s.reps!;
        const vol = w_ * r_;

        entry.totalSets += 1;
        entry.totalVolume += vol;

        if (w_ > entry.bestWeight || (w_ === entry.bestWeight && r_ > entry.bestWeightReps)) {
          entry.bestWeight = w_;
          entry.bestWeightReps = r_;
          entry.achievedAt = w.startedAt;
        }
        if (vol > entry.bestVolume) {
          entry.bestVolume = vol;
          entry.bestVolumeWeight = w_;
          entry.bestVolumeReps = r_;
        }
      }

      map[key] = entry;
    }
  }

  lsSet(prKey(profileId), map);
  return map;
}

/** Csak az új edzés PR-jeit ellenőrzi (hatékonyabb mint rebuild) */
export function updatePRsFromWorkout(profileId: string, workout: Workout): { newPRs: string[] } {
  const map = readPRs(profileId);
  const newPRs: string[] = [];

  for (const ex of workout.exercises) {
    const key = ex.exerciseId || ex.name;
    const doneSets = ex.sets.filter(s => s.done && s.weight != null && s.reps != null && s.weight > 0 && s.reps > 0);
    if (!doneSets.length) continue;

    const cur = map[key];
    let isNew = !cur;
    let entry: PREntry = cur ?? {
      exerciseId: key,
      name: ex.name,
      bestWeight: 0, bestWeightReps: 0,
      bestVolume: 0, bestVolumeWeight: 0, bestVolumeReps: 0,
      achievedAt: workout.startedAt,
      totalSets: 0, totalVolume: 0,
    };

    for (const s of doneSets) {
      const w_ = s.weight!; const r_ = s.reps!; const vol = w_ * r_;
      entry.totalSets += 1;
      entry.totalVolume += vol;
      if (w_ > entry.bestWeight) { entry.bestWeight = w_; entry.bestWeightReps = r_; isNew = true; }
      if (vol > entry.bestVolume) { entry.bestVolume = vol; entry.bestVolumeWeight = w_; entry.bestVolumeReps = r_; isNew = true; }
    }

    if (isNew) { entry.achievedAt = workout.startedAt; newPRs.push(ex.name); }
    map[key] = entry;
  }

  lsSet(prKey(profileId), map);
  return { newPRs };
}
