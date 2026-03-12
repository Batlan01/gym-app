const fs = require('fs');
const path = 'D:/gym-webapp/gym-webapp/app/page.tsx';
let s = fs.readFileSync(path, 'utf8');

// Töröljük a fölösleges kommentet
s = s.replace('              {/* Tartalom: mai session vagy alap */}\n', '');

// Szépebb "Készen állsz" szöveg + bold
s = s.replace(
  '                  <div className="text-sm font-black mb-0.5" style={{ color: "rgba(0,0,0,0.5)" }}>\n                    Készen állsz a\n                  </div>',
  '                  <div className="text-xs font-black tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.45)" }}>\n                    KÉSZEN ÁLLSZ A\n                  </div>'
);

fs.writeFileSync(path, s, 'utf8');
console.log('cleanup done');
