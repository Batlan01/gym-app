// fix_home_today.cjs — Home "Mai edzés" kártya
const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/page.tsx', 'utf8');

// 1. Import readPrograms
s = s.replace(
  `import { PROGRAM_TEMPLATES } from "@/lib/programTemplates";`,
  `import { PROGRAM_TEMPLATES } from "@/lib/programTemplates";
import { readPrograms } from "@/lib/programsStorage";`
);

// 2. Helper — todayDayIdx és getTodaySessions (copy from workout/page.tsx)
const OLD_HELPERS_END = `function formatK(n: number): string {`;
const NEW_HELPERS_END = `function todayDayIdx() { return (new Date().getDay() + 6) % 7; }
function decodePinnedEntryHome(entry: string) {
  const parts = entry.split(":");
  if (parts.length < 3) return null;
  const [slotId, sessionId, ...rest] = parts;
  return { slotId, sessionId, programId: rest.join(":") };
}
type HomeTodaySession = { slotId: string; sessionName: string; programName: string; exerciseCount: number; exercises: string[] };
function getHomeTodaySessions(profileId: string): HomeTodaySession[] {
  const programs = readPrograms(profileId);
  const dayIdx = todayDayIdx();
  const results: HomeTodaySession[] = [];
  for (const prog of programs) {
    const pinned = prog.schedule?.pinnedDays ?? {};
    const entries = pinned[String(dayIdx)];
    if (!entries) continue;
    const arr: string[] = Array.isArray(entries) ? entries : [String(entries)];
    for (const entry of arr) {
      const d = decodePinnedEntryHome(entry);
      if (!d) continue;
      const sess = prog.sessions.find(s => s.id === d.sessionId);
      if (!sess) continue;
      results.push({ slotId: d.slotId, sessionName: sess.name, programName: prog.name, exerciseCount: sess.blocks.length, exercises: sess.blocks.slice(0, 4).map(b => b.name) });
    }
  }
  return results;
}

function formatK(n: number): string {`;
s = s.replace(OLD_HELPERS_END, NEW_HELPERS_END);

// 3. A Home komponensben todaySessions kiolvasása
const OLD_GREET = `  const name = meta?.fullName?.split(" ")[0] ?? null;
  const weekDays = WEEK_DAYS[lang] ?? WEEK_DAYS.hu;`;
const NEW_GREET = `  const name = meta?.fullName?.split(" ")[0] ?? null;
  const weekDays = WEEK_DAYS[lang] ?? WEEK_DAYS.hu;
  const todaySessions = React.useMemo(() => getHomeTodaySessions(profileId), [profileId]);
  const SLOT_EMOJIS: Record<string, string> = { warmup: "🔥", main: "💪", cardio: "🏃", cooldown: "🧘" };`;
s = s.replace(OLD_GREET, NEW_GREET);

// 4. Mai edzés kártya betoldása a hero + stats közé (a hero link után)
const OLD_STATS = `        {/* ── STATS ── */}
        <div className="flex gap-2 mt-3">`;
const NEW_STATS = `        {/* ── MAI EDZÉS ── */}
        {todaySessions.length > 0 && !hasActiveToday && (
          <div className="mt-3 rounded-2xl overflow-hidden"
            style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)" }}>
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <div className="text-[9px] font-black tracking-widest" style={{ color:"var(--text-muted)" }}>
                MAI EDZÉS
              </div>
              <div className="text-[9px]" style={{ color:"var(--text-muted)" }}>
                {todaySessions.length} session
              </div>
            </div>
            {todaySessions.map((sess, i) => (
              <div key={i} className="px-4 py-3"
                style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{SLOT_EMOJIS[sess.slotId] ?? "💪"}</span>
                  <span className="text-sm font-black" style={{ color:"var(--text-primary)" }}>{sess.sessionName}</span>
                  <span className="text-xs" style={{ color:"var(--text-muted)" }}>· {sess.programName}</span>
                </div>
                {sess.exercises.length > 0 && (
                  <div className="text-xs" style={{ color:"var(--text-muted)" }}>
                    {sess.exercises.join(" · ")}{sess.exerciseCount > 4 ? \` +\${sess.exerciseCount - 4}\` : ""}
                  </div>
                )}
              </div>
            ))}
            <div className="px-3 pb-3">
              <button onClick={() => { window.location.href = "/workout"; }}
                className="w-full rounded-xl py-3 text-sm font-black pressable"
                style={{ background:"var(--accent-primary)", color:"#000" }}>
                Edzés indítása →
              </button>
            </div>
          </div>
        )}

        {hasActiveToday && (
          <div className="mt-3 rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background:"rgba(74,222,128,0.07)", border:"1px solid rgba(74,222,128,0.2)" }}>
            <span className="text-xl">✅</span>
            <div>
              <div className="text-sm font-black" style={{ color:"#4ade80" }}>Ma már edztél!</div>
              <div className="text-xs" style={{ color:"var(--text-muted)" }}>Szép munka, tartsuk a streeket!</div>
            </div>
          </div>
        )}

        {/* ── STATS ── */}
        <div className="flex gap-2 mt-3">`;
s = s.replace(OLD_STATS, NEW_STATS);

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/page.tsx', s, 'utf8');
console.log('home fixed, lines:', s.split('\n').length);
