import type { Workout, WorkoutExercise, SetEntry } from "./types";

export function setVolume(s: SetEntry): number {
  if (s.weight == null || s.reps == null) return 0;
  return Math.max(0, s.weight) * Math.max(0, s.reps);
}

export function workoutVolume(w: Workout): number {
  return w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((a, s) => a + setVolume(s), 0), 0);
}

export function workoutSetCounts(w: Workout): { total: number; done: number } {
  let total = 0;
  let done = 0;
  for (const ex of w.exercises) {
    for (const s of ex.sets) {
      // history-ban már normalizált lesz, de így biztos
      if (s.weight == null || s.reps == null) continue;
      total += 1;
      if (s.done) done += 1;
    }
  }
  return { total, done };
}


export function workoutExerciseCount(w: Workout): number {
  return w.exercises.length;
}

export function formatDT(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysAgo(n: number): Date {
  const d = new Date();
  const s = startOfDay(d);
  s.setDate(s.getDate() - n);
  return s;
}

export function withinLastDays(w: Workout, days: number): boolean {
  const from = daysAgo(days);
  return new Date(w.startedAt) >= from;
}

export function topExercisesByVolume(history: Workout[], topN = 5): Array<{ name: string; volume: number }> {
  const map = new Map<string, { name: string; volume: number }>();

  for (const w of history) {
    for (const ex of w.exercises) {
      const vol = ex.sets.reduce((a, s) => a + setVolume(s), 0);
      const key = ex.exerciseId || ex.name;
      const cur = map.get(key);
      if (!cur) map.set(key, { name: ex.name, volume: vol });
      else cur.volume += vol;
    }
  }

  return [...map.values()].sort((a, b) => b.volume - a.volume).slice(0, topN);
}

export function formatK(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return `${Math.round(num)}`;
}
