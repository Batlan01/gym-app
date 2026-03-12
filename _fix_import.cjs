const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/workout/page.tsx', 'utf8');
const lines = s.split('\n');
lines.splice(18, 0, 'import { getProgressionSuggestion } from "@/lib/workoutMetrics";');
fs.writeFileSync('D:/gym-webapp/gym-webapp/app/workout/page.tsx', lines.join('\n'), 'utf8');
console.log('import added');
