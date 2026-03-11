const fs = require('fs');
const path = require('path');

const ROOT = 'D:/gym-webapp/gym-webapp';

// Files to fix
const FILES = [
  'app/programs/page.tsx',
  'app/programs/[programId]/page.tsx',
  'app/exercises/ExercisesClient.tsx',
  'app/exercises/page.tsx',
  'app/calendar/page.tsx',
];

// Pattern replacements: hardcoded dark rgba → CSS var
const REPLACEMENTS = [
  // Sticky header backgrounds - the main culprit
  [/background:\s*['"]?rgba\(8,\s*11,\s*15,\s*0\.\d+\)['"]?/g, 'background:"var(--sticky-bg)"'],
  [/background:\s*['"]?rgba\(10,\s*14,\s*20,\s*0\.\d+\)['"]?/g, 'background:"var(--sticky-bg)"'],
  [/background:\s*['"]?rgba\(13,\s*13,\s*15,\s*0\.\d+\)['"]?/g, 'background:"var(--sticky-bg)"'],
  // Sheet/modal hardcoded backgrounds
  [/background:\s*["']#0d0d0f["']/g, 'background:"var(--bg-elevated)"'],
  [/background:\s*["']#080B0F["']/g, 'background:"var(--bg-base)"'],
  [/background:\s*["']#0F1318["']/g, 'background:"var(--bg-surface)"'],
  // Program card gradients
  [/background:\s*['"]linear-gradient\(135deg,\s*#[0-9a-fA-F]+\s+0%,\s*#[0-9a-fA-F]+\s+100%\)['"](?!\s*,)/g, (m) => m], // keep gradients
];

let changed = 0;
for (const rel of FILES) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) { console.log('skip (not found):', rel); continue; }
  let s = fs.readFileSync(full, 'utf8');
  const orig = s;
  for (const [p, r] of REPLACEMENTS) {
    if (typeof r === 'string') s = s.replace(p, r);
  }
  if (s !== orig) {
    fs.writeFileSync(full, s, 'utf8');
    changed++;
    console.log('fixed:', rel);
  } else {
    console.log('no match:', rel);
  }
}
console.log('done, changed:', changed);
