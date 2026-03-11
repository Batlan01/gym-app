const fs = require('fs');

// Fix 1: app/page.tsx - program card gradients
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/page.tsx', 'utf8');
s = s.replace(
`  gym:     "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  home:    "linear-gradient(135deg, #1a2e1a 0%, #162116 100%)",
  running: "linear-gradient(135deg, #2e1a1a 0%, #211616 100%)",
  boxing:  "linear-gradient(135deg, #2e1a2e 0%, #211621 100%)",
  yoga:    "linear-gradient(135deg, #1a2a2e 0%, #162021 100%)",`,
`  gym:     "var(--grad-gym)",
  home:    "var(--grad-home)",
  running: "var(--grad-running)",
  boxing:  "var(--grad-boxing)",
  yoga:    "var(--grad-yoga)",`
);
fs.writeFileSync('D:/gym-webapp/gym-webapp/app/page.tsx', s, 'utf8');
console.log('page.tsx gradients:', s.includes('var(--grad-gym)') ? 'fixed' : 'NOT FIXED');

// Fix 2: app/programs/page.tsx - same gradient map if exists
let sp = fs.readFileSync('D:/gym-webapp/gym-webapp/app/programs/page.tsx', 'utf8');
// Check if it has the same gradient patterns
if (sp.includes('#1a1a2e')) {
  sp = sp.replace(/gym:\s*["']linear-gradient[^"']+["']/g, 'gym:"var(--grad-gym)"');
  sp = sp.replace(/home:\s*["']linear-gradient[^"']+["']/g, 'home:"var(--grad-home)"');
  sp = sp.replace(/running:\s*["']linear-gradient[^"']+["']/g, 'running:"var(--grad-running)"');
  sp = sp.replace(/boxing:\s*["']linear-gradient[^"']+["']/g, 'boxing:"var(--grad-boxing)"');
  sp = sp.replace(/yoga:\s*["']linear-gradient[^"']+["']/g, 'yoga:"var(--grad-yoga)"');
  fs.writeFileSync('D:/gym-webapp/gym-webapp/app/programs/page.tsx', sp, 'utf8');
  console.log('programs/page.tsx gradients fixed');
}
