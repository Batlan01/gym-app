const fs = require('fs');

// ── 1. lib/types.ts — setType mező WorkoutSet-hez ─────────────
let types = fs.readFileSync('D:/gym-webapp/gym-webapp/lib/types.ts', 'utf8');
if (!types.includes('setType')) {
  types = types.replace(
    'export type WorkoutSet = {\n  id: string;\n  reps?: number | null;\n  weight?: number | null;\n  rpe?: number | null;\n  notes?: string;\n  done?: boolean;\n};',
    `export type SetType = "normal" | "warmup" | "superset" | "dropset" | "failure";

export type WorkoutSet = {
  id: string;
  reps?: number | null;
  weight?: number | null;
  rpe?: number | null;
  notes?: string;
  done?: boolean;
  setType?: SetType;
};`
  );
  fs.writeFileSync('D:/gym-webapp/gym-webapp/lib/types.ts', types, 'utf8');
  console.log('types.ts setType added');
} else { console.log('types.ts already has setType'); }

// ── 2. lib/workoutMetrics.ts — volume/heti/havi chart helpers ─
let metrics = fs.readFileSync('D:/gym-webapp/gym-webapp/lib/workoutMetrics.ts', 'utf8');
const newHelpers = `
/** Heti aggregált volume — utolsó N hét */
export function buildWeeklyVolumeChart(workouts: Workout[], weeks = 12): {week: string; vol: number}[] {
  const now = Date.now();
  return Array.from({length: weeks}, (_, i) => {
    const wIdx = weeks - 1 - i;
    const start = now - (wIdx + 1) * 7 * 86400000;
    const end   = now - wIdx * 7 * 86400000;
    const d = new Date(start);
    const vol = workouts
      .filter(w => { const t = new Date(w.startedAt).getTime(); return t >= start && t < end; })
      .reduce((a, w) => a + workoutVolume(w), 0);
    return { week: \`\${d.getMonth()+1}/\${d.getDate()}\`, vol: Math.round(vol) };
  });
}

/** Havi aggregált volume — utolsó N hónap */
export function buildMonthlyVolumeChart(workouts: Workout[], months = 12): {month: string; vol: number}[] {
  const now = new Date();
  return Array.from({length: months}, (_, i) => {
    const mIdx = months - 1 - i;
    const y = now.getFullYear(), m = now.getMonth() - mIdx;
    const start = new Date(y, m, 1).getTime();
    const end   = new Date(y, m + 1, 1).getTime();
    const label = new Date(y, m, 1).toLocaleDateString(undefined, {month:'short'});
    const vol = workouts
      .filter(w => { const t = new Date(w.startedAt).getTime(); return t >= start && t < end; })
      .reduce((a, w) => a + workoutVolume(w), 0);
    return { month: label, vol: Math.round(vol) };
  });
}

/** GitHub-style hőtérkép — utolsó 365 nap → {date, count}[] */
export function buildHeatmapData(workouts: Workout[]): {date: string; count: number}[] {
  const map = new Map<string, number>();
  const now = Date.now();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    map.set(d.toISOString().slice(0,10), 0);
  }
  for (const w of workouts) {
    const key = new Date(w.startedAt).toISOString().slice(0,10);
    if (map.has(key)) map.set(key, (map.get(key)??0) + 1);
  }
  return Array.from(map.entries()).map(([date, count]) => ({date, count}));
}

/** Top gyakorlatok részletes adatokkal */
export function topExercisesDetailed(workouts: Workout[], n = 5): {
  name: string; exerciseId: string; volume: number; sessions: number; totalSets: number;
}[] {
  const map = new Map<string, {name:string;exerciseId:string;volume:number;sessions:number;totalSets:number}>();
  for (const w of workouts) {
    const exSeen = new Set<string>();
    for (const ex of w.exercises) {
      const key = ex.exerciseId || ex.name;
      const vol = ex.sets.filter(s=>s.done).reduce((a,s)=>a+(s.weight??0)*(s.reps??0),0);
      const sets = ex.sets.filter(s=>s.done).length;
      if (!map.has(key)) map.set(key, {name:ex.name,exerciseId:key,volume:0,sessions:0,totalSets:0});
      const cur = map.get(key)!;
      cur.volume += vol;
      cur.totalSets += sets;
      if (!exSeen.has(key)) { cur.sessions++; exSeen.add(key); }
    }
  }
  return [...map.values()].sort((a,b)=>b.volume-a.volume).slice(0,n);
}

/** Progresszív túlterhelés: legutóbbi és azt megelőző hét összehasonlítása egy gyakorlatnál */
export function getProgressionSuggestion(workouts: Workout[], exerciseId: string): {
  lastWeight: number; lastReps: number; suggestedWeight: number; date: string;
} | null {
  const hits: {weight:number;reps:number;date:string}[] = [];
  for (const w of [...workouts].sort((a,b)=>new Date(b.startedAt).getTime()-new Date(a.startedAt).getTime())) {
    for (const ex of w.exercises) {
      if ((ex.exerciseId||ex.name) !== exerciseId) continue;
      const best = ex.sets.filter(s=>s.done&&s.weight&&s.reps).sort((a,b)=>(b.weight??0)-(a.weight??0))[0];
      if (best) hits.push({weight:best.weight!,reps:best.reps!,date:w.startedAt});
    }
    if (hits.length >= 1) break;
  }
  if (!hits.length) return null;
  const last = hits[0];
  return {
    lastWeight: last.weight,
    lastReps: last.reps,
    suggestedWeight: Math.round((last.weight + 2.5) * 10) / 10,
    date: last.date,
  };
}
`;
metrics = metrics.trimEnd() + '\n' + newHelpers;
fs.writeFileSync('D:/gym-webapp/gym-webapp/lib/workoutMetrics.ts', metrics, 'utf8');
console.log('workoutMetrics.ts extended');
