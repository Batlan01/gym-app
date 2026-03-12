const fs = require('fs');
let t = fs.readFileSync('D:/gym-webapp/gym-webapp/lib/types.ts', 'utf8');
t = t.replace(
  '  favorite?: boolean;\n};\n\nexport type Workout',
  '  favorite?: boolean;\n  bilateral?: boolean;\n};\n\nexport type Workout'
);
fs.writeFileSync('D:/gym-webapp/gym-webapp/lib/types.ts', t, 'utf8');
console.log('bilateral in types:', t.includes('bilateral?: boolean'));
