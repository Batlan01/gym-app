// app/programs/[programId]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";
import type { UserProgram, ProgramSessionTemplate, ProgramBlockTemplate, SportTag } from "@/lib/programsTypes";
import { readPrograms, upsertProgram, deleteProgram } from "@/lib/programsStorage";
import { sportLabel } from "@/lib/programTemplates";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID() : String(Date.now() + Math.random());
}

const SPORT_ICONS: Record<string, string> = {
  gym: '🏋️', home: '🏠', running: '🏃', boxing: '🥊', mobility: '🧘', hybrid: '⚡',
};
const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Kezdő', intermediate: 'Középhaladó', advanced: 'Haladó',
};
const LEVEL_COLOR: Record<string, string> = {
  beginner: 'rgba(74,222,128,0.15)', intermediate: 'rgba(34,211,238,0.15)', advanced: 'rgba(251,191,36,0.15)',
};
const LEVEL_TEXT: Record<string, string> = {
  beginner: '#4ade80', intermediate: '#22d3ee', advanced: '#fbbf24',
};

function fmt(sec: number) {
  if (sec >= 3600) return `${Math.floor(sec / 3600)}ó ${Math.floor((sec % 3600) / 60)}p`;
  if (sec >= 60) return `${Math.floor(sec / 60)}p`;
  return `${sec}mp`;
}

// ── Block kártya (readonly nézet) ────────────────────────────
function BlockCard({ b, index, onEdit, onRemove }: {
  b: ProgramBlockTemplate; index: number;
  onEdit: () => void; onRemove: () => void;
}) {
  const kindLabel = b.kind === 'exercise' ? 'Gyakorlat' : b.kind === 'drill' ? 'Drill' : 'Intervall';
  const kindColor = b.kind === 'exercise' ? '#22d3ee' : b.kind === 'drill' ? '#4ade80' : '#fbbf24';

  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Bal: szám + szín */}
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-black"
        style={{ background: `${kindColor}20`, color: kindColor }}>
        {index + 1}
      </div>
      {/* Közép: adatok */}
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{b.name}</div>
        <div className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          {b.kind === 'exercise' && `${b.targetSets ?? '?'} × ${b.targetReps ?? '?'} reps`}
          {b.kind === 'drill' && fmt(b.durationSec ?? 0)}
          {b.kind === 'interval' && `${b.rounds ?? '?'} kör · ${fmt(b.workSec ?? 0)} / ${fmt(b.restSec ?? 0)}`}
          {b.notes && <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}> · {b.notes}</span>}
        </div>
      </div>
      {/* Jobb: szerkeszt + töröl */}
      <div className="flex gap-1.5 shrink-0">
        <button onClick={onEdit}
          className="grid h-8 w-8 place-items-center rounded-xl text-xs pressable"
          style={{ background: 'rgba(34,211,238,0.08)', color: 'var(--accent-primary)', border: '1px solid rgba(34,211,238,0.15)' }}>
          ✎
        </button>
        <button onClick={onRemove}
          className="grid h-8 w-8 place-items-center rounded-xl text-xs pressable"
          style={{ background: 'rgba(239,68,68,0.07)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.15)' }}>
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Block szerkesztő modal ───────────────────────────────────
function BlockEditModal({ b, onSave, onClose }: {
  b: ProgramBlockTemplate; onSave: (patch: Partial<ProgramBlockTemplate>) => void; onClose: () => void;
}) {
  const [name, setName] = React.useState(b.name);
  const [sets, setSets] = React.useState(b.kind === 'exercise' ? String(b.targetSets ?? 3) : '');
  const [reps, setReps] = React.useState(b.kind === 'exercise' ? String(b.targetReps ?? '8-12') : '');
  const [dur, setDur] = React.useState(b.kind === 'drill' ? String(b.durationSec ?? 0) : '');
  const [rounds, setRounds] = React.useState(b.kind === 'interval' ? String(b.rounds ?? 6) : '');
  const [work, setWork] = React.useState(b.kind === 'interval' ? String(b.workSec ?? 30) : '');
  const [rest, setRest] = React.useState(b.kind === 'interval' ? String(b.restSec ?? 30) : '');
  const [notes, setNotes] = React.useState(b.notes ?? '');

  function handleSave() {
    const base = { name, notes: notes || undefined };
    if (b.kind === 'exercise') onSave({ ...base, targetSets: Number(sets), targetReps: reps });
    else if (b.kind === 'drill') onSave({ ...base, durationSec: Number(dur) });
    else onSave({ ...base, rounds: Number(rounds), workSec: Number(work), restSec: Number(rest) });
    onClose();
  }

  const inp = "w-full rounded-2xl px-4 py-3 text-sm outline-none transition";
  const inpStyle = { background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' };

  return (
    <div className="fixed inset-0 z-[70]">
      <button className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="rounded-t-[2rem] p-5 shadow-2xl"
          style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-mid)' }}>
          <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: 'var(--border-mid)' }} />
          <div className="mb-4 text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {b.kind === 'exercise' ? '🏋️' : b.kind === 'drill' ? '⚡' : '🔄'} Szerkesztés
          </div>
          <div className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Név" className={inp} style={inpStyle} />
            {b.kind === 'exercise' && (
              <div className="grid grid-cols-2 gap-3">
                <input value={sets} onChange={e => setSets(e.target.value)} placeholder="Szett (pl. 3)" className={inp} style={inpStyle} inputMode="numeric" />
                <input value={reps} onChange={e => setReps(e.target.value)} placeholder="Reps (pl. 8-12)" className={inp} style={inpStyle} />
              </div>
            )}
            {b.kind === 'drill' && (
              <input value={dur} onChange={e => setDur(e.target.value)} placeholder="Időtartam (mp)" className={inp} style={inpStyle} inputMode="numeric" />
            )}
            {b.kind === 'interval' && (
              <div className="grid grid-cols-3 gap-2">
                <input value={rounds} onChange={e => setRounds(e.target.value)} placeholder="Kör" className={inp} style={inpStyle} inputMode="numeric" />
                <input value={work} onChange={e => setWork(e.target.value)} placeholder="Work mp" className={inp} style={inpStyle} inputMode="numeric" />
                <input value={rest} onChange={e => setRest(e.target.value)} placeholder="Rest mp" className={inp} style={inpStyle} inputMode="numeric" />
              </div>
            )}
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Megjegyzés (opcionális)" className={inp} style={inpStyle} />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-2xl py-3 text-sm pressable"
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
              Mégse
            </button>
            <button onClick={handleSave} className="flex-1 rounded-2xl py-3 text-sm font-bold pressable"
              style={{ background: 'rgba(34,211,238,0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(34,211,238,0.3)' }}>
              Mentés ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Főkomponens ──────────────────────────────────────────────
export default function ProgramBuilderPage() {
  const router = useRouter();
  const params = useParams<{ programId: string }>();
  const programId = params?.programId ?? "";
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  const [program, setProgram] = React.useState<UserProgram | null>(null);
  const [hydrated, setHydrated] = React.useState(false);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  const [savedPing, setSavedPing] = React.useState(0);
  const [editBlock, setEditBlock] = React.useState<{ sessionId: string; index: number } | null>(null);
  const [tab, setTab] = React.useState<'sessions' | 'settings'>('sessions');

  React.useEffect(() => {
    if (!activeProfileId || !programId) return;
    const p = readPrograms(activeProfileId).find(x => x.id === programId) ?? null;
    setProgram(p);
    setActiveSessionId(p?.sessions?.[0]?.id ?? null);
    setHydrated(true);
  }, [activeProfileId, programId]);

  const persist = React.useCallback((next: UserProgram) => {
    if (!activeProfileId) return;
    upsertProgram(activeProfileId, next);
    setSavedPing(x => x + 1);
  }, [activeProfileId]);

  const update = React.useCallback((fn: (p: UserProgram) => UserProgram) => {
    setProgram(prev => {
      if (!prev) return prev;
      const next = { ...fn(prev), updatedAt: Date.now() };
      persist(next);
      return next;
    });
  }, [persist]);

  const addSession = () => update(p => {
    const s: ProgramSessionTemplate = { id: uid(), name: `Session ${p.sessions.length + 1}`, blocks: [] };
    setTimeout(() => setActiveSessionId(s.id), 0);
    return { ...p, sessions: [...p.sessions, s] };
  });

  const removeSession = (sid: string) => update(p => {
    const next = p.sessions.filter(s => s.id !== sid);
    setTimeout(() => setActiveSessionId(c => c === sid ? (next[0]?.id ?? null) : c), 0);
    return { ...p, sessions: next };
  });

  const addBlock = (sid: string, kind: ProgramBlockTemplate['kind']) => update(p => ({
    ...p, sessions: p.sessions.map(s => {
      if (s.id !== sid) return s;
      const b: ProgramBlockTemplate = kind === 'exercise'
        ? { kind: 'exercise', name: 'Új gyakorlat', targetSets: 3, targetReps: '8-12' }
        : kind === 'drill' ? { kind: 'drill', name: 'Új drill', durationSec: 300 }
        : { kind: 'interval', name: 'Új intervall', rounds: 6, workSec: 30, restSec: 30 };
      return { ...s, blocks: [...s.blocks, b] };
    })
  }));

  const patchBlock = (sid: string, idx: number, patch: Partial<ProgramBlockTemplate>) => update(p => ({
    ...p, sessions: p.sessions.map(s =>
      s.id !== sid ? s : { ...s, blocks: s.blocks.map((b, i) => i === idx ? { ...b, ...patch } as any : b) }
    )
  }));

  const removeBlock = (sid: string, idx: number) => update(p => ({
    ...p, sessions: p.sessions.map(s =>
      s.id !== sid ? s : { ...s, blocks: s.blocks.filter((_, i) => i !== idx) }
    )
  }));

  const activeSession = program?.sessions.find(s => s.id === activeSessionId) ?? null;

  if (!hydrated) return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Betöltés…</div>
    </div>
  );

  if (!program) return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
      <div className="text-4xl">🔍</div>
      <div className="text-base font-bold text-center" style={{ color: 'var(--text-primary)' }}>Program nem található</div>
      <button onClick={() => router.replace('/programs')} className="rounded-2xl px-6 py-3 text-sm font-bold pressable"
        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
        Vissza a programokra
      </button>
    </div>
  );

  const totalBlocks = program.sessions.reduce((a, s) => a + s.blocks.length, 0);

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
      <div className="flex-1 pb-32 animate-in">

        {/* ── Hero fejléc ── */}
        <div className="relative overflow-hidden px-4 pt-12 pb-6"
          style={{ background: 'linear-gradient(160deg, rgba(34,211,238,0.1) 0%, transparent 60%)' }}>
          <div className="pointer-events-none absolute right-4 top-4 text-7xl opacity-15">
            {SPORT_ICONS[program.sport] ?? '🏋️'}
          </div>
          {/* Vissza gomb */}
          <button onClick={() => router.push('/programs')}
            className="mb-4 flex items-center gap-1.5 text-sm pressable"
            style={{ color: 'var(--text-muted)' }}>
            ← Katalógus
          </button>
          {/* Badges */}
          <div className="flex gap-2 mb-3">
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: LEVEL_COLOR[program.level], color: LEVEL_TEXT[program.level] }}>
              {LEVEL_LABEL[program.level]}
            </span>
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)' }}>
              {sportLabel(program.sport)}
            </span>
          </div>
          <h1 className="text-2xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
            {program.name}
          </h1>
          {/* Stat sor */}
          <div className="mt-3 flex gap-4">
            {[
              { label: 'Session', value: program.sessions.length },
              { label: 'Gyakorlat', value: totalBlocks },
            ].map(s => (
              <div key={s.label}>
                <div className="text-xl font-black" style={{ color: 'var(--accent-primary)' }}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
            {savedPing > 0 && (
              <div className="ml-auto self-end text-xs" style={{ color: 'var(--accent-green)' }}>✓ Mentve</div>
            )}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="sticky top-0 z-40 flex gap-1 px-4 py-2"
          style={{ background: 'rgba(8,11,15,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-subtle)' }}>
          {(['sessions', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 rounded-xl py-2.5 text-xs font-bold transition-all pressable"
              style={tab === t
                ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)' }
                : { color: 'var(--text-muted)' }}>
              {t === 'sessions' ? `📋 Sessionök (${program.sessions.length})` : '⚙️ Beállítások'}
            </button>
          ))}
        </div>

        {/* ── SESSIONS TAB ── */}
        {tab === 'sessions' && (
          <div className="px-4 py-4 space-y-3">
            {/* Session tab-ok */}
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
              <div className="flex gap-2 pb-1">
                {program.sessions.map(s => (
                  <button key={s.id} onClick={() => setActiveSessionId(s.id)}
                    className="shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold pressable transition-all"
                    style={activeSessionId === s.id
                      ? { background: 'var(--accent-primary)', color: '#000' }
                      : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                    {s.name}
                  </button>
                ))}
                <button onClick={addSession}
                  className="shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold pressable"
                  style={{ background: 'rgba(34,211,238,0.08)', color: 'var(--accent-primary)', border: '1px dashed rgba(34,211,238,0.3)' }}>
                  + Session
                </button>
              </div>
            </div>

            {/* Aktív session tartalma */}
            {activeSession && (
              <div className="rounded-3xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                {/* Session fejléc */}
                <div className="flex items-center justify-between px-4 py-4"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                      AKTÍV SESSION
                    </div>
                    <input value={activeSession.name}
                      onChange={e => update(p => ({ ...p, sessions: p.sessions.map(s =>
                        s.id === activeSession.id ? { ...s, name: e.target.value } : s) }))}
                      className="text-base font-bold bg-transparent outline-none border-b border-transparent focus:border-white/20 transition-all"
                      style={{ color: 'var(--text-primary)' }} />
                  </div>
                  <button onClick={() => removeSession(activeSession.id)}
                    className="rounded-xl px-3 py-2 text-xs pressable"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.15)' }}>
                    Törlés
                  </button>
                </div>

                {/* Blokk lista */}
                <div className="px-3 py-3 space-y-2">
                  {activeSession.blocks.length === 0 ? (
                    <div className="rounded-2xl py-8 text-center text-sm"
                      style={{ color: 'var(--text-muted)', border: '1px dashed var(--border-mid)' }}>
                      Még nincs elem. Adj hozzá alul!
                    </div>
                  ) : activeSession.blocks.map((b, i) => (
                    <BlockCard key={i} b={b} index={i}
                      onEdit={() => setEditBlock({ sessionId: activeSession.id, index: i })}
                      onRemove={() => removeBlock(activeSession.id, i)} />
                  ))}
                </div>

                {/* + Blokk gombok */}
                <div className="grid grid-cols-3 gap-2 px-3 pb-4">
                  {(['exercise', 'drill', 'interval'] as const).map(k => (
                    <button key={k} onClick={() => addBlock(activeSession.id, k)}
                      className="rounded-2xl py-3 text-xs font-bold pressable"
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                      {k === 'exercise' ? '+ Gyakorlat' : k === 'drill' ? '+ Drill' : '+ Intervall'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className="px-4 py-4 space-y-3">
            <div className="rounded-3xl p-4 space-y-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <label className="label-xs block mb-1.5">PROGRAM NEVE</label>
                <input value={program.name}
                  onChange={e => update(p => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-xs block mb-1.5">SPORT</label>
                  <select value={program.sport}
                    onChange={e => update(p => ({ ...p, sport: e.target.value as SportTag }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                    {(['gym','home','running','boxing','mobility','hybrid'] as SportTag[]).map(s => (
                      <option key={s} value={s}>{sportLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-xs block mb-1.5">SZINT</label>
                  <select value={program.level}
                    onChange={e => update(p => ({ ...p, level: e.target.value as any }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                    <option value="beginner">Kezdő</option>
                    <option value="intermediate">Közép</option>
                    <option value="advanced">Haladó</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label-xs block mb-1.5">MEGJEGYZÉS</label>
                <textarea value={program.notes ?? ''} rows={3}
                  onChange={e => update(p => ({ ...p, notes: e.target.value || undefined }))}
                  placeholder="Cél, preferenciák, sérülések…"
                  className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            {/* Veszély zóna */}
            <div className="rounded-3xl p-4"
              style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="label-xs mb-3" style={{ color: '#fca5a5' }}>VESZÉLY ZÓNA</div>
              <button onClick={() => {
                  if (!activeProfileId) return;
                  if (!window.confirm('Biztosan törlöd ezt a programot?')) return;
                  deleteProgram(activeProfileId, programId);
                  router.replace('/programs');
                }}
                className="w-full rounded-2xl py-3 text-sm font-bold pressable"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                Program törlése
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Block szerkesztő modal */}
      {editBlock && activeSession && (() => {
        const b = program.sessions.find(s => s.id === editBlock.sessionId)?.blocks[editBlock.index];
        if (!b) return null;
        return (
          <BlockEditModal b={b}
            onSave={patch => patchBlock(editBlock.sessionId, editBlock.index, patch)}
            onClose={() => setEditBlock(null)} />
        );
      })()}

      <BottomNav />
    </div>
  );
}
