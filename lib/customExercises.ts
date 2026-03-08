// lib/customExercises.ts
// Felhasználó által létrehozott saját gyakorlatok

import type { ExerciseDef } from "./exercises";

export type CustomExercise = ExerciseDef & {
  custom: true;
  description?: string;
  createdAt: number;
};

function lsKey(profileId: string) {
  return `gym.${profileId}.customExercises`;
}

export function readCustomExercises(profileId: string): CustomExercise[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(lsKey(profileId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomExercise(profileId: string, ex: CustomExercise): void {
  const list = readCustomExercises(profileId);
  const idx = list.findIndex((e) => e.id === ex.id);
  if (idx >= 0) list[idx] = ex;
  else list.unshift(ex);
  localStorage.setItem(lsKey(profileId), JSON.stringify(list));
}

export function deleteCustomExercise(profileId: string, exerciseId: string): void {
  const list = readCustomExercises(profileId).filter((e) => e.id !== exerciseId);
  localStorage.setItem(lsKey(profileId), JSON.stringify(list));
}

export function makeCustomExercise(name: string, description?: string): CustomExercise {
  return {
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    group: "Custom",
    custom: true,
    description: description?.trim(),
    createdAt: Date.now(),
  };
}
