// lib/weightStorage.ts
import { lsGet, lsSet } from "@/lib/storage";
import { profileKey } from "@/lib/profiles";

export type WeightEntry = {
  id: string;
  date: string;   // ISO date string "2025-03-08"
  weightKg: number;
  note?: string;
};

export function weightKey(profileId: string) {
  return profileKey(profileId, "weightHistory");
}

export function readWeightHistory(profileId: string): WeightEntry[] {
  return lsGet<WeightEntry[]>(weightKey(profileId), []);
}

export function addWeightEntry(profileId: string, weightKg: number, note?: string): WeightEntry {
  const entry: WeightEntry = {
    id: crypto.randomUUID(),
    date: new Date().toISOString().split("T")[0],
    weightKg,
    note,
  };
  const list = readWeightHistory(profileId);
  // Ha már van ma bejegyzés, frissítjük
  const todayIdx = list.findIndex(e => e.date === entry.date);
  if (todayIdx >= 0) list[todayIdx] = entry;
  else list.unshift(entry);
  lsSet(weightKey(profileId), list);
  return entry;
}

export function deleteWeightEntry(profileId: string, id: string) {
  const list = readWeightHistory(profileId).filter(e => e.id !== id);
  lsSet(weightKey(profileId), list);
}
