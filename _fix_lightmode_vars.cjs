/**
 * Proper light mode: replace hardcoded rgba(255,255,255,X) colors
 * in ALL tsx/ts files with semantic CSS variables.
 * 
 * Maps:
 *   rgba(255,255,255,0.03-0.08) backgrounds → var(--surface-1)  
 *   rgba(255,255,255,0.04) → var(--surface-1)
 *   rgba(255,255,255,0.07-0.12) → var(--surface-2)
 *   rgba(255,255,255,0.15-0.20) → var(--surface-3)
 *   rgba(255,255,255,0.05) border/separator → var(--border-subtle)
 *   rgba(255,255,255,0.07) border → var(--border-subtle)  
 *   rgba(255,255,255,0.12) border → var(--border-mid)
 *   rgba(255,255,255,0.25) label/muted text → var(--text-muted)
 *   rgba(255,255,255,0.3-0.35) secondary text → var(--text-secondary) 
 *   rgba(255,255,255,0.6-0.7) primary-ish text → var(--text-primary)
 *   rgba(10,14,20,0.85) nav bg → var(--nav-bg)
 *   #0d0d0f / #080B0F hardcoded bgs → var(--bg-elevated) / var(--bg-base)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = 'D:/gym-webapp/gym-webapp';
const DIRS = ['app', 'components'];

// Background replacements (in style={{background:...}} or style={{background:"..."}})
const BG_REPLACEMENTS = [
  // Very subtle card surfaces
  [/background:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.03\)["']?/g, 'background:"var(--surface-0)"'],
  [/background:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.04\)["']?/g, 'background:"var(--surface-1)"'],
  [/background:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.05\)["']?/g, 'background:"var(--surface-1)"'],
  [/background:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.06\)["']?/g, 'background:"var(--surface-2)"'],
  [/background:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.07\)["']?/g, 'background:"var(--surface-2)"'],
  [/background:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.08\)["']?/g, 'background:"var(--surface-2)"'],
  [/background:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.1\)["']?/g,  'background:"var(--surface-2)"'],
  [/background:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.10\)["']?/g, 'background:"var(--surface-2)"'],
  [/background:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.12\)["']?/g, 'background:"var(--surface-3)"'],
  [/background:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.15\)["']?/g, 'background:"var(--surface-3)"'],
  [/background:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.2\)["']?/g,  'background:"var(--surface-3)"'],
  [/background:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.20\)["']?/g, 'background:"var(--surface-3)"'],
  // Hardcoded dark backgrounds
  [/background:\s*["']#0d0d0f["']/g, 'background:"var(--bg-elevated)"'],
  [/background:\s*["']#080B0F["']/g, 'background:"var(--bg-base)"'],
  // Nav
  [/background:\s*["']?rgba\(10,\s*14,\s*20,\s*0\.85\)["']?/g, 'background:"var(--nav-bg)"'],
];

// Color text replacements  
const COLOR_REPLACEMENTS = [
  [/color:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.25\)["']?/g, 'color:"var(--text-muted)"'],
  [/color:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.3\)["']?/g,  'color:"var(--text-muted)"'],
  [/color:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.35\)["']?/g, 'color:"var(--text-muted)"'],
  [/color:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.4\)["']?/g,  'color:"var(--text-secondary)"'],
  [/color:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.45\)["']?/g, 'color:"var(--text-secondary)"'],
  [/color:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.5\)["']?/g,  'color:"var(--text-secondary)"'],
  [/color:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.6\)["']?/g,  'color:"var(--text-secondary)"'],
  [/color:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.7\)["']?/g,  'color:"var(--text-primary)"'],
  [/color:\s*["']?rgba\(255,\s*255,\s*255,\s*0\.8\)["']?/g,  'color:"var(--text-primary)"'],
];

// Border replacements
const BORDER_REPLACEMENTS = [
  [/borderBottom:\s*["']?1px solid rgba\(255,\s*255,\s*255,\s*0\.05\)["']?/g, 'borderBottom:"1px solid var(--border-subtle)"'],
  [/borderTop:\s*["']?1px solid rgba\(255,\s*255,\s*255,\s*0\.05\)["']?/g, 'borderTop:"1px solid var(--border-subtle)"'],
  [/border:\s*["']?1px solid rgba\(255,\s*255,\s*255,\s*0\.05\)["']?/g, 'border:"1px solid var(--border-subtle)"'],
  [/border:\s*["']?1px solid rgba\(255,\s*255,\s*255,\s*0\.06\)["']?/g, 'border:"1px solid var(--border-subtle)"'],
  [/border:\s*["']?1px solid rgba\(255,\s*255,\s*255,\s*0\.07\)["']?/g, 'border:"1px solid var(--border-subtle)"'],
  [/border:\s*["']?1px solid rgba\(255,\s*255,\s*255,\s*0\.08\)["']?/g, 'border:"1px solid var(--border-subtle)"'],
  [/border:\s*["']?1px solid rgba\(255,\s*255,\s*255,\s*0\.1\)["']?/g,  'border:"1px solid var(--border-mid)"'],
  [/border:\s*["']?1px solid rgba\(255,\s*255,\s*255,\s*0\.12\)["']?/g, 'border:"1px solid var(--border-mid)"'],
  [/border:\s*["']?1px solid rgba\(255,\s*255,\s*255,\s*0\.15\)["']?/g, 'border:"1px solid var(--border-mid)"'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  for (const [pattern, replacement] of [...BG_REPLACEMENTS, ...COLOR_REPLACEMENTS, ...BORDER_REPLACEMENTS]) {
    content = content.replace(pattern, replacement);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.next', '.git'].includes(entry.name)) {
      files.push(...walkDir(full));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      files.push(full);
    }
  }
  return files;
}

let changed = 0, total = 0;
for (const dir of DIRS) {
  const files = walkDir(path.join(ROOT, dir));
  for (const file of files) {
    total++;
    if (processFile(file)) {
      changed++;
      console.log('  ✓', path.relative(ROOT, file));
    }
  }
}
console.log(`\nDone: ${changed}/${total} files modified`);
