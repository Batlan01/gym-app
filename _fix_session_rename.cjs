// fix_session_rename.cjs
const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/programs/[programId]/page.tsx', 'utf8');

// 1. Add renamingId state
s = s.replace(
  `  const [showPicker, setShowPicker] = React.useState<string | null>(null); // sessionId`,
  `  const [showPicker, setShowPicker] = React.useState<string | null>(null); // sessionId
  const [renamingId, setRenamingId] = React.useState<string | null>(null);`
);

// 2. Replace session tab buttons: dupla katt → rename inline input
const OLD_TAB_BTN = `                {program.sessions.map(s => (
                  <button key={s.id} onClick={() => setActiveSessionId(s.id)}
                    className="shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold pressable transition-all"
                    style={activeSessionId === s.id
                      ? { background: 'var(--accent-primary)', color: '#000' }
                      : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                    {s.name}
                  </button>
                ))}`;

const NEW_TAB_BTN = `                {program.sessions.map(s => (
                  renamingId === s.id ? (
                    <input key={s.id}
                      autoFocus
                      defaultValue={s.name}
                      onBlur={e => {
                        const val = e.target.value.trim();
                        if (val) update(p => ({ ...p, sessions: p.sessions.map(ss =>
                          ss.id === s.id ? { ...ss, name: val } : ss) }));
                        setRenamingId(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      className="shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold outline-none"
                      style={{ background: 'var(--accent-primary)', color: '#000', minWidth: 80, maxWidth: 160 }} />
                  ) : (
                    <button key={s.id}
                      onClick={() => setActiveSessionId(s.id)}
                      onDoubleClick={() => { setActiveSessionId(s.id); setRenamingId(s.id); }}
                      className="shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold pressable transition-all"
                      style={activeSessionId === s.id
                        ? { background: 'var(--accent-primary)', color: '#000' }
                        : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                      {s.name}
                      {activeSessionId === s.id && (
                        <span className="ml-1.5 opacity-50" style={{ fontSize: 10 }}>✎</span>
                      )}
                    </button>
                  )
                ))}`;

s = s.replace(OLD_TAB_BTN, NEW_TAB_BTN);

// 3. Fejléc input szebb — tooltip hint
const OLD_HDR_INPUT = `                    <input value={activeSession.name}
                      onChange={e => update(p => ({ ...p, sessions: p.sessions.map(s =>
                        s.id === activeSession.id ? { ...s, name: e.target.value } : s) }))}
                      className="text-base font-bold bg-transparent outline-none border-b border-transparent focus:border-white/20 transition-all"
                      style={{ color: 'var(--text-primary)' }} />`;

const NEW_HDR_INPUT = `                    <div className="flex items-center gap-1.5">
                      <input value={activeSession.name}
                        onChange={e => update(p => ({ ...p, sessions: p.sessions.map(s =>
                          s.id === activeSession.id ? { ...s, name: e.target.value } : s) }))}
                        placeholder="Session neve…"
                        className="text-base font-bold bg-transparent outline-none border-b-2 border-transparent focus:border-cyan-400/40 transition-all"
                        style={{ color: 'var(--text-primary)', minWidth: 120 }} />
                      <span className="text-xs opacity-40" style={{ color: 'var(--text-muted)' }}>✎</span>
                    </div>`;

s = s.replace(OLD_HDR_INPUT, NEW_HDR_INPUT);

// 4. Hint szöveg a tab sor fölé
const OLD_HINT = `            {/* Aktív session tartalma */}`;
const NEW_HINT = `            <div className="text-[10px] px-1 mb-1" style={{ color: 'var(--text-muted)' }}>
              Dupla kattintás a névváltáshoz
            </div>

            {/* Aktív session tartalma */}`;

s = s.replace(OLD_HINT, NEW_HINT);

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/programs/[programId]/page.tsx', s, 'utf8');
console.log('session rename fixed, lines:', s.split('\n').length);
