import type { SetEntry, Workout, WorkoutExercise } from "./types";
import { uid } from "./storage";


export function newWorkout(): Workout {
  return {
    id: uid(),
    startedAt: new Date().toISOString(),
    exercises: [],
  };
}

export function newSet(): SetEntry {
  return { id: uid(), weight: null, reps: null, done: false };
}

export function newExercise(exerciseId: string, name: string, templateSets?: SetEntry[]): WorkoutExercise {
  return {
    id: uid(),
    exerciseId,
    name,
    sets: templateSets?.length ? templateSets.map(s => ({ ...s, id: uid(), done: false })) : [newSet(), newSet(), newSet()],
  };
}

export function formatLastSummary(sets: SetEntry[]): string {
  const cleaned = sets
    .filter(s => s.weight != null && s.reps != null)
    .map(s => `${s.weight}×${s.reps}`);
  if (!cleaned.length) return "—";
  return cleaned.slice(0, 3).join(", ") + (cleaned.length > 3 ? "…" : "");
}

export function isSameDayISO(aISO: string, bISO: string): boolean {
  const a = new Date(aISO);
  const b = new Date(bISO);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isSetFilled(s: SetEntry): boolean {
  return s.weight != null && s.reps != null;
}

export function normalizeWorkoutForSave(w: Workout): Workout {
  const exercises: WorkoutExercise[] = w.exercises
    .map((ex) => {
      const sets = ex.sets
        .filter(isSetFilled)
        .map((s) => ({ ...s, done: !!s.done })); // done csak a megmaradó seteknél
      return { ...ex, sets };
    })
    .filter((ex) => ex.sets.length > 0);

  return { ...w, exercises };
}

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
