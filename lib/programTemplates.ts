// lib/programTemplates.ts
import type { ProgramTemplate, ProgramLevel, SportTag } from "@/lib/programsTypes";

export function sportLabel(s: SportTag): string {
  const map: Record<SportTag, string> = {
    gym: "Edzőterem", powerlifting: "Powerlifting", olympic: "Olimpiai emelés",
    bodybuilding: "Bodybuilding", crossfit: "CrossFit",
    home: "Otthon", calisthenics: "Saját testsúly",
    running: "Futás", cycling: "Kerékpár", swimming: "Úszás",
    rowing: "Evezés", jump_rope: "Ugrókötél", hiit: "HIIT",
    boxing: "Box", mma: "MMA", kickboxing: "Kickbox",
    muay_thai: "Muay Thai", bjj: "BJJ", wrestling: "Birkózás",
    judo: "Judo", karate: "Karate",
    mobility: "Mobilitás", yoga: "Yoga", stretching: "Nyújtás",
    foam_roll: "Foam Roll", pilates: "Pilates",
    warmup: "Bemelegítés",
    hybrid: "Hibrid", sport_specific: "Sportspecifikus",
  };
  return map[s] ?? s;
}

export function levelLabel(l: ProgramLevel) {
  if (l === "beginner") return "Kezdő";
  if (l === "intermediate") return "Középhaladó";
  return "Haladó";
}

export const SPORT_GROUPS: { label: string; emoji: string; tags: SportTag[] }[] = [
  { label: "Edzőterem", emoji: "🏋️", tags: ["gym","powerlifting","olympic","bodybuilding","crossfit"] },
  { label: "Küzdősport", emoji: "🥊", tags: ["boxing","mma","kickboxing","muay_thai","bjj","wrestling","judo","karate"] },
  { label: "Kardio / Sport", emoji: "🏃", tags: ["running","cycling","swimming","rowing","jump_rope","hiit"] },
  { label: "Testsúlyos", emoji: "💪", tags: ["home","calisthenics"] },
  { label: "Mobilitás", emoji: "🧘", tags: ["mobility","yoga","stretching","foam_roll","pilates"] },
  { label: "Bemelegítés", emoji: "🔥", tags: ["warmup"] },
  { label: "Egyéb", emoji: "⚡", tags: ["hybrid","sport_specific"] },
];

export const SPORT_EMOJI: Record<SportTag, string> = {
  gym:"🏋️", powerlifting:"🏋️", olympic:"🏅", bodybuilding:"💪", crossfit:"⚡",
  home:"🏠", calisthenics:"🤸",
  running:"🏃", cycling:"🚴", swimming:"🏊", rowing:"🚣", jump_rope:"🪢", hiit:"🔥",
  boxing:"🥊", mma:"🥋", kickboxing:"🥊", muay_thai:"🦵", bjj:"🥋",
  wrestling:"🤼", judo:"🥋", karate:"🥋",
  mobility:"🧘", yoga:"🧘", stretching:"🤸", foam_roll:"🟫", pilates:"🧘",
  warmup:"🔥",
  hybrid:"⚡", sport_specific:"🎯",
};

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  // ── GYM ────────────────────────────────────────────────────
  {
    id: "tpl_gym_fullbody_beginner_3x",
    title: "Full Body Alap",
    subtitle: "3x/hét • 4–6 hét",
    sport: "gym", level: "beginner",
    sessionsPerWeek: 3, durationWeeks: 6,
    tags: ["gym","full body","strength"],
    cover: { emoji: "🏋️", gradient: "emerald" },
    description: "Egyszerű, biztos alap. Minden alapgyakorlat, szimmetrikus terhelés.",
    sessions: [
      { id:"s_a", name:"Full Body A", blocks:[
        { kind:"exercise", name:"Squat / Leg Press", targetSets:3, targetReps:"6–10" },
        { kind:"exercise", name:"Bench Press", targetSets:3, targetReps:"6–10" },
        { kind:"exercise", name:"Row (Cable/DB)", targetSets:3, targetReps:"8–12" },
      ]},
      { id:"s_b", name:"Full Body B", blocks:[
        { kind:"exercise", name:"Deadlift / RDL", targetSets:3, targetReps:"6–10" },
        { kind:"exercise", name:"Overhead Press", targetSets:3, targetReps:"6–10" },
        { kind:"exercise", name:"Lat Pulldown / Pull-up", targetSets:3, targetReps:"8–12" },
      ]},
    ],
  },
  {
    id: "tpl_powerlifting_beginner",
    title: "Powerlifting Alap",
    subtitle: "3x/hét • 8 hét",
    sport: "powerlifting", level: "beginner",
    sessionsPerWeek: 3, durationWeeks: 8,
    tags: ["powerlifting","squat","bench","deadlift"],
    cover: { emoji: "🏋️", gradient: "slate" },
    description: "Squat, Bench, Deadlift alapok lineáris progresszióval.",
    sessions: [
      { id:"pl_a", name:"Squat + Press Nap", blocks:[
        { kind:"exercise", name:"Back Squat", targetSets:3, targetReps:"5" },
        { kind:"exercise", name:"Bench Press", targetSets:3, targetReps:"5" },
        { kind:"exercise", name:"Barbell Row", targetSets:3, targetReps:"5" },
      ]},
      { id:"pl_b", name:"Deadlift Nap", blocks:[
        { kind:"exercise", name:"Deadlift", targetSets:1, targetReps:"5" },
        { kind:"exercise", name:"Overhead Press", targetSets:3, targetReps:"5" },
        { kind:"exercise", name:"Power Clean", targetSets:5, targetReps:"3" },
      ]},
    ],
  },
  // ── BOXING / MMA ────────────────────────────────────────────
  {
    id: "tpl_boxing_beginner_3x",
    title: "Box Alapok",
    subtitle: "3x/hét • 4 hét",
    sport: "boxing", level: "beginner",
    sessionsPerWeek: 3, durationWeeks: 4,
    tags: ["boxing","technique","conditioning"],
    cover: { emoji: "🥊", gradient: "ember" },
    description: "Alap technika + kondi. Footwork, jab, kombinációk.",
    sessions: [
      { id:"b1", name:"Footwork + Jab", blocks:[
        { kind:"drill", name:"Footwork drill", durationSec:600 },
        { kind:"drill", name:"Jab kombók", durationSec:600 },
      ]},
      { id:"b2", name:"Defense + Combos", blocks:[
        { kind:"drill", name:"Slip / Roll", durationSec:600 },
        { kind:"interval", name:"3×3' zsák", rounds:3, workSec:180, restSec:60 },
      ]},
    ],
  },
  {
    id: "tpl_mma_conditioning",
    title: "MMA Kondicionálás",
    subtitle: "4x/hét • 6 hét",
    sport: "mma", level: "intermediate",
    sessionsPerWeek: 4, durationWeeks: 6,
    tags: ["mma","conditioning","strength","cardio"],
    cover: { emoji: "🥋", gradient: "ember" },
    description: "Erő + állóképesség MMA-hoz. Robbanékonyság, circuit training.",
    sessions: [
      { id:"mma1", name:"Erő + Robbanékonyság", blocks:[
        { kind:"exercise", name:"Deadlift", targetSets:4, targetReps:"3–5" },
        { kind:"exercise", name:"Box Jump", targetSets:4, targetReps:"5" },
        { kind:"exercise", name:"Pull-up", targetSets:3, targetReps:"max" },
      ]},
      { id:"mma2", name:"Circuit Kondi", blocks:[
        { kind:"interval", name:"Burpee → Sprawl → Stand", rounds:5, workSec:30, restSec:15 },
        { kind:"interval", name:"Kettlebell swing", rounds:4, workSec:40, restSec:20 },
      ]},
    ],
  },
  {
    id: "tpl_muay_thai_beginner",
    title: "Muay Thai Alap",
    subtitle: "3x/hét • 4 hét",
    sport: "muay_thai", level: "beginner",
    sessionsPerWeek: 3, durationWeeks: 4,
    tags: ["muay thai","kicks","clinch","technique"],
    cover: { emoji: "🦵", gradient: "rose" },
    description: "Egyenes ütés, rúgás, térd. Zsákon és padra.",
    sessions: [
      { id:"mt1", name:"Ütés Technika", blocks:[
        { kind:"drill", name:"Jab–Cross–Hook", durationSec:600 },
        { kind:"interval", name:"2×3' árnyékbox", rounds:2, workSec:180, restSec:60 },
      ]},
      { id:"mt2", name:"Rúgás Technika", blocks:[
        { kind:"drill", name:"Teep + Low kick", durationSec:600 },
        { kind:"interval", name:"3×2' zsák", rounds:3, workSec:120, restSec:60 },
      ]},
    ],
  },
  // ── RUNNING ─────────────────────────────────────────────────
  {
    id: "tpl_running_5k_base_4w",
    title: "5K Alap",
    subtitle: "3x/hét • 4 hét",
    sport: "running", level: "beginner",
    sessionsPerWeek: 3, durationWeeks: 4,
    tags: ["running","5k","base"],
    cover: { emoji: "🏃", gradient: "sky" },
    description: "Alap állóképesség 5K-hoz. Fuss/séta intervallok.",
    sessions: [
      { id:"r1", name:"Easy Run", blocks:[{ kind:"interval", name:"Kényelmes futás", workSec:1200 }] },
      { id:"r2", name:"Intervallok", blocks:[{ kind:"interval", name:"6× (2' futás / 2' séta)", rounds:6, workSec:120, restSec:120 }] },
      { id:"r3", name:"Long Easy", blocks:[{ kind:"interval", name:"Z2 futás", workSec:1800 }] },
    ],
  },
  {
    id: "tpl_running_10k",
    title: "10K Felkészítő",
    subtitle: "4x/hét • 8 hét",
    sport: "running", level: "intermediate",
    sessionsPerWeek: 4, durationWeeks: 8,
    tags: ["running","10k","tempo"],
    cover: { emoji: "🏃", gradient: "sky" },
    description: "Tempo futás, hosszú kifutás, intervallok. 10K alá.",
    sessions: [
      { id:"rk1", name:"Tempo Run", blocks:[{ kind:"interval", name:"25' tempo", workSec:1500 }] },
      { id:"rk2", name:"Intervallok", blocks:[{ kind:"interval", name:"8×400m", rounds:8, workSec:90, restSec:90 }] },
      { id:"rk3", name:"Hosszú futás", blocks:[{ kind:"interval", name:"60' easy", workSec:3600 }] },
    ],
  },
  // ── MOBILITÁS / NYÚJTÁS ─────────────────────────────────────
  {
    id: "tpl_mobility_daily",
    title: "Napi Mobilitás",
    subtitle: "5x/hét • folyamatos",
    sport: "mobility", level: "beginner",
    sessionsPerWeek: 5, durationWeeks: 4,
    tags: ["mobility","flexibility","daily"],
    cover: { emoji: "🧘", gradient: "violet" },
    description: "10–15 perces reggeli mobilitás rutin. Csípő, váll, gerinc.",
    sessions: [
      { id:"mob1", name:"Reggeli Mobilitás", blocks:[
        { kind:"drill", name:"Hip 90/90 nyújtás", durationSec:120 },
        { kind:"drill", name:"Thoracic rotation", durationSec:90 },
        { kind:"drill", name:"Váll církák + band pull-apart", durationSec:90 },
        { kind:"drill", name:"Cat-Cow + Child's pose", durationSec:120 },
      ]},
    ],
  },
  {
    id: "tpl_stretching_post",
    title: "Edzés Utáni Nyújtás",
    subtitle: "minden edzés után",
    sport: "stretching", level: "beginner",
    sessionsPerWeek: 5, durationWeeks: 4,
    tags: ["stretching","cooldown","recovery"],
    cover: { emoji: "🤸", gradient: "violet" },
    description: "10 perces levezetés és statikus nyújtás minden edzés után.",
    sessions: [
      { id:"str1", name:"Teljes Test Nyújtás", blocks:[
        { kind:"drill", name:"Quad stretch (2×45s)", durationSec:90 },
        { kind:"drill", name:"Hamstring stretch (2×45s)", durationSec:90 },
        { kind:"drill", name:"Csípőhajlító (2×45s)", durationSec:90 },
        { kind:"drill", name:"Váll + mell nyújtás", durationSec:60 },
        { kind:"drill", name:"Gerinc csavarás", durationSec:60 },
      ]},
    ],
  },
  {
    id: "tpl_yoga_beginner",
    title: "Kezdő Yoga",
    subtitle: "3x/hét • 4 hét",
    sport: "yoga", level: "beginner",
    sessionsPerWeek: 3, durationWeeks: 4,
    tags: ["yoga","flexibility","mindfulness"],
    cover: { emoji: "🧘", gradient: "violet" },
    description: "Alap ászanák, légzéstechnika, lazítás.",
    sessions: [
      { id:"yog1", name:"Reggeli Flow", blocks:[
        { kind:"drill", name:"Sun Salutation A × 3", durationSec:300 },
        { kind:"drill", name:"Warrior I–II–III", durationSec:300 },
        { kind:"drill", name:"Savasana", durationSec:180 },
      ]},
    ],
  },
  {
    id: "tpl_foam_roll",
    title: "Foam Roll Regeneráció",
    subtitle: "napi rutin • 10 perc",
    sport: "foam_roll", level: "beginner",
    sessionsPerWeek: 7, durationWeeks: 4,
    tags: ["foam roll","recovery","myofascial"],
    cover: { emoji: "🟫", gradient: "slate" },
    description: "Napi myofasciális lazítás. IT-szalag, vádli, thoracic spine.",
    sessions: [
      { id:"fr1", name:"Teljes Test FR", blocks:[
        { kind:"drill", name:"IT-szalag (2×60s)", durationSec:120 },
        { kind:"drill", name:"Vádli (2×60s)", durationSec:120 },
        { kind:"drill", name:"Háti gerinc", durationSec:90 },
        { kind:"drill", name:"Lat + váll", durationSec:90 },
      ]},
    ],
  },
  // ── BEMELEGÍTÉS ─────────────────────────────────────────────
  {
    id: "tpl_warmup_general",
    title: "Általános Bemelegítés",
    subtitle: "minden edzés előtt • 8 perc",
    sport: "warmup", level: "beginner",
    sessionsPerWeek: 5, durationWeeks: 4,
    tags: ["warmup","activation","mobility"],
    cover: { emoji: "🔥", gradient: "amber" },
    description: "Dinamikus bemelegítés edzés előtt. Keringés, aktiváció, mozgékonyság.",
    sessions: [
      { id:"wu1", name:"Dinamikus Bemelegítés", blocks:[
        { kind:"drill", name:"Light jog / helyi futás", durationSec:120 },
        { kind:"drill", name:"Leg swings (előre-hátra + oldalra)", durationSec:60 },
        { kind:"drill", name:"Hip circles + Lunge with twist", durationSec:90 },
        { kind:"drill", name:"Band pull-apart + face pull", durationSec:60 },
        { kind:"drill", name:"Inchworm + shoulder tap", durationSec:90 },
      ]},
    ],
  },
  {
    id: "tpl_warmup_lifting",
    title: "Emelés Előtti Aktiváció",
    subtitle: "erőedzés előtt • 10 perc",
    sport: "warmup", level: "beginner",
    sessionsPerWeek: 3, durationWeeks: 4,
    tags: ["warmup","activation","glutes","shoulders"],
    cover: { emoji: "🔥", gradient: "amber" },
    description: "Gluteus, vállöv és csípő aktiváció nehéz emelés előtt.",
    sessions: [
      { id:"wul1", name:"Emelés Aktiváció", blocks:[
        { kind:"exercise", name:"Glute bridge 2×15", targetSets:2, targetReps:"15" },
        { kind:"exercise", name:"Clamshell 2×15/oldal", targetSets:2, targetReps:"15" },
        { kind:"drill", name:"Band walk (oldalra)", durationSec:60 },
        { kind:"exercise", name:"Face pull 3×15", targetSets:3, targetReps:"15" },
        { kind:"exercise", name:"Cat-cow + Bird-dog", targetSets:2, targetReps:"10" },
      ]},
    ],
  },
  // ── HIIT / KARDIO ───────────────────────────────────────────
  {
    id: "tpl_hiit_beginner",
    title: "HIIT Alap",
    subtitle: "3x/hét • 4 hét",
    sport: "hiit", level: "beginner",
    sessionsPerWeek: 3, durationWeeks: 4,
    tags: ["hiit","cardio","fat burn"],
    cover: { emoji: "🔥", gradient: "rose" },
    description: "20 perces magas intenzitású edzés. Zsírégető, kondicionáló.",
    sessions: [
      { id:"hi1", name:"HIIT Circuit", blocks:[
        { kind:"interval", name:"Jumping jack", rounds:4, workSec:40, restSec:20 },
        { kind:"interval", name:"Burpee", rounds:4, workSec:30, restSec:30 },
        { kind:"interval", name:"Mountain climber", rounds:4, workSec:40, restSec:20 },
        { kind:"interval", name:"Jump squat", rounds:4, workSec:30, restSec:30 },
      ]},
    ],
  },
  // ── CROSSFIT / CALISTHENICS ─────────────────────────────────
  {
    id: "tpl_calisthenics_beginner",
    title: "Calisthenics Alap",
    subtitle: "4x/hét • 8 hét",
    sport: "calisthenics", level: "beginner",
    sessionsPerWeek: 4, durationWeeks: 8,
    tags: ["calisthenics","bodyweight","pull-up","dip"],
    cover: { emoji: "🤸", gradient: "indigo" },
    description: "Húzódzkodás, tolódzkodás, fekvőtámasz progresszió.",
    sessions: [
      { id:"cal1", name:"Húzó + Toló", blocks:[
        { kind:"exercise", name:"Pull-up / Negatives", targetSets:3, targetReps:"max" },
        { kind:"exercise", name:"Dip / Bench Dip", targetSets:3, targetReps:"8–12" },
        { kind:"exercise", name:"Push-up variáció", targetSets:3, targetReps:"10–20" },
      ]},
      { id:"cal2", name:"Core + Lábak", blocks:[
        { kind:"exercise", name:"Pistol squat progresszió", targetSets:3, targetReps:"5/oldal" },
        { kind:"exercise", name:"L-sit hold", targetSets:4, targetReps:"max idő" },
        { kind:"exercise", name:"Hanging leg raise", targetSets:3, targetReps:"10–15" },
      ]},
    ],
  },
  // ── BJJ / GRAPPLING ─────────────────────────────────────────
  {
    id: "tpl_bjj_strength_conditioning",
    title: "BJJ Erő + Kondi",
    subtitle: "3x/hét • 6 hét",
    sport: "bjj", level: "intermediate",
    sessionsPerWeek: 3, durationWeeks: 6,
    tags: ["bjj","grappling","grip","core","conditioning"],
    cover: { emoji: "🥋", gradient: "indigo" },
    description: "Grip erő, csípő erő, állóképesség grappling sportokhoz.",
    sessions: [
      { id:"bjj1", name:"Erő Nap", blocks:[
        { kind:"exercise", name:"Deadlift", targetSets:4, targetReps:"4–6" },
        { kind:"exercise", name:"Grip holds / towel pull-up", targetSets:3, targetReps:"max" },
        { kind:"exercise", name:"Hip escape drill", targetSets:3, targetReps:"10/oldal" },
      ]},
      { id:"bjj2", name:"Kondi Nap", blocks:[
        { kind:"interval", name:"Sprawl drill", rounds:5, workSec:30, restSec:30 },
        { kind:"interval", name:"Kettlebell swing", rounds:4, workSec:40, restSec:20 },
        { kind:"exercise", name:"Turkish get-up", targetSets:3, targetReps:"3/oldal" },
      ]},
    ],
  },
];
