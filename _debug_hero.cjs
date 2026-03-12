const fs = require('fs');
const path = 'D:/gym-webapp/gym-webapp/app/page.tsx';
let s = fs.readFileSync(path, 'utf8');

// Megtaláljuk a hero kezdetét és végét, és kicseréljük
const heroStart = s.indexOf('        {/* ── HERO ── */}');
const heroEnd = s.indexOf('        </button>\n\n        {/* ── MAI EDZÉS ── */}');

if (heroStart === -1) { console.error('hero start not found'); process.exit(1); }
if (heroEnd === -1) { console.error('hero end not found, trying alt...'); }

// Keressük a "MAI EDZÉS" + hasActiveToday blokk végét
const maiEdzesPart = s.indexOf('{hasActiveToday && (');
const maiEdzesPart2 = s.indexOf('          </div>\n        )}\n\n        {/* ── STATS ── */}');

console.log('heroStart:', heroStart, 'heroEnd:', heroEnd, 'maiEdzesPart:', maiEdzesPart, 'maiEdzesPart2:', maiEdzesPart2);
