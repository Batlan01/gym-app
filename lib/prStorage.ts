// lib/prStorage.ts
// Personal Record tracking - minden gyakorlathoz tároljuk a legjobb setet
import type { Workout } from "./types";
import { lsGet, lsSet } from "./storage";

export type PREntry = {
  exerciseId: string;
  name: string;
  bestWeight: number;
  bestWeightReps: number;
  bestVolume: number;
  bestVolumeWeight: number;
  bestVolumeReps: number;
  achievedAt: string;
  totalSets: number;
  totalVolume: number;
};

export type PRMap = Record<string, PREntry>;

export type ExerciseHistoryPoint = {
  date: string;      // "YYYY-MM-DD"
  bestWeight: number;
  bestReps: number;
  bestVolume: number;
  sets: number;
};

function prKey(profileId: string) { return `arcx:${profileId}:prs`; }

export function readPRs(profileId: string): PRMap {
  return lsGet<PRMap>(prKey(profileId), {});
}

/** Egy adott gyakorlat idősorát állítja össze (legjobb súly per nap) */
export function buildExerciseHistory(
  workouts: Workout[],
  exerciseKey: string // exerciseId || name
): ExerciseHistoryPoint[] {
  const byDay = new Map<string, ExerciseHistoryPoint>();

  // chronological order
  const sorted = [...workouts].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  for (const w of sorted) {
    for (const ex of w.exercises) {
      const key = ex.exerciseId || ex.name;
      if (key !== exerciseKey) continue;

      const doneSets = ex.sets.filter(
        s => s.done && s.weight != null && s.reps != null && s.weight > 0 && s.reps > 0
      );
      if (!doneSets.length) continue;

      const day = new Date(w.startedAt).toISOString().slice(0, 10);
      const existing = byDay.get(day);

      let bestW = existing?.bestWeight ?? 0;
      let bestR = existing?.bestReps ?? 0;
      let bestVol = existing?.bestVolume ?? 0;
      let sets = existing?.sets ?? 0;

      for (const s of doneSets) {
        const vol = s.weight! * s.reps!;
        sets += 1;
        if (s.weight! > bestW || (s.weight! === bestW && s.reps! > bestR)) {
          bestW = s.weight!; bestR = s.reps!;
        }
        if (vol > bestVol) bestVol = vol;
      }

      byDay.set(day, { date: day, bestWeight: bestW, bestReps: bestR, bestVolume: bestVol, sets });
    }
  }

  return Array.from(byDay.values());
}

/** Újraszámolja az összes PR-t */
export function rebuildPRs(profileId: string, workouts: Workout[]): PRMap {
  const map: PRMap = {};

  for (const w of workouts) {
    for (const ex of w.exercises) {
      const key = ex.exerciseId || ex.name;
      const doneSets = ex.sets.filter(
        s => s.done && s.weight != null && s.reps != null && s.weight > 0 && s.reps > 0
      );
      if (!doneSets.length) continue;

      let entry: PREntry = map[key] ?? {
        exerciseId: key, name: ex.name,
        bestWeight: 0, bestWeightReps: 0,
        bestVolume: 0, bestVolumeWeight: 0, bestVolumeReps: 0,
        achievedAt: w.startedAt, totalSets: 0, totalVolume: 0,
      };

      for (const s of doneSets) {
        const w_ = s.weight!, r_ = s.reps!, vol = w_ * r_;
        entry.totalSets += 1;
        entry.totalVolume += vol;
        if (w_ > entry.bestWeight || (w_ === entry.bestWeight && r_ > entry.bestWeightReps)) {
          entry.bestWeight = w_; entry.bestWeightReps = r_; entry.achievedAt = w.startedAt;
        }
        if (vol > entry.bestVolume) {
          entry.bestVolume = vol; entry.bestVolumeWeight = w_; entry.bestVolumeReps = r_;
        }
      }
      map[key] = entry;
    }
  }

  lsSet(prKey(profileId), map);
  return map;
}

/** Csak az új edzés PR-jeit ellenőrzi */
export function updatePRsFromWorkout(profileId: string, workout: Workout): { newPRs: string[] } {
  const map = readPRs(profileId);
  const newPRs: string[] = [];

  for (const ex of workout.exercises) {
    const key = ex.exerciseId || ex.name;
    const doneSets = ex.sets.filter(
      s => s.done && s.weight != null && s.reps != null && s.weight > 0 && s.reps > 0
    );
    if (!doneSets.length) continue;

    let isNew = !map[key];
    let entry: PREntry = map[key] ?? {
      exerciseId: key, name: ex.name,
      bestWeight: 0, bestWeightReps: 0,
      bestVolume: 0, bestVolumeWeight: 0, bestVolumeReps: 0,
      achievedAt: workout.startedAt, totalSets: 0, totalVolume: 0,
    };

    for (const s of doneSets) {
      const w_ = s.weight!, r_ = s.reps!, vol = w_ * r_;
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
