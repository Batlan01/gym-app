// app/coach/programs/[programId]/page.tsx
"use client";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ALL_EXERCISE_GROUPS } from "@/lib/exerciseGroups";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// ── Típusok ──────────────────────────────────────────────────
interface CoachBlock {
  id: string;
  kind: "exercise" | "drill" | "interval";
  name: string;
  targetSets?: number;
  targetReps?: string;
  durationSec?: number;
  rounds?: number;
  workSec?: number;
  restSec?: number;
  notes?: string;
}
interface CoachSession {
  id: string;
  name: string;
  blocks: CoachBlock[];
}
interface CoachProgram {
  id: string;
  name: string;
  category: string;
  level: string;
  sessions: CoachSession[];
  customExercises?: string[];
  updatedAt?: number;
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID() : String(Date.now() + Math.random());
}

// ── Auth token helper ────────────────────────────────────────
async function getToken(): Promise<string> {
  const auth = getAuth();
  if (auth.currentUser) return auth.currentUser.getIdToken();
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) user.getIdToken().then(resolve).catch(reject);
      else reject(new Error("Not authenticated"));
    });
  });
}

// ── Stílus konstansok ─────────────────────────────────────────
const LEVEL_LABEL: Record<string, string> = { beginner:"Kezdő", intermediate:"Középhaladó", advanced:"Haladó" };
const KIND_COLOR: Record<string, string> = { exercise:"#22d3ee", drill:"#4ade80", interval:"#fbbf24" };
const KIND_LABEL: Record<string, string> = { exercise:"Gyakorlat", drill:"Drill", interval:"Intervall" };
const KIND_ICON: Record<string, string>  = { exercise:"🏋️", drill:"⚡", interval:"🔄" };

function fmt(sec: number) {
  if (sec >= 3600) return `${Math.floor(sec/3600)}ó ${Math.floor((sec%3600)/60)}p`;
  if (sec >= 60) return `${Math.floor(sec/60)}p`;
  return `${sec}mp`;
}

// ── Block kártya ─────────────────────────────────────────────
function BlockCard({ b, index, onEdit, onRemove }: {
  b: CoachBlock; index: number; onEdit: () => void; onRemove: () => void;
}) {
  const col = KIND_COLOR[b.kind] ?? "#22d3ee";
  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-3"
      style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)" }}>
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-black"
        style={{ background:`${col}20`, color:col }}>{index+1}</div>
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold" style={{ color:"var(--text-primary)" }}>{b.name}</div>
        <div className="mt-0.5 text-xs" style={{ color:"var(--text-muted)" }}>
          {b.kind==="exercise" && `${b.targetSets??'?'} × ${b.targetReps??'?'} reps`}
          {b.kind==="drill"    && fmt(b.durationSec??0)}
          {b.kind==="interval" && `${b.rounds??'?'} kör · ${fmt(b.workSec??0)} / ${fmt(b.restSec??0)}`}
          {b.notes && <span style={{ opacity:0.7 }}> · {b.notes}</span>}
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button onClick={onEdit} className="grid h-8 w-8 place-items-center rounded-xl pressable"
          style={{ background:"rgba(34,211,238,0.08)", color:"var(--accent-primary)", border:"1px solid rgba(34,211,238,0.15)" }}>✎</button>
        <button onClick={onRemove} className="grid h-8 w-8 place-items-center rounded-xl pressable"
          style={{ background:"rgba(239,68,68,0.07)", color:"#fca5a5", border:"1px solid rgba(239,68,68,0.15)" }}>✕</button>
      </div>
    </div>
  );
}

// ── Block szerkesztő modal ───────────────────────────────────
function BlockEditModal({ b, onSave, onClose }: {
  b: CoachBlock; onSave: (patch: Partial<CoachBlock>) => void; onClose: () => void;
}) {
  const [name,   setName]   = React.useState(b.name);
  const [sets,   setSets]   = React.useState(String(b.targetSets ?? 3));
  const [reps,   setReps]   = React.useState(b.targetReps ?? "8-12");
  const [dur,    setDur]    = React.useState(String(b.durationSec ?? 60));
  const [rounds, setRounds] = React.useState(String(b.rounds ?? 6));
  const [work,   setWork]   = React.useState(String(b.workSec ?? 30));
  const [rest,   setRest]   = React.useState(String(b.restSec ?? 30));
  const [notes,  setNotes]  = React.useState(b.notes ?? "");

  function handleSave() {
    const base = { name, notes: notes||undefined };
    if (b.kind==="exercise") onSave({ ...base, targetSets:Number(sets), targetReps:reps });
    else if (b.kind==="drill") onSave({ ...base, durationSec:Number(dur) });
    else onSave({ ...base, rounds:Number(rounds), workSec:Number(work), restSec:Number(rest) });
    onClose();
  }
  const inp = "w-full rounded-2xl px-4 py-3 text-sm outline-none";
  const inpStyle = { background:"rgba(0,0,0,0.3)", border:"1px solid var(--border-subtle)", color:"var(--text-primary)" };
  return (
    <div className="fixed inset-0 z-[70]">
      <button className="absolute inset-0" style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)" }} onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md" style={{ paddingBottom:"env(safe-area-inset-bottom)" }}>
        <div className="rounded-t-[2rem] p-5 shadow-2xl" style={{ background:"var(--bg-elevated)", borderTop:"1px solid var(--border-mid)" }}>
          <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background:"var(--border-mid)" }} />
          <div className="mb-4 text-base font-bold" style={{ color:"var(--text-primary)" }}>{KIND_ICON[b.kind]} Szerkesztés</div>
          <div className="space-y-3">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Név" className={inp} style={inpStyle} />
            {b.kind==="exercise" && <div className="grid grid-cols-2 gap-3">
              <input value={sets} onChange={e=>setSets(e.target.value)} placeholder="Szett" className={inp} style={inpStyle} inputMode="numeric"/>
              <input value={reps} onChange={e=>setReps(e.target.value)} placeholder="Reps" className={inp} style={inpStyle}/>
            </div>}
            {b.kind==="drill" && <input value={dur} onChange={e=>setDur(e.target.value)} placeholder="Időtartam (mp)" className={inp} style={inpStyle} inputMode="numeric"/>}
            {b.kind==="interval" && <div className="grid grid-cols-3 gap-2">
              <input value={rounds} onChange={e=>setRounds(e.target.value)} placeholder="Kör" className={inp} style={inpStyle} inputMode="numeric"/>
              <input value={work}   onChange={e=>setWork(e.target.value)}   placeholder="Work mp" className={inp} style={inpStyle} inputMode="numeric"/>
              <input value={rest}   onChange={e=>setRest(e.target.value)}   placeholder="Rest mp" className={inp} style={inpStyle} inputMode="numeric"/>
            </div>}
            <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Megjegyzés (opcionális)" className={inp} style={inpStyle}/>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-2xl py-3 text-sm pressable"
              style={{ background:"var(--bg-card)", color:"var(--text-muted)", border:"1px solid var(--border-subtle)" }}>Mégse</button>
            <button onClick={handleSave} className="flex-1 rounded-2xl py-3 text-sm font-bold pressable"
              style={{ background:"rgba(34,211,238,0.15)", color:"var(--accent-primary)", border:"1px solid rgba(34,211,238,0.3)" }}>Mentés ✓</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Egyéni gyakorlat létrehozó modal ─────────────────────────
function NewExerciseModal({ onSave, onClose }: {
  onSave: (name: string) => void; onClose: () => void;
}) {
  const [name, setName] = React.useState("");
  return (
    <div className="fixed inset-0 z-[80]">
      <button className="absolute inset-0" style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)" }} onClick={onClose}/>
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md" style={{ paddingBottom:"env(safe-area-inset-bottom)" }}>
        <div className="rounded-t-[2rem] p-5 shadow-2xl" style={{ background:"var(--bg-elevated)", borderTop:"1px solid var(--border-mid)" }}>
          <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background:"var(--border-mid)" }}/>
          <div className="mb-4 text-base font-bold" style={{ color:"var(--text-primary)" }}>✏️ Egyéni gyakorlat</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Gyakorlat neve…" autoFocus
            className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
            style={{ background:"rgba(0,0,0,0.3)", border:"1px solid var(--border-subtle)", color:"var(--text-primary)" }}
            onKeyDown={e=>{ if(e.key==="Enter"&&name.trim()) { onSave(name.trim()); onClose(); }}}/>
          <div className="mt-4 flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-2xl py-3 text-sm pressable"
              style={{ background:"var(--bg-card)", color:"var(--text-muted)", border:"1px solid var(--border-subtle)" }}>Mégse</button>
            <button onClick={()=>{ if(name.trim()){ onSave(name.trim()); onClose(); }}}
              className="flex-1 rounded-2xl py-3 text-sm font-bold pressable"
              style={{ background:"rgba(34,211,238,0.15)", color:"var(--accent-primary)", border:"1px solid rgba(34,211,238,0.3)" }}>Létrehozás ✓</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Gyakorlat picker sheet ────────────────────────────────────
function ExercisePickerSheet({ customExercises, onPick, onClose, onNewExercise }: {
  customExercises: string[];
  onPick: (name: string) => void;
  onClose: () => void;
  onNewExercise: (name: string) => void;
}) {
  const [q, setQ] = React.useState("");
  const [showNewEx, setShowNewEx] = React.useState(false);

  const allGroups = React.useMemo(() => {
    const groups = [...ALL_EXERCISE_GROUPS];
    if (customExercises.length > 0) {
      groups.unshift({ name:"Saját gyakorlatok", emoji:"⭐", exercises: customExercises });
    }
    return groups;
  }, [customExercises]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return allGroups;
    return allGroups.map(g => ({ ...g, exercises: g.exercises.filter(e=>e.toLowerCase().includes(qq)) }))
      .filter(g=>g.exercises.length>0);
  }, [q, allGroups]);

  return (
    <>
      {showNewEx && <NewExerciseModal onSave={name=>{ onNewExercise(name); onPick(name); setShowNewEx(false); }} onClose={()=>setShowNewEx(false)}/>}
      <div className="fixed inset-0 z-[60] flex items-end" style={{ background:"rgba(0,0,0,0.7)" }}
        onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
        <div className="w-full rounded-t-3xl flex flex-col animate-in slide-in-from-bottom"
          style={{ background:"var(--bg-elevated)", maxHeight:"88dvh" }}>
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="h-1 w-10 rounded-full" style={{ background:"var(--surface-3)" }}/>
          </div>
          <div className="px-5 pb-3 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black" style={{ color:"var(--text-primary)" }}>Gyakorlat hozzáadása</h2>
              <button onClick={onClose} className="pressable text-sm" style={{ color:"var(--text-muted)" }}>✕</button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color:"var(--text-muted)" }}>🔍</span>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Keresés…" autoFocus
                className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm outline-none"
                style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)", color:"var(--text-primary)" }}/>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <button onClick={()=>setShowNewEx(true)}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 mb-4 pressable"
              style={{ background:"rgba(34,211,238,0.07)", border:"1px dashed rgba(34,211,238,0.3)" }}>
              <span className="text-lg">✏️</span>
              <div className="text-left">
                <div className="text-sm font-bold" style={{ color:"var(--accent-primary)" }}>Új saját gyakorlat</div>
                <div className="text-xs" style={{ color:"var(--text-muted)" }}>Mentve marad a programhoz</div>
              </div>
            </button>
            {filtered.map(group=>(
              <div key={group.name} className="mb-4">
                <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color:"var(--text-muted)" }}>
                  {group.emoji} {group.name}
                </div>
                <div className="space-y-1.5">
                  {group.exercises.map(ex=>(
                    <button key={ex} onClick={()=>onPick(ex)}
                      className="w-full text-left rounded-xl px-4 py-2.5 text-sm pressable"
                      style={{ background:"var(--surface-1)", color:"var(--text-primary)", border:"1px solid var(--border-subtle)" }}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length===0 && <div className="text-center py-8 text-sm" style={{ color:"var(--text-muted)" }}>Nincs találat</div>}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Főkomponens ──────────────────────────────────────────────
export default function CoachProgramBuilderPage() {
  const router = useRouter();
  const params = useParams<{ programId: string }>();
  const programId = params?.programId ?? "";

  const [program, setProgram]         = React.useState<CoachProgram | null>(null);
  const [loading, setLoading]         = React.useState(true);
  const [saving,  setSaving]          = React.useState(false);
  const [savedPing, setSavedPing]     = React.useState(0);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  const [editBlock, setEditBlock]     = React.useState<{ sid: string; idx: number } | null>(null);
  const [showPicker, setShowPicker]   = React.useState<string | null>(null); // sessionId
  const [renamingSid, setRenamingSid] = React.useState<string | null>(null);
  const [tab, setTab]                 = React.useState<"sessions"|"settings">("sessions");

  // ── Betöltés ─────────────────────────────────────────────
  React.useEffect(() => {
    if (!programId) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/coach/programs/${programId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        const p = data.program as CoachProgram;
        // sessions lehet string-ként jön Firestore-ból, parse-oljuk
        if (typeof p.sessions === "string") {
          try { p.sessions = JSON.parse(p.sessions as unknown as string); } catch { p.sessions = []; }
        }
        if (!Array.isArray(p.sessions)) p.sessions = [];
        if (!Array.isArray(p.customExercises)) p.customExercises = [];
        setProgram(p);
        setActiveSessionId(p.sessions[0]?.id ?? null);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [programId]);

  // ── Mentés Firestore-ba (debounced) ──────────────────────
  const saveTimeout = React.useRef<ReturnType<typeof setTimeout>|null>(null);
  const persist = React.useCallback((next: CoachProgram) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      try {
        const token = await getToken();
        await fetch(`/api/coach/programs/${next.id}`, {
          method: "PATCH",
          headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
          body: JSON.stringify({
            name: next.name,
            sessions: next.sessions,
            customExercises: next.customExercises ?? [],
            level: next.level,
            category: next.category,
          }),
        });
        setSavedPing(x=>x+1);
      } catch(e) { console.error(e); }
      finally { setSaving(false); }
    }, 800);
  }, []);

  // ── State frissítő ───────────────────────────────────────
  const update = React.useCallback((fn: (p: CoachProgram) => CoachProgram) => {
    setProgram(prev => {
      if (!prev) return prev;
      const next = { ...fn(prev), updatedAt: Date.now() };
      persist(next);
      return next;
    });
  }, [persist]);

  const addSession = () => update(p => {
    const s: CoachSession = { id: uid(), name: `Session ${p.sessions.length+1}`, blocks: [] };
    setTimeout(() => setActiveSessionId(s.id), 0);
    return { ...p, sessions: [...p.sessions, s] };
  });
  const removeSession = (sid: string) => update(p => {
    const next = p.sessions.filter(s=>s.id!==sid);
    setTimeout(() => setActiveSessionId(c => c===sid ? (next[0]?.id??null) : c), 0);
    return { ...p, sessions: next };
  });
  const renameSession = (sid: string, name: string) => update(p => ({
    ...p, sessions: p.sessions.map(s => s.id===sid ? { ...s, name } : s)
  }));

  const addBlock = (sid: string, kind: CoachBlock["kind"], name?: string) => update(p => ({
    ...p, sessions: p.sessions.map(s => {
      if (s.id!==sid) return s;
      const b: CoachBlock = kind==="exercise"
        ? { id:uid(), kind:"exercise", name:name??"Új gyakorlat", targetSets:3, targetReps:"8-12" }
        : kind==="drill" ? { id:uid(), kind:"drill", name:name??"Új drill", durationSec:300 }
        : { id:uid(), kind:"interval", name:name??"Intervall", rounds:6, workSec:30, restSec:30 };
      return { ...s, blocks:[...s.blocks, b] };
    })
  }));
  const patchBlock = (sid: string, idx: number, patch: Partial<CoachBlock>) => update(p => ({
    ...p, sessions: p.sessions.map(s =>
      s.id!==sid ? s : { ...s, blocks: s.blocks.map((b,i) => i===idx ? { ...b, ...patch } : b) }
    )
  }));
  const removeBlock = (sid: string, idx: number) => update(p => ({
    ...p, sessions: p.sessions.map(s =>
      s.id!==sid ? s : { ...s, blocks: s.blocks.filter((_,i)=>i!==idx) }
    )
  }));
  const addCustomExercise = (name: string) => update(p => ({
    ...p, customExercises: [...(p.customExercises??[]).filter(e=>e!==name), name]
  }));

  const activeSession = program?.sessions.find(s=>s.id===activeSessionId) ?? null;

  // ── Loading / Not found ──────────────────────────────────
  if (loading) return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-sm animate-pulse" style={{ color:"var(--text-muted)" }}>Betöltés…</div>
    </div>
  );
  if (!program) return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <div className="text-4xl">🔍</div>
      <div className="text-base font-semibold" style={{ color:"var(--text-primary)" }}>Program nem található</div>
      <button onClick={()=>router.push("/coach")} className="rounded-2xl px-5 py-2.5 text-sm pressable"
        style={{ background:"var(--surface-1)", color:"var(--text-primary)", border:"1px solid var(--border-subtle)" }}>
        Vissza a Tervekhez
      </button>
    </div>
  );

  // ── UI ───────────────────────────────────────────────────
  return (
    <div className="flex min-h-dvh flex-col" style={{ background:"var(--bg-base)" }}>
      {/* Modals */}
      {showPicker && (
        <ExercisePickerSheet
          customExercises={program.customExercises??[]}
          onPick={name=>{ addBlock(showPicker,"exercise",name); setShowPicker(null); }}
          onClose={()=>setShowPicker(null)}
          onNewExercise={addCustomExercise}
        />
      )}
      {editBlock && activeSession && (() => {
        const b = program.sessions.find(s=>s.id===editBlock.sid)?.blocks[editBlock.idx];
        return b ? (
          <BlockEditModal b={b}
            onSave={patch=>patchBlock(editBlock.sid, editBlock.idx, patch)}
            onClose={()=>setEditBlock(null)}/>
        ) : null;
      })()}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 sticky top-0 z-30"
        style={{ background:"var(--bg-elevated)", borderBottom:"1px solid var(--border-subtle)", backdropFilter:"blur(12px)" }}>
        <button onClick={()=>router.push("/coach")} className="pressable grid h-9 w-9 place-items-center rounded-xl"
          style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)", color:"var(--text-primary)" }}>
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div className="truncate text-base font-black" style={{ color:"var(--text-primary)" }}>{program.name}</div>
          <div className="text-xs" style={{ color:"var(--text-muted)" }}>
            {LEVEL_LABEL[program.level]??program.level} · {program.category}
          </div>
        </div>
        <div className="text-xs px-2 py-1 rounded-lg" style={{ color: saving?"var(--text-muted)":"#4ade80",
          background: saving?"var(--surface-1)":"rgba(74,222,128,0.1)" }}>
          {saving ? "Mentés…" : savedPing>0 ? "✓ Mentve" : ""}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 px-4 pt-3 pb-0 shrink-0">
        {(["sessions","settings"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-semibold pressable transition-all"
            style={{
              background: tab===t ? "rgba(34,211,238,0.12)" : "transparent",
              color: tab===t ? "var(--accent-primary)" : "var(--text-muted)",
              border: tab===t ? "1px solid rgba(34,211,238,0.25)" : "1px solid transparent",
            }}>
            {t==="sessions" ? "📋 Sessionök" : "⚙️ Beállítások"}
          </button>
        ))}
      </div>

      {/* ── SESSIONS TAB ── */}
      {tab==="sessions" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Session tab scroll */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar shrink-0">
            {program.sessions.map(s=>(
              <button key={s.id} onClick={()=>setActiveSessionId(s.id)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold pressable whitespace-nowrap"
                style={{
                  background: activeSessionId===s.id ? "rgba(34,211,238,0.15)" : "var(--surface-1)",
                  color: activeSessionId===s.id ? "var(--accent-primary)" : "var(--text-secondary)",
                  border: activeSessionId===s.id ? "1px solid rgba(34,211,238,0.3)" : "1px solid var(--border-subtle)",
                }}>
                {s.name}
              </button>
            ))}
            <button onClick={addSession}
              className="shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold pressable whitespace-nowrap"
              style={{ background:"var(--surface-1)", color:"var(--text-muted)", border:"1px dashed var(--border-subtle)" }}>
              + Session
            </button>
          </div>

          {/* Session tartalom */}
          {activeSession ? (
            <div className="flex-1 overflow-y-auto px-4 pb-32">
              {/* Session fejléc */}
              <div className="flex items-center gap-2 mb-4 pt-1">
                {renamingSid===activeSession.id ? (
                  <input autoFocus defaultValue={activeSession.name}
                    className="flex-1 rounded-xl px-3 py-1.5 text-sm font-bold outline-none"
                    style={{ background:"var(--surface-1)", border:"1px solid var(--accent-primary)", color:"var(--text-primary)" }}
                    onBlur={e=>{ renameSession(activeSession.id, e.target.value); setRenamingSid(null); }}
                    onKeyDown={e=>{ if(e.key==="Enter"){ renameSession(activeSession.id,(e.target as HTMLInputElement).value); setRenamingSid(null); }}}/>
                ) : (
                  <button onClick={()=>setRenamingSid(activeSession.id)}
                    className="flex-1 text-left text-sm font-bold pressable px-1"
                    style={{ color:"var(--text-primary)" }}>
                    {activeSession.name} <span style={{ color:"var(--text-muted)", fontWeight:400 }}>✎</span>
                  </button>
                )}
                <button onClick={()=>removeSession(activeSession.id)}
                  className="text-xs px-2 py-1 rounded-lg pressable"
                  style={{ color:"#fca5a5", background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.15)" }}>
                  Törlés
                </button>
              </div>

              {/* Block lista */}
              <div className="space-y-2 mb-4">
                {activeSession.blocks.map((b,i)=>(
                  <BlockCard key={b.id??i} b={b} index={i}
                    onEdit={()=>setEditBlock({ sid:activeSession.id, idx:i })}
                    onRemove={()=>removeBlock(activeSession.id, i)}/>
                ))}
                {activeSession.blocks.length===0 && (
                  <div className="text-center py-8 text-sm" style={{ color:"var(--text-muted)" }}>
                    Még nincsenek blokkok ebben a sessionben
                  </div>
                )}
              </div>

              {/* Hozzáadás gombok */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button onClick={()=>setShowPicker(activeSession.id)}
                  className="flex flex-col items-center gap-1 rounded-2xl px-2 py-3 pressable"
                  style={{ background:"rgba(34,211,238,0.07)", border:"1px solid rgba(34,211,238,0.2)", color:"var(--accent-primary)" }}>
                  <span className="text-xl">🏋️</span>
                  <span className="text-xs font-semibold">Gyakorlat</span>
                </button>
                <button onClick={()=>addBlock(activeSession.id,"drill")}
                  className="flex flex-col items-center gap-1 rounded-2xl px-2 py-3 pressable"
                  style={{ background:"rgba(74,222,128,0.07)", border:"1px solid rgba(74,222,128,0.2)", color:"#4ade80" }}>
                  <span className="text-xl">⚡</span>
                  <span className="text-xs font-semibold">Drill</span>
                </button>
                <button onClick={()=>addBlock(activeSession.id,"interval")}
                  className="flex flex-col items-center gap-1 rounded-2xl px-2 py-3 pressable"
                  style={{ background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.2)", color:"#fbbf24" }}>
                  <span className="text-xl">🔄</span>
                  <span className="text-xs font-semibold">Intervall</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
              <div className="text-4xl">📋</div>
              <div className="text-sm font-semibold" style={{ color:"var(--text-primary)" }}>Nincs session</div>
              <button onClick={addSession} className="rounded-2xl px-5 py-2.5 text-sm font-bold pressable"
                style={{ background:"rgba(34,211,238,0.12)", color:"var(--accent-primary)", border:"1px solid rgba(34,211,238,0.25)" }}>
                + Első session hozzáadása
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab==="settings" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Név */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color:"var(--text-muted)" }}>Program neve</div>
            <input defaultValue={program.name}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
              style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)", color:"var(--text-primary)" }}
              onBlur={e=>update(p=>({ ...p, name:e.target.value||p.name }))}/>
          </div>

          {/* Szint */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color:"var(--text-muted)" }}>Szint</div>
            <div className="flex gap-2">
              {[["beginner","Kezdő","#4ade80"],["intermediate","Középhaladó","#22d3ee"],["advanced","Haladó","#fbbf24"]].map(([val,label,col])=>(
                <button key={val} onClick={()=>update(p=>({ ...p, level:val }))}
                  className="flex-1 rounded-2xl py-2.5 text-sm font-semibold pressable"
                  style={{
                    background: program.level===val ? `${col}20` : "var(--surface-1)",
                    color: program.level===val ? col : "var(--text-muted)",
                    border: program.level===val ? `1px solid ${col}40` : "1px solid var(--border-subtle)",
                  }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Saját gyakorlatok */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color:"var(--text-muted)" }}>
              ⭐ Saját gyakorlatok ({(program.customExercises??[]).length})
            </div>
            <div className="space-y-1.5">
              {(program.customExercises??[]).map(ex=>(
                <div key={ex} className="flex items-center gap-2 rounded-xl px-4 py-2.5"
                  style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)" }}>
                  <span className="flex-1 text-sm" style={{ color:"var(--text-primary)" }}>{ex}</span>
                  <button onClick={()=>update(p=>({ ...p, customExercises:(p.customExercises??[]).filter(e=>e!==ex) }))}
                    className="text-xs pressable" style={{ color:"#fca5a5" }}>✕</button>
                </div>
              ))}
              {(program.customExercises??[]).length===0 && (
                <div className="text-sm" style={{ color:"var(--text-muted)" }}>
                  Még nincs saját gyakorlat — a Sessionök tabból add hozzá
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
