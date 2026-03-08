// lib/achievements.ts
import type { Workout } from "@/lib/types";
import type { WeightEntry } from "@/lib/weightStorage";

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export type Achievement = {
  id: string;
  icon: string;
  title: string;
  description: string;
  tier: AchievementTier;
  xp: number;
  // unlocked ha a feltétel teljesül
  check: (data: AchievementData) => boolean;
};

export type AchievementData = {
  workouts: Workout[];
  weightHistory: WeightEntry[];
  streak: number;
};

export type UnlockedAchievement = {
  id: string;
  unlockedAt: number;
};

// XP szintek
export const XP_LEVELS = [
  { level: 1, title: "Kezdő",      minXp: 0 },
  { level: 2, title: "Aktív",      minXp: 100 },
  { level: 3, title: "Haladó",     minXp: 300 },
  { level: 4, title: "Veterán",    minXp: 600 },
  { level: 5, title: "Elit",       minXp: 1000 },
  { level: 6, title: "Bajnok",     minXp: 1500 },
  { level: 7, title: "Legenda",    minXp: 2500 },
];

export const TIER_COLORS: Record<AchievementTier, { bg: string; text: string; border: string }> = {
  bronze:   { bg: "rgba(180,100,40,0.15)",  text: "#cd7f32", border: "rgba(180,100,40,0.3)" },
  silver:   { bg: "rgba(180,180,180,0.12)", text: "#c0c0c0", border: "rgba(180,180,180,0.3)" },
  gold:     { bg: "rgba(255,200,0,0.15)",   text: "#ffd700", border: "rgba(255,200,0,0.3)" },
  platinum: { bg: "rgba(34,211,238,0.15)",  text: "#22d3ee", border: "rgba(34,211,238,0.35)" },
};

export const ACHIEVEMENTS: Achievement[] = [
  // ── Első lépések ───────────────────────────────────────────
  {
    id: "first_workout",
    icon: "🎯", title: "Első edzés", tier: "bronze", xp: 50,
    description: "Teljesítetted az első edzésedet!",
    check: d => d.workouts.length >= 1,
  },
  {
    id: "first_weight",
    icon: "⚖️", title: "Mérleg hős", tier: "bronze", xp: 30,
    description: "Felvetted az első súlymérésed.",
    check: d => d.weightHistory.length >= 1,
  },

  // ── Edzésszám ──────────────────────────────────────────────
  {
    id: "workouts_10",
    icon: "💪", title: "10 edzés", tier: "bronze", xp: 100,
    description: "10 edzést teljesítettél.",
    check: d => d.workouts.length >= 10,
  },
  {
    id: "workouts_25",
    icon: "🔥", title: "25 edzés", tier: "silver", xp: 200,
    description: "25 edzést teljesítettél.",
    check: d => d.workouts.length >= 25,
  },
  {
    id: "workouts_50",
    icon: "⚡", title: "50 edzés", tier: "gold", xp: 400,
    description: "50 edzést teljesítettél.",
    check: d => d.workouts.length >= 50,
  },
  {
    id: "workouts_100",
    icon: "👑", title: "100 edzés", tier: "platinum", xp: 800,
    description: "100 edzést teljesítettél — legenda vagy!",
    check: d => d.workouts.length >= 100,
  },

  // ── Streak ─────────────────────────────────────────────────
  {
    id: "streak_3",
    icon: "🌱", title: "3 napos streak", tier: "bronze", xp: 75,
    description: "3 egymást követő napon edzettél.",
    check: d => d.streak >= 3,
  },
  {
    id: "streak_7",
    icon: "🔥", title: "Hetes streak", tier: "silver", xp: 150,
    description: "7 napon át nem hagytad ki.",
    check: d => d.streak >= 7,
  },
  {
    id: "streak_14",
    icon: "💎", title: "2 hetes streak", tier: "gold", xp: 300,
    description: "14 napos megszakítatlan edzés.",
    check: d => d.streak >= 14,
  },
  {
    id: "streak_30",
    icon: "🏆", title: "30 napos streak", tier: "platinum", xp: 700,
    description: "Egy teljes hónap — csodálatos!",
    check: d => d.streak >= 30,
  },

  // ── Volume ─────────────────────────────────────────────────
  {
    id: "volume_1k",
    icon: "🏋️", title: "1,000 kg", tier: "bronze", xp: 80,
    description: "1,000 kg összvolume teljesítve.",
    check: d => totalVolume(d.workouts) >= 1000,
  },
  {
    id: "volume_10k",
    icon: "💥", title: "10,000 kg", tier: "silver", xp: 200,
    description: "10,000 kg összvolume — erőmű vagy!",
    check: d => totalVolume(d.workouts) >= 10000,
  },
  {
    id: "volume_50k",
    icon: "🚀", title: "50,000 kg", tier: "gold", xp: 500,
    description: "50 tonna volume. Komolyan.",
    check: d => totalVolume(d.workouts) >= 50000,
  },
  {
    id: "volume_100k",
    icon: "🌟", title: "100,000 kg", tier: "platinum", xp: 1000,
    description: "100 tonna — te vagy a gép.",
    check: d => totalVolume(d.workouts) >= 100000,
  },
];

function totalVolume(workouts: Workout[]): number {
  return workouts.reduce((sum, w) =>
    sum + w.exercises.reduce((s, e) =>
      s + e.sets.filter(st => st.done).reduce((ss, st) =>
        ss + ((st.reps ?? 0) * (st.weight ?? 0)), 0), 0), 0);
}

export function calcXP(workouts: Workout[], unlocked: UnlockedAchievement[]): number {
  // Alap XP: edzésenként 10 pont
  const baseXP = workouts.length * 10;
  // Achievement XP
  const achievementXP = unlocked.reduce((sum, u) => {
    const a = ACHIEVEMENTS.find(x => x.id === u.id);
    return sum + (a?.xp ?? 0);
  }, 0);
  return baseXP + achievementXP;
}

export function getLevel(xp: number) {
  let current = XP_LEVELS[0];
  for (const lvl of XP_LEVELS) {
    if (xp >= lvl.minXp) current = lvl;
  }
  const nextIdx = XP_LEVELS.indexOf(current) + 1;
  const next = XP_LEVELS[nextIdx] ?? null;
  const progress = next
    ? (xp - current.minXp) / (next.minXp - current.minXp)
    : 1;
  return { ...current, next, progress, xp };
}

export function checkNewAchievements(
  data: AchievementData,
  alreadyUnlocked: UnlockedAchievement[]
): UnlockedAchievement[] {
  const ids = new Set(alreadyUnlocked.map(u => u.id));
  const newOnes: UnlockedAchievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!ids.has(a.id) && a.check(data)) {
      newOnes.push({ id: a.id, unlockedAt: Date.now() });
    }
  }
  return newOnes;
}
