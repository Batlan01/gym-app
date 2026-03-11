// fix_builder_exercise_picker.cjs
const fs = require('fs');
let page = fs.readFileSync('D:/gym-webapp/gym-webapp/app/programs/[programId]/page.tsx', 'utf8');

// 1. Import exercises
const OLD_IMPORT = `import { readPrograms, upsertProgram, deleteProgram } from "@/lib/programsStorage";
import { sportLabel } from "@/lib/programTemplates";`;
const NEW_IMPORT = `import { readPrograms, upsertProgram, deleteProgram } from "@/lib/programsStorage";
import { sportLabel } from "@/lib/programTemplates";
import { ALL_EXERCISE_GROUPS } from "@/lib/exercises";`;
page = page.replace(OLD_IMPORT, NEW_IMPORT);

// 2. Add ExercisePickerSheet component before "// ── Főkomponens"
const PICKER_COMPONENT = `
// ── Gyakorlat kereső sheet ───────────────────────────────────
function ExercisePickerSheet({ onPick, onCustom, onClose }: {
  onPick: (name: string) => void;
  onCustom: () => void;
  onClose: () => void;
}) {
  const [q, setQ] = React.useState('');
  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return ALL_EXERCISE_GROUPS;
    return ALL_EXERCISE_GROUPS.map(g => ({
      ...g,
      exercises: g.exercises.filter(e => e.toLowerCase().includes(qq)),
    })).filter(g => g.exercises.length > 0);
  }, [q]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end" style={{ background:'rgba(0,0,0,0.7)' }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="w-full rounded-t-3xl flex flex-col animate-in slide-in-from-bottom"
        style={{ background:'var(--bg-elevated)', maxHeight:'88dvh' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="h-1 w-10 rounded-full" style={{ background:'var(--surface-3)' }} />
        </div>
        {/* Header + keresés */}
        <div className="px-5 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black" style={{ color:'var(--text-primary)' }}>Gyakorlat hozzáadása</h2>
            <button onClick={onClose} className="text-sm pressable" style={{ color:'var(--text-muted)' }}>✕</button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color:'var(--text-muted)' }}>🔍</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Keresés…"
              autoFocus
              className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm outline-none"
              style={{ background:'var(--surface-1)', border:'1px solid var(--border-subtle)', color:'var(--text-primary)' }} />
          </div>
        </div>
        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* Egyéni gomb */}
          <button onClick={onCustom}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 mb-4 pressable"
            style={{ background:'rgba(34,211,238,0.07)', border:'1px dashed rgba(34,211,238,0.3)' }}>
            <span className="text-lg">✏️</span>
            <div className="text-left">
              <div className="text-sm font-bold" style={{ color:'var(--accent-primary)' }}>Egyéni gyakorlat</div>
              <div className="text-xs" style={{ color:'var(--text-muted)' }}>Saját névvel hozd létre</div>
            </div>
          </button>
          {/* Csoportok */}
          {filtered.map(group => (
            <div key={group.name} className="mb-4">
              <div className="text-xs font-bold uppercase tracking-wide mb-2"
                style={{ color:'var(--text-muted)' }}>{group.emoji} {group.name}</div>
              <div className="space-y-1.5">
                {group.exercises.map(ex => (
                  <button key={ex} onClick={()=>onPick(ex)}
                    className="w-full text-left rounded-xl px-4 py-2.5 text-sm pressable"
                    style={{ background:'var(--surface-1)', color:'var(--text-primary)', border:'1px solid var(--border-subtle)' }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm" style={{ color:'var(--text-muted)' }}>
              Nincs találat — próbáld egyénivel!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

`;

page = page.replace('// ── Főkomponens ──────────────────────────────────────────────', PICKER_COMPONENT + '// ── Főkomponens ──────────────────────────────────────────────');

// 3. Add showExercisePicker state + pendingSessionId to ProgramBuilderPage
const OLD_STATES = `  const [editBlock, setEditBlock] = React.useState<{ sessionId: string; index: number } | null>(null);
  const [tab, setTab] = React.useState<'sessions' | 'settings'>('sessions');`;
const NEW_STATES = `  const [editBlock, setEditBlock] = React.useState<{ sessionId: string; index: number } | null>(null);
  const [tab, setTab] = React.useState<'sessions' | 'settings'>('sessions');
  const [showPicker, setShowPicker] = React.useState<string | null>(null); // sessionId`;
page = page.replace(OLD_STATES, NEW_STATES);

// 4. Replace addBlock function
const OLD_ADDBLOCK = `  const addBlock = (sid: string, kind: ProgramBlockTemplate['kind']) => update(p => ({
    ...p, sessions: p.sessions.map(s => {
      if (s.id !== sid) return s;
      const b: ProgramBlockTemplate = kind === 'exercise'
        ? { kind: 'exercise', name: 'Új gyakorlat', targetSets: 3, targetReps: '8-12' }
        : kind === 'drill' ? { kind: 'drill', name: 'Új drill', durationSec: 300 }
        : { kind: 'interval', name: 'Új intervall', rounds: 6, workSec: 30, restSec: 30 };
      return { ...s, blocks: [...s.blocks, b] };
    })
  }));`;
const NEW_ADDBLOCK = `  const addBlock = (sid: string, kind: ProgramBlockTemplate['kind'], name?: string) => update(p => ({
    ...p, sessions: p.sessions.map(s => {
      if (s.id !== sid) return s;
      const b: ProgramBlockTemplate = kind === 'exercise'
        ? { kind: 'exercise', name: name ?? 'Új gyakorlat', targetSets: 3, targetReps: '8-12' }
        : kind === 'drill' ? { kind: 'drill', name: name ?? 'Új drill', durationSec: 300 }
        : { kind: 'interval', name: name ?? 'Új intervall', rounds: 6, workSec: 30, restSec: 30 };
      return { ...s, blocks: [...s.blocks, b] };
    })
  }));`;
page = page.replace(OLD_ADDBLOCK, NEW_ADDBLOCK);

// 5. Replace "exercise" button in builder to open picker
const OLD_EXERCISE_BTN = `                {/* + Blokk gombok */}
                <div className="grid grid-cols-3 gap-2 px-3 pb-4">
                  {(['exercise', 'drill', 'interval'] as const).map(k => (
                    <button key={k} onClick={() => addBlock(activeSession.id, k)}
                      className="rounded-2xl py-3 text-xs font-bold pressable"
                      style={{ background:"var(--surface-1)", color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                      {k === 'exercise' ? '+ Gyakorlat' : k === 'drill' ? '+ Drill' : '+ Intervall'}
                    </button>
                  ))}
                </div>`;
const NEW_EXERCISE_BTN = `                {/* + Blokk gombok */}
                <div className="grid grid-cols-3 gap-2 px-3 pb-4">
                  <button onClick={() => setShowPicker(activeSession.id)}
                    className="rounded-2xl py-3 text-xs font-bold pressable"
                    style={{ background:"var(--surface-1)", color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                    + Gyakorlat
                  </button>
                  <button onClick={() => addBlock(activeSession.id, 'drill')}
                    className="rounded-2xl py-3 text-xs font-bold pressable"
                    style={{ background:"var(--surface-1)", color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                    + Drill
                  </button>
                  <button onClick={() => addBlock(activeSession.id, 'interval')}
                    className="rounded-2xl py-3 text-xs font-bold pressable"
                    style={{ background:"var(--surface-1)", color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                    + Intervall
                  </button>
                </div>`;
page = page.replace(OLD_EXERCISE_BTN, NEW_EXERCISE_BTN);

// 6. Add ExercisePickerSheet render before BottomNav
const OLD_BOTTOMNAV = `      {/* Block szerkesztő modal */}`;
const NEW_BOTTOMNAV = `      {/* Gyakorlat kereső sheet */}
      {showPicker && (
        <ExercisePickerSheet
          onPick={name => { addBlock(showPicker, 'exercise', name); setShowPicker(null); }}
          onCustom={() => { addBlock(showPicker, 'exercise'); setShowPicker(null); }}
          onClose={() => setShowPicker(null)} />
      )}

      {/* Block szerkesztő modal */}`;
page = page.replace(OLD_BOTTOMNAV, NEW_BOTTOMNAV);

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/programs/[programId]/page.tsx', page, 'utf8');
console.log('builder fixed, lines:', page.split('\n').length);
