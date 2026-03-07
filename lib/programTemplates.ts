// lib/programTemplates.ts
import type { ProgramTemplate, ProgramLevel, SportTag } from "@/lib/programsTypes";

export function sportLabel(s: SportTag) {
  if (s === "gym") return "Edzőterem";
  if (s === "home") return "Otthon";
  if (s === "running") return "Futás";
  if (s === "boxing") return "Box";
  if (s === "mobility") return "Mobilitás";
  return "Hibrid";
}

export function levelLabel(l: ProgramLevel) {
  if (l === "beginner") return "Kezdő";
  if (l === "intermediate") return "Középhaladó";
  return "Haladó";
}

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: "tpl_gym_fullbody_beginner_3x",
    title: "Gym • Full Body (Beginner)",
    subtitle: "3x/hét • 4–6 hét",
    sport: "gym",
    level: "beginner",
    sessionsPerWeek: 3,
    durationWeeks: 6,
    tags: ["gym", "full body", "strength"],
    cover: { emoji: "🏋️", gradient: "emerald" },
    description: "Egyszerű, biztos alap. Később személyre szabod.",
    sessions: [
      {
        id: "s_a",
        name: "Full Body A",
        blocks: [
          { kind: "exercise", name: "Squat / Leg Press", targetSets: 3, targetReps: "6–10" },
          { kind: "exercise", name: "Bench Press", targetSets: 3, targetReps: "6–10" },
          { kind: "exercise", name: "Row (Cable/DB)", targetSets: 3, targetReps: "8–12" },
        ],
      },
      {
        id: "s_b",
        name: "Full Body B",
        blocks: [
          { kind: "exercise", name: "Deadlift (Light) / RDL", targetSets: 3, targetReps: "6–10" },
          { kind: "exercise", name: "Overhead Press", targetSets: 3, targetReps: "6–10" },
          { kind: "exercise", name: "Lat Pulldown / Pull-up", targetSets: 3, targetReps: "8–12" },
        ],
      },
    ],
  },
  {
    id: "tpl_running_5k_base_4w",
    title: "Running • 5K Base",
    subtitle: "3x/hét • 4 hét",
    sport: "running",
    level: "beginner",
    sessionsPerWeek: 3,
    durationWeeks: 4,
    tags: ["running", "5k", "base"],
    cover: { emoji: "🏃", gradient: "sky" },
    description: "Alap állóképesség építés 5K-hoz.",
    sessions: [
      { id: "r1", name: "Easy Run", blocks: [{ kind: "interval", name: "Easy jog", workSec: 20 * 60 }] },
      { id: "r2", name: "Intervals", blocks: [{ kind: "interval", name: "6× (2’ futás / 2’ séta)", rounds: 6, workSec: 120, restSec: 120 }] },
      { id: "r3", name: "Long Easy", blocks: [{ kind: "interval", name: "Z2 futás", workSec: 30 * 60 }] },
    ],
  },
  {
    id: "tpl_boxing_beginner_3x",
    title: "Box • Beginner",
    subtitle: "3x/hét • 4 hét",
    sport: "boxing",
    level: "beginner",
    sessionsPerWeek: 3,
    durationWeeks: 4,
    tags: ["boxing", "technique", "conditioning"],
    cover: { emoji: "🥊", gradient: "ember" },
    description: "Alap technika + kondi blokkos felépítésben.",
    sessions: [
      { id: "b1", name: "Footwork + Jab", blocks: [{ kind: "drill", name: "Footwork drill", durationSec: 10 * 60 }, { kind: "drill", name: "Jab combos", durationSec: 10 * 60 }] },
      { id: "b2", name: "Defense + Combos", blocks: [{ kind: "drill", name: "Slip/roll", durationSec: 10 * 60 }, { kind: "interval", name: "3×3’ bag rounds", rounds: 3, workSec: 180, restSec: 60 }] },
    ],
  },
];
