const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/progress/page.tsx', 'utf8');

// Add useTranslation import
s = s.replace(
  'import * as React from "react";',
  'import * as React from "react";\nimport { useTranslation } from "@/lib/i18n";'
);

// Add hook in component body
s = s.replace(
  'export default function ProgressPage() {\n  const [activeProfileId]',
  'export default function ProgressPage() {\n  const { t } = useTranslation();\n  const [activeProfileId]'
);

// Tab labels
s = s.replace(
  '{ id: "overview", label: "Áttekintés" },',
  '{ id: "overview", label: t.progress.tab_overview },'
);
s = s.replace(
  '{ id: "history", label: `Edzések${history.length ? ` (${history.length})` : ""}` },',
  '{ id: "history", label: `${t.progress.tab_history}${history.length ? ` (${history.length})` : ""}` },'
);

// Stat grid
s = s.replace('{label:"Összes edzés", value: String(history.length), sub: `${last30count} az elmúlt 30 napban`},', '{label:t.progress.total_workouts, value:String(history.length), sub:`${last30count} ${t.progress.last_30}`},');
s = s.replace('{label:"Streak", value: streak ? `${streak} nap` : "—", sub: `${last7count} edzés 7 napban`},', '{label:t.progress.streak, value:streak ? `${streak} ${t.progress.nap}` : "—", sub:`${last7count} ${t.progress.last_7}`},');
s = s.replace('{label:"Összes volume", value: formatK(totalVol), sub:"kg összesen"},', '{label:t.progress.total_volume, value:formatK(totalVol), sub:t.progress.kg_total},');
s = s.replace('{label:"Átlag/hét", value: history.length ? `${(last30count/4).toFixed(1)}` : "—", sub:"edzés/hét (30n)"},', '{label:t.progress.avg_per_week, value:history.length ? `${(last30count/4).toFixed(1)}` : "—", sub:t.progress.per_week_30},');

// Chart labels
s = s.replace('>GRAFIKON</div>', '>{t.progress.chart}</div>');
s = s.replace('{m==="volume" ? "Volume" : "Frekvencia"}', '{m==="volume" ? t.progress.chart_volume : t.progress.chart_freq}');

// Top exercises
s = s.replace('>TOP GYAKORLATOK</div>', '>{t.progress.top_exercises}</div>');

// History empty state
s = s.replace(
  '<div className="text-sm" style={{color:"rgba(255,255,255,0.3)"}}>Még nincs mentett edzés</div>',
  '<div className="text-sm" style={{color:"rgba(255,255,255,0.3)"}}>{t.progress.no_workouts}</div>'
);

// Cloud messages
s = s.replace(
  'Cloud profil aktív, de nincs bejelentkezve. Lépj be újra.',
  '{t.progress.cloud_wrong_user}'
);
s = s.replace(
  '>Cloud adatok betöltése…</div>',
  '>{t.progress.cloud_loading}</div>'
);

// Buttons
s = s.replace('>CSV export\n              </button>', '>{t.progress.csv_export}\n              </button>');
s = s.replace('>Összes törlése\n              </button>', '>{t.progress.delete_all_btn}\n              </button>');

// Confirm dialogs
s = s.replace('if (!window.confirm("Törlöd ezt az edzést?")) return;', 'if (!window.confirm(t.progress.delete_workout)) return;');
s = s.replace('if (!window.confirm("Minden edzést törölsz?")) return;', 'if (!window.confirm(t.progress.delete_all)) return;');

// PR tab - no PRs state
s = s.replace(
  '<div className="text-base font-black mb-2" style={{color:"var(--text-primary)"}}>Még nincs PR</div>',
  '<div className="text-base font-black mb-2" style={{color:"var(--text-primary)"}}>{t.progress.pr_none}</div>'
);
s = s.replace(
  'Végezz el egy edzést és automatikusan megjelennek a személyes rekordjaid',
  '{t.progress.pr_none_sub}'
);
s = s.replace('placeholder="Keresés gyakorlatra…"', 'placeholder={t.common.search}');

// PR card stats labels
s = s.replace('{label:"Legsúlyosabb",', '{label:t.progress.pr_best_weight,');
s = s.replace('{label:"Legjobb szet",', '{label:t.progress.pr_best_set,');
s = s.replace('{label:"Össz. szet",', '{label:t.progress.pr_total_sets,');

// Grafikon button in PR card
s = s.replace('>Grafikon →\n          </button>', '>{t.progress.pr_chart_btn}\n          </button>');

// fmtDate - use locale-aware
s = s.replace(
  'return new Date(iso).toLocaleDateString("hu", {month:"short",day:"2-digit",weekday:"short"});',
  'return new Date(iso).toLocaleDateString(undefined, {month:"short",day:"2-digit",weekday:"short"});'
);
s = s.replace(
  'return new Date(iso).toLocaleDateString("hu", {month:"short", day:"2-digit"});',
  'return new Date(iso).toLocaleDateString(undefined, {month:"short", day:"2-digit"});'
);

// h1 title
s = s.replace(
  '<h1 className="text-2xl font-black" style={{color:"var(--text-primary)"}}>Progress</h1>',
  '<h1 className="text-2xl font-black" style={{color:"var(--text-primary)"}}>{t.progress.title}</h1>'
);

// PR count in tab label
s = s.replace(
  '{ id: "prs", label: `PR${prCount ? ` (${prCount})` : ""}` },',
  '{ id: "prs", label: `${t.progress.tab_prs}${prCount ? ` (${prCount})` : ""}` },'
);

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/progress/page.tsx', s, 'utf8');
console.log('progress i18n done');
