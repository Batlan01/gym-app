const fs=require('fs');
let s=fs.readFileSync('D:/gym-webapp/gym-webapp/app/programs/[programId]/page.tsx','utf8');
s=s.replace('import { ALL_EXERCISE_GROUPS } from "@/lib/exercises";','import { ALL_EXERCISE_GROUPS } from "@/lib/exerciseGroups";');
fs.writeFileSync('D:/gym-webapp/gym-webapp/app/programs/[programId]/page.tsx',s,'utf8');
console.log('import fixed:', s.includes('exerciseGroups'));
