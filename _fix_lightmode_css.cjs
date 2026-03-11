/**
 * Light mode fix: replace all rgba(255,255,255,X) with CSS vars,
 * and add light-mode overrides to globals.css
 * 
 * Strategy: instead of touching 238 component occurrences,
 * we use a CSS trick: in light mode, override via CSS custom properties
 * that are computed from the alpha value.
 * 
 * We add a data-mode="light" CSS block that:
 * 1. Inverts hardcoded white-alpha backgrounds to black-alpha
 * 2. Fixes nav background
 * 3. Fixes hardcoded #0d0d0f colors (calendar sheet)
 * 4. Fixes text colors
 */
const fs = require('fs');

const cssPath = 'D:/gym-webapp/gym-webapp/app/globals.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Remove old light mode block and nav override (we'll rewrite it cleanly)
css = css.replace(/\/\* ── LIGHT MODE ──[\s\S]*?\[data-mode="light"\] nav div \{[\s\S]*?\}/m, '');

const lightModeBlock = `
/* ══════════════════════════════════════════════════
   LIGHT MODE — complete overrides
   ══════════════════════════════════════════════════ */
[data-mode="light"] {
  color-scheme: light;
  --bg-base:        #F0F4F8;
  --bg-surface:     #E4EAF0;
  --bg-elevated:    #FFFFFF;
  --bg-card:        rgba(0,0,0,0.04);
  --bg-card-hover:  rgba(0,0,0,0.07);
  --border-subtle:  rgba(0,0,0,0.08);
  --border-mid:     rgba(0,0,0,0.16);
  --border-accent:  rgba(34,211,238,0.5);
  --text-primary:   #0F172A;
  --text-secondary: rgba(15,23,42,0.65);
  --text-muted:     rgba(15,23,42,0.40);
}

/* background & text */
[data-mode="light"] body { background-color: var(--bg-base); color: var(--text-primary); }

/* ambient glow — softer */
[data-mode="light"] body::before {
  background:
    radial-gradient(ellipse 80% 50% at 15% 10%, rgba(34,211,238,0.09) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 85% 80%, rgba(74,222,128,0.07) 0%, transparent 55%),
    radial-gradient(ellipse 50% 60% at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 70%);
}
[data-mode="light"] body::after { opacity: 0.005; }

/* ── white-alpha → dark-alpha surface fixes ── */
/* These selectors flip rgba(255,255,255,X) surfaces to rgba(0,0,0,X) equivalents */
[data-mode="light"] [style*="rgba(255,255,255,0.03)"],
[data-mode="light"] [style*="rgba(255,255,255, 0.03)"] {
  background: rgba(0,0,0,0.03) !important;
}
[data-mode="light"] [style*="rgba(255,255,255,0.04)"],
[data-mode="light"] [style*="rgba(255,255,255, 0.04)"] {
  background: rgba(0,0,0,0.04) !important;
}
[data-mode="light"] [style*="rgba(255,255,255,0.05)"],
[data-mode="light"] [style*="rgba(255,255,255, 0.05)"] {
  background: rgba(0,0,0,0.05) !important;
}
[data-mode="light"] [style*="rgba(255,255,255,0.06)"],
[data-mode="light"] [style*="rgba(255,255,255, 0.06)"] {
  background: rgba(0,0,0,0.06) !important;
}
[data-mode="light"] [style*="rgba(255,255,255,0.07)"],
[data-mode="light"] [style*="rgba(255,255,255, 0.07)"] {
  background: rgba(0,0,0,0.07) !important;
}
[data-mode="light"] [style*="rgba(255,255,255,0.08)"],
[data-mode="light"] [style*="rgba(255,255,255, 0.08)"] {
  background: rgba(0,0,0,0.08) !important;
}
[data-mode="light"] [style*="rgba(255,255,255,0.10)"],
[data-mode="light"] [style*="rgba(255,255,255,0.1)"],
[data-mode="light"] [style*="rgba(255,255,255, 0.1)"] {
  background: rgba(0,0,0,0.09) !important;
}
[data-mode="light"] [style*="rgba(255,255,255,0.12)"],
[data-mode="light"] [style*="rgba(255,255,255, 0.12)"] {
  background: rgba(0,0,0,0.10) !important;
}
[data-mode="light"] [style*="rgba(255,255,255,0.15)"],
[data-mode="light"] [style*="rgba(255,255,255, 0.15)"] {
  background: rgba(0,0,0,0.11) !important;
}

/* ── hardcoded dark bg fixes ── */
[data-mode="light"] [style*="background: \"#0d0d0f\""],
[data-mode="light"] [style*='background: "#0d0d0f"'],
[data-mode="light"] [style*="background: #0d0d0f"],
[data-mode="light"] [style*='background:"#0d0d0f"'] {
  background: var(--bg-elevated) !important;
}
[data-mode="light"] [style*="background: #080B0F"],
[data-mode="light"] [style*="background:#080B0F"] {
  background: var(--bg-base) !important;
}

/* ── white text color fixes → dark ── */
[data-mode="light"] [style*="color:\"rgba(255,255,255"],
[data-mode="light"] [style*='color:"rgba(255,255,255'],
[data-mode="light"] [style*="color: rgba(255,255,255,0.25)"],
[data-mode="light"] [style*="color: rgba(255,255,255,0.3)"],
[data-mode="light"] [style*="color: rgba(255,255,255,0.35)"],
[data-mode="light"] [style*="color: rgba(255,255,255,0.4)"],
[data-mode="light"] [style*="color: rgba(255,255,255,0.5)"],
[data-mode="light"] [style*="color: rgba(255,255,255,0.6)"],
[data-mode="light"] [style*="color: rgba(255,255,255,0.7)"],
[data-mode="light"] [style*="color:rgba(255,255,255"] {
  color: var(--text-muted) !important;
}
[data-mode="light"] [style*="color: #fff"],
[data-mode="light"] [style*='color: "#fff"'],
[data-mode="light"] [style*="color:#fff"] {
  color: #0F172A !important;
}

/* ── BottomNav ── */
[data-mode="light"] nav > div > div:first-child {
  background: rgba(240,244,248,0.92) !important;
  border-color: rgba(0,0,0,0.10) !important;
}

/* ── Sheets & modals with hardcoded bg ── */
[data-mode="light"] .rounded-t-\\[2rem\\],
[data-mode="light"] .rounded-t-3xl,
[data-mode="light"] .rounded-t-2xl {
  background: var(--bg-elevated) !important;
}

/* ── label-xs muted color ── */
[data-mode="light"] .label-xs {
  color: rgba(15,23,42,0.38) !important;
}

/* ── ARCX branding label ── */
[data-mode="light"] [style*="rgba(255,255,255,0.25)"] {
  color: rgba(15,23,42,0.30) !important;
}
`;

// Insert light mode block before "html, body"
css = css.replace('html, body {', lightModeBlock + '\nhtml, body {');

fs.writeFileSync(cssPath, css, 'utf8');
console.log('Light mode CSS rewritten. Length:', css.length);
