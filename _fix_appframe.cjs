const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/components/AppFrame.tsx', 'utf8');
s = s.replace('className="min-h-dvh bg-black text-white"', 'className="min-h-dvh text-white" style={{backgroundColor:"var(--bg-base)",color:"var(--text-primary)"}}');
fs.writeFileSync('D:/gym-webapp/gym-webapp/components/AppFrame.tsx', s, 'utf8');
console.log('AppFrame bg-black fixed:', s.includes('bg-black') ? 'STILL THERE' : 'REMOVED');
