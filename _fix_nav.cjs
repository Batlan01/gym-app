const fs=require('fs');
let s=fs.readFileSync('D:/gym-webapp/gym-webapp/components/BottomNav.tsx','utf8');
s=s.replace('className="mb-3 rounded-2xl shadow-2xl"', 'className="mb-3 rounded-2xl shadow-2xl nav-glass"');
fs.writeFileSync('D:/gym-webapp/gym-webapp/components/BottomNav.tsx',s,'utf8');
console.log('done:', s.includes('nav-glass') ? 'YES' : 'NO');
