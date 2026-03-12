const fs = require('fs');

// ── 1. lib/types.ts — bilateral mező hozzáadása ──────────────
let types = fs.readFileSync('D:/gym-webapp/gym-webapp/lib/types.ts', 'utf8');
types = types.replace(
  `export type WorkoutExercise = {
  id: string;
  exerciseId: string; // a library-ből
  name: string;
  category?: string;
  subcategory?: string;
  sets: WorkoutSet[];
  notes?: string;
  favorite?: boolean;
};`,
  `export type WorkoutExercise = {
  id: string;
  exerciseId: string; // a library-ből
  name: string;
  category?: string;
  subcategory?: string;
  sets: WorkoutSet[];
  notes?: string;
  favorite?: boolean;
  /** undefined = auto (group alapján), true = egykezes ×2, false = kétkezes ×1 */
  bilateral?: boolean;
};`
);
fs.writeFileSync('D:/gym-webapp/gym-webapp/lib/types.ts', types, 'utf8');
console.log('types.ts done');

// ── 2. lib/workoutHelpers.ts — bilateral auto-detect helper ──
let helpers = fs.readFileSync('D:/gym-webapp/gym-webapp/lib/workoutHelpers.ts', 'utf8');
const BILATERAL_HELPER = `
// Auto-detect: DB group → bilateral (×2), minden más → unilateral (×1)
export function isBilateralExercise(group?: string, bilateral?: boolean): boolean {
  if (bilateral !== undefined) return bilateral;
  if (!group) return false;
  return group.includes('(DB)');
}

// Volume számítás bilateral figyelembevételével
export function effectiveSetVolume(weight: number, reps: number, bilateral: boolean): number {
  return weight * reps * (bilateral ? 2 : 1);
}
`;
// Betoldás a fájl végére (de az utolsó export elé ha van)
helpers = helpers.trimEnd() + '\n' + BILATERAL_HELPER;
fs.writeFileSync('D:/gym-webapp/gym-webapp/lib/workoutHelpers.ts', helpers, 'utf8');
console.log('workoutHelpers.ts done');

// ── 3. lib/workoutMetrics.ts — bilateral-aware setVolume ──────
let metrics = fs.readFileSync('D:/gym-webapp/gym-webapp/lib/workoutMetrics.ts', 'utf8');
metrics = metrics.replace(
  `import type { Workout, WorkoutExercise, SetEntry } from "./types";

export function setVolume(s: SetEntry): number {
  if (s.weight == null || s.reps == null) return 0;
  return Math.max(0, s.weight) * Math.max(0, s.reps);
}

export function workoutVolume(w: Workout): number {
  return w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((a, s) => a + setVolume(s), 0), 0);
}`,
  `import type { Workout, WorkoutExercise, SetEntry } from "./types";
import { isBilateralExercise } from "./workoutHelpers";

export function setVolume(s: SetEntry): number {
  if (s.weight == null || s.reps == null) return 0;
  return Math.max(0, s.weight) * Math.max(0, s.reps);
}

/** Bilateral-aware volume: DB gyakorlatoknál ×2 */
export function setVolumeEx(s: SetEntry, ex: WorkoutExercise): number {
  if (s.weight == null || s.reps == null || !s.done) return 0;
  const bilateral = isBilateralExercise(ex.category, ex.bilateral);
  return Math.max(0, s.weight) * Math.max(0, s.reps) * (bilateral ? 2 : 1);
}

export function workoutVolume(w: Workout): number {
  return w.exercises.reduce((acc, ex) =>
    acc + ex.sets.reduce((a, s) => a + setVolumeEx(s, ex), 0), 0);
}`,
);
fs.writeFileSync('D:/gym-webapp/gym-webapp/lib/workoutMetrics.ts', metrics, 'utf8');
console.log('workoutMetrics.ts done');
