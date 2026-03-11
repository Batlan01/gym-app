const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/progress/page.tsx', 'utf8');

// Add useTranslation hook to PRTab
s = s.replace(
  'function PRTab({ prs, onSearch, onOpenChart }: { prs: PRMap; onSearch: (q: string) => void; onOpenChart: (e: PREntry) => void }) {\n  const [q, setQ] = React.useState("");',
  'function PRTab({ prs, onSearch, onOpenChart }: { prs: PRMap; onSearch: (q: string) => void; onOpenChart: (e: PREntry) => void }) {\n  const { t: pt } = useTranslation();\n  const [q, setQ] = React.useState("");'
);

// Fix t. refs in PRTab empty state
s = s.replace(
  '<div className="text-base font-black mb-2" style={{color:"var(--text-primary)"}}>{t.progress.pr_none}</div>',
  '<div className="text-base font-black mb-2" style={{color:"var(--text-primary)"}}>{pt.progress.pr_none}</div>'
);
s = s.replace(
  '{t.progress.pr_none_sub}',
  '{pt.progress.pr_none_sub}'
);
s = s.replace(
  'placeholder={t.common.search}',
  'placeholder={pt.common.search}'
);
s = s.replace(
  '{entries.length} {t.progress.pr_exercises}',
  '{entries.length} {pt.progress.pr_exercises}'
);

// PRCard - add useTranslation and fix t. refs
s = s.replace(
  'function PRCard({ entry, rank, onOpen }: { entry: PREntry; rank: number; onOpen: () => void }) {\n  const [expanded, setExpanded] = React.useState(false);',
  'function PRCard({ entry, rank, onOpen }: { entry: PREntry; rank: number; onOpen: () => void }) {\n  const { t: ct } = useTranslation();\n  const [expanded, setExpanded] = React.useState(false);'
);
s = s.replace(
  '{label:t.progress.pr_best_weight,',
  '{label:ct.progress.pr_best_weight,'
);
s = s.replace(
  '{label:t.progress.pr_best_set,',
  '{label:ct.progress.pr_best_set,'
);
s = s.replace(
  '{label:t.progress.pr_total_sets,',
  '{label:ct.progress.pr_total_sets,'
);
// Grafikon button in PRCard still has hardcoded text - fix
s = s.replace(
  '>Grafikon →\n          </button>',
  '>{ct.progress.pr_chart_btn}\n          </button>'
);

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/progress/page.tsx', s, 'utf8');
console.log('PRTab/PRCard t refs fixed');
