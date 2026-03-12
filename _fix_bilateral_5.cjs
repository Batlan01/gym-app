const fs = require('fs');

// Fix 1: workout/page.tsx — exercise prop: null → undefined
let w = fs.readFileSync('D:/gym-webapp/gym-webapp/app/workout/page.tsx', 'utf8');
w = w.replace(
  'exercise={currentEdit?.ex}',
  'exercise={currentEdit?.ex ?? undefined}'
);
fs.writeFileSync('D:/gym-webapp/gym-webapp/app/workout/page.tsx', w, 'utf8');

// Fix 2: SetEditSheet.tsx — bilateral mező: exercise?.bilateral → (exercise as any)?.bilateral
// Valójában a types.ts-ben már hozzáadtuk, de a WorkoutExercise-hoz kell hivatkozni
// Ellenőrzük a types-t
let types = fs.readFileSync('D:/gym-webapp/gym-webapp/lib/types.ts', 'utf8');
const hasBilateral = types.includes('bilateral?: boolean');
console.log('types has bilateral:', hasBilateral);

// Ha nincs benne, betesszük
if (!hasBilateral) {
  types = types.replace(
    '  favorite?: boolean;\n};',
    '  favorite?: boolean;\n  /** undefined = auto (group alapján), true = egykezes ×2, false = kétkezes ×1 */\n  bilateral?: boolean;\n};'
  );
  fs.writeFileSync('D:/gym-webapp/gym-webapp/lib/types.ts', types, 'utf8');
  console.log('types bilateral added');
}
console.log('fixes applied');
