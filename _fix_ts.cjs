const fs = require('fs');

// Fix 1: BottomNav-nak active prop
// progress/page.tsx line ~515 — BottomNav active="progress"
let prog = fs.readFileSync('D:/gym-webapp/gym-webapp/app/progress/page.tsx', 'utf8');
prog = prog.replace(
  '<BottomNav active="progress" />',
  '<BottomNav />'
);
fs.writeFileSync('D:/gym-webapp/gym-webapp/app/progress/page.tsx', prog, 'utf8');
console.log('progress BottomNav fixed');

// Fix 2: workout/page.tsx — import getProgressionSuggestion
let workout = fs.readFileSync('D:/gym-webapp/gym-webapp/app/workout/page.tsx', 'utf8');
// Ellenőrzés
console.log('has import:', workout.includes('getProgressionSuggestion'));
// Ha nincs, betesszük más import mellé
if (!workout.includes('getProgressionSuggestion')) {
  workout = workout.replace(
    `import { workoutVolume } from "@/lib/workoutMetrics";`,
    `import { workoutVolume, getProgressionSuggestion } from "@/lib/workoutMetrics";`
  );
  // Ha az első nem megy, próbáljuk a workoutMetrics import-ot megtalálni
  if (!workout.includes('getProgressionSuggestion')) {
    // Regex keresés
    const match = workout.match(/from "@\/lib\/workoutMetrics"/);
    if (match) {
      // Cseréljük ki az import sort
      workout = workout.replace(
        /import \{([^}]+)\} from "@\/lib\/workoutMetrics"/,
        (m, inner) => `import {${inner.trim()}, getProgressionSuggestion } from "@/lib/workoutMetrics"`
      );
    }
  }
  fs.writeFileSync('D:/gym-webapp/gym-webapp/app/workout/page.tsx', workout, 'utf8');
  console.log('workout import fixed, has now:', workout.includes('getProgressionSuggestion'));
}

// Fix 3: types.ts — SetType export ellenőrzés
let types = fs.readFileSync('D:/gym-webapp/gym-webapp/lib/types.ts', 'utf8');
console.log('SetType in types:', types.includes('export type SetType'));
if (!types.includes('export type SetType')) {
  // CRLF-safe betoldás a fájl elejére
  const lines = types.split(/\r?\n/);
  lines.splice(1, 0, 'export type SetType = "normal" | "warmup" | "superset" | "dropset" | "failure";', '');
  fs.writeFileSync('D:/gym-webapp/gym-webapp/lib/types.ts', lines.join('\r\n'), 'utf8');
  console.log('SetType added to types.ts');
}

// Fix 4: WorkoutSet — setType mező
types = fs.readFileSync('D:/gym-webapp/gym-webapp/lib/types.ts', 'utf8');
console.log('setType in WorkoutSet:', types.includes('setType?: SetType'));
if (!types.includes('setType?: SetType')) {
  types = types.replace(
    /done\?: boolean;\r?\n};/,
    'done?: boolean;\r\n  setType?: SetType;\r\n};'
  );
  fs.writeFileSync('D:/gym-webapp/gym-webapp/lib/types.ts', types, 'utf8');
  console.log('setType added to WorkoutSet');
}
