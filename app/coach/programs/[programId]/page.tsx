// app/coach/programs/[programId]/page.tsx
"use client";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ALL_EXERCISE_GROUPS } from "@/lib/exerciseGroups";
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface CoachBlock {
  id: string; kind: "exercise"|"drill"|"interval";
  name: string; targetSets?: number; targetReps?: string;
  durationSec?: number; rounds?: number; workSec?: number; restSec?: number; notes?: string;
}
interface CoachSession { id: string; name: string; blocks: CoachBlock[]; }
interface CoachProgram {
  id: string; name: string; category: string; level: string;
  sessions: CoachSession[]; customExercises?: string[]; updatedAt?: number;
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID() : String(Date.now() + Math.random());
}
async function getToken(): Promise<string> {
  const auth = getAuth();
  if (auth.currentUser) return auth.currentUser.getIdToken();
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      if (user) user.getIdToken().then(resolve).catch(reject);
      else reject(new Error("Not authenticated"));
    });
  });
}

const LEVEL_LABEL: Record<string,string> = { beginner:"Kezdő", intermediate:"Középhaladó", advanced:"Haladó" };
const LEVEL_DOT: Record<string,string>   = { beginner:"#22c55e", intermediate:"#f59e0b", advanced:"#ef4444" };
const KIND_COLOR: Record<string,string>  = { exercise:"#22d3ee", drill:"#a3e635", interval:"#f97316" };
const KIND_ICON: Record<string,string>   = { exercise:"↑", drill:"◈", interval:"⟳" };

function fmt(sec: number) {
  if (sec >= 60) return `${Math.floor(sec/60)}m`;
  return `${sec}s`;
}

// ── Block kártya — flat, clean ────────────────────────────────
function BlockCard({ b, index, onEdit, onRemove }: {
  b: CoachBlock; index: number; onEdit: ()=>void; onRemove: ()=>void;
}) {
  const col = KIND_COLOR[b.kind];
  return (
    <div className="group flex items-center gap-0 rounded-xl overflow-hidden"
      style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)" }}>
      {/* Bal csík */}
      <div className="w-1 self-stretch shrink-0" style={{ background: col }} />
      {/* Szám */}
      <div className="w-8 shrink-0 text-center text-xs font-black tabular-nums"
        style={{ color: col }}>{index+1}</div>
      {/* Tartalom */}
      <div className="flex-1 min-w-0 py-3 pr-2">
        <div className="text-sm font-semibold truncate" style={{ color:"var(--text-primary)" }}>{b.name}</div>
        <div className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color:"var(--text-muted)" }}>
          <span style={{ color:col, fontWeight:700 }}>{KIND_ICON[b.kind]}</span>
          {b.kind==="exercise" && <span>{b.targetSets??3} × {b.targetReps??"8-12"}</span>}
          {b.kind==="drill"    && <span>{fmt(b.durationSec??60)}</span>}
          {b.kind==="interval" && <span>{b.rounds??6} rounds · {fmt(b.workSec??30)}/{fmt(b.restSec??30)}</span>}
          {b.notes && <span className="truncate opacity-60">· {b.notes}</span>}
        </div>
      </div>
      {/* Akciók */}
      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pr-2 gap-1">
        <button onClick={onEdit}
          className="h-7 w-7 rounded-lg grid place-items-center text-xs pressable"
          style={{ background:"var(--surface-2)", color:"var(--text-secondary)" }}>✎</button>
        <button onClick={onRemove}
          className="h-7 w-7 rounded-lg grid place-items-center text-xs pressable"
          style={{ background:"rgba(239,68,68,0.08)", color:"#f87171" }}>×</button>
      </div>
      {/* Mobile akciók (mindig látható kis képernyőn) */}
      <div className="flex md:hidden shrink-0 pr-2 gap-1">
        <button onClick={onEdit}
          className="h-7 w-7 rounded-lg grid place-items-center text-xs pressable"
          style={{ background:"var(--surface-2)", color:"var(--text-secondary)" }}>✎</button>
        <button onClick={onRemove}
          className="h-7 w-7 rounded-lg grid place-items-center text-xs pressable"
          style={{ background:"rgba(239,68,68,0.08)", color:"#f87171" }}>×</button>
      </div>
    </div>
  );
}

// ── Block edit modal — bottom sheet ─────────────────────────
function BlockEditModal({ b, onSave, onClose }: {
  b: CoachBlock; onSave: (p: Partial<CoachBlock>)=>void; onClose: ()=>void;
}) {
  const [name,   setName]   = React.useState(b.name);
  const [sets,   setSets]   = React.useState(String(b.targetSets??3));
  const [reps,   setReps]   = React.useState(b.targetReps??"8-12");
  const [dur,    setDur]    = React.useState(String(b.durationSec??60));
  const [rounds, setRounds] = React.useState(String(b.rounds??6));
  const [work,   setWork]   = React.useState(String(b.workSec??30));
  const [rest,   setRest]   = React.useState(String(b.restSec??30));
  const [notes,  setNotes]  = React.useState(b.notes??"");

  const inp = "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors";
  const inpS = { background:"var(--surface-1)", border:"1px solid var(--border-subtle)", color:"var(--text-primary)" };

  function save() {
    const base = { name: name.trim()||b.name, notes: notes||undefined };
    if (b.kind==="exercise") onSave({ ...base, targetSets:Number(sets)||3, targetReps:reps||"8-12" });
    else if (b.kind==="drill") onSave({ ...base, durationSec:Number(dur)||60 });
    else onSave({ ...base, rounds:Number(rounds)||6, workSec:Number(work)||30, restSec:Number(rest)||30 });
    onClose();
  }
  const col = KIND_COLOR[b.kind];
  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center"
      style={{ background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="w-full md:max-w-sm rounded-t-2xl md:rounded-2xl p-5 shadow-2xl"
        style={{ background:"var(--bg-elevated)", borderTop:`2px solid ${col}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-2 py-0.5 rounded-md"
              style={{ background:`${col}20`, color:col }}>{KIND_ICON[b.kind]} {b.kind.toUpperCase()}</span>
            <span className="text-sm font-bold" style={{ color:"var(--text-primary)" }}>Szerkesztés</span>
          </div>
          <button onClick={onClose} className="text-lg leading-none pressable" style={{ color:"var(--text-muted)" }}>×</button>
        </div>
        <div className="space-y-2.5">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Név" className={inp} style={inpS}/>
          {b.kind==="exercise" && <div className="grid grid-cols-2 gap-2">
            <input value={sets} onChange={e=>setSets(e.target.value)} placeholder="Szett" className={inp} style={inpS} inputMode="numeric"/>
            <input value={reps} onChange={e=>setReps(e.target.value)} placeholder="Reps" className={inp} style={inpS}/>
          </div>}
          {b.kind==="drill" && <input value={dur} onChange={e=>setDur(e.target.value)} placeholder="mp" className={inp} style={inpS} inputMode="numeric"/>}
          {b.kind==="interval" && <div className="grid grid-cols-3 gap-2">
            <input value={rounds} onChange={e=>setRounds(e.target.value)} placeholder="Kör" className={inp} style={inpS} inputMode="numeric"/>
            <input value={work} onChange={e=>setWork(e.target.value)} placeholder="Work" className={inp} style={inpS} inputMode="numeric"/>
            <input value={rest} onChange={e=>setRest(e.target.value)} placeholder="Rest" className={inp} style={inpS} inputMode="numeric"/>
          </div>}
          <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Megjegyzés…" className={inp} style={inpS}/>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg py-2.5 text-sm pressable"
            style={{ background:"var(--surface-1)", color:"var(--text-muted)", border:"1px solid var(--border-subtle)" }}>Mégse</button>
          <button onClick={save} className="flex-1 rounded-lg py-2.5 text-sm font-bold pressable"
            style={{ background:col, color:"#000" }}>Mentés</button>
        </div>
      </div>
    </div>
  );
}

// ── Új saját gyakorlat modal ─────────────────────────────────
function NewExerciseModal({ onSave, onClose }: { onSave:(n:string)=>void; onClose:()=>void; }) {
  const [name, setName] = React.useState("");
  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center"
      style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="w-full md:max-w-sm rounded-t-2xl md:rounded-2xl p-5"
        style={{ background:"var(--bg-elevated)", borderTop:"2px solid #22d3ee" }}>
        <div className="text-sm font-bold mb-3" style={{ color:"var(--text-primary)" }}>Új saját gyakorlat</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Pl. Kötélmászás, Farmer carry…" autoFocus
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)", color:"var(--text-primary)" }}
          onKeyDown={e=>{ if(e.key==="Enter"&&name.trim()){ onSave(name.trim()); onClose(); }}}/>
        <div className="mt-3 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg py-2.5 text-sm pressable"
            style={{ background:"var(--surface-1)", color:"var(--text-muted)", border:"1px solid var(--border-subtle)" }}>Mégse</button>
          <button onClick={()=>{ if(name.trim()){ onSave(name.trim()); onClose(); }}}
            className="flex-1 rounded-lg py-2.5 text-sm font-bold pressable"
            style={{ background:"#22d3ee", color:"#000" }}>Létrehozás</button>
        </div>
      </div>
    </div>
  );
}

// ── Exercise picker sheet ────────────────────────────────────
function ExercisePickerSheet({ customExercises, onPick, onClose, onNewExercise }: {
  customExercises: string[]; onPick:(n:string)=>void;
  onClose:()=>void; onNewExercise:(n:string)=>void;
}) {
  const [q, setQ] = React.useState("");
  const [showNew, setShowNew] = React.useState(false);

  const allGroups = React.useMemo(() => {
    const base = [...ALL_EXERCISE_GROUPS];
    if (customExercises.length > 0)
      base.unshift({ name:"Saját", emoji:"⭐", exercises: customExercises });
    return base;
  }, [customExercises]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return allGroups;
    return allGroups
      .map(g => ({ ...g, exercises: g.exercises.filter(e=>e.toLowerCase().includes(qq)) }))
      .filter(g=>g.exercises.length>0);
  }, [q, allGroups]);

  return (
    <>
      {showNew && <NewExerciseModal onSave={n=>{ onNewExercise(n); onPick(n); setShowNew(false); }} onClose={()=>setShowNew(false)}/>}
      <div className="fixed inset-0 z-[60] flex items-end" style={{ background:"rgba(0,0,0,0.65)", backdropFilter:"blur(4px)" }}
        onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
        <div className="w-full flex flex-col rounded-t-2xl" style={{ background:"var(--bg-elevated)", maxHeight:"85dvh" }}>
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="h-1 w-8 rounded-full" style={{ background:"var(--border-mid)" }}/>
          </div>
          {/* Header */}
          <div className="px-4 pb-3 shrink-0 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-black" style={{ color:"var(--text-primary)" }}>Gyakorlat</span>
              <button onClick={onClose} className="pressable text-xl leading-none" style={{ color:"var(--text-muted)" }}>×</button>
            </div>
            <div className="flex gap-2">
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Keresés…" autoFocus
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)", color:"var(--text-primary)" }}/>
              <button onClick={()=>setShowNew(true)}
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-bold pressable"
                style={{ background:"rgba(34,211,238,0.12)", color:"#22d3ee", border:"1px solid rgba(34,211,238,0.25)" }}>
                + Saját
              </button>
            </div>
          </div>
          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {filtered.map(group=>(
              <div key={group.name} className="mb-4">
                <div className="text-xs font-bold uppercase tracking-widest mb-1.5 sticky top-0 py-1"
                  style={{ color:"var(--text-muted)", background:"var(--bg-elevated)" }}>
                  {group.emoji} {group.name}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                  {group.exercises.map(ex=>(
                    <button key={ex} onClick={()=>onPick(ex)}
                      className="text-left rounded-lg px-3 py-2 text-sm pressable truncate"
                      style={{ background:"var(--surface-1)", color:"var(--text-primary)", border:"1px solid var(--border-subtle)" }}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length===0 && (
              <div className="py-10 text-center text-sm" style={{ color:"var(--text-muted)" }}>
                Nincs találat
              </div>
            )}
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

  const [program, setProgram]             = React.useState<CoachProgram|null>(null);
  const [loading, setLoading]             = React.useState(true);
  const [saving, setSaving]               = React.useState(false);
  const [savedPing, setSavedPing]         = React.useState(0);
  const [activeSessionId, setActiveSid]   = React.useState<string|null>(null);
  const [editBlock, setEditBlock]         = React.useState<{sid:string;idx:number}|null>(null);
  const [showPicker, setShowPicker]       = React.useState<string|null>(null);
  const [renamingSid, setRenamingSid]     = React.useState<string|null>(null);
  const [tab, setTab]                     = React.useState<"sessions"|"settings">("sessions");

  React.useEffect(() => {
    if (!programId) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/coach/programs/${programId}`, {
          headers: { Authorization:`Bearer ${token}` },
        });
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        const p = data.program as CoachProgram;
        if (typeof p.sessions === "string") { try { p.sessions = JSON.parse(p.sessions as unknown as string); } catch { p.sessions=[]; } }
        if (!Array.isArray(p.sessions)) p.sessions = [];
        if (!Array.isArray(p.customExercises)) p.customExercises = [];
        setProgram(p);
        setActiveSid(p.sessions[0]?.id ?? null);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [programId]);

  const saveRef = React.useRef<ReturnType<typeof setTimeout>|null>(null);
  const persist = React.useCallback((next: CoachProgram) => {
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const token = await getToken();
        await fetch(`/api/coach/programs/${next.id}`, {
          method:"PATCH",
          headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
          body: JSON.stringify({ name:next.name, sessions:next.sessions,
            customExercises:next.customExercises??[], level:next.level, category:next.category }),
        });
        setSavedPing(x=>x+1);
      } catch(e) { console.error(e); }
      finally { setSaving(false); }
    }, 800);
  }, []);

  const update = React.useCallback((fn:(p:CoachProgram)=>CoachProgram) => {
    setProgram(prev => {
      if (!prev) return prev;
      const next = { ...fn(prev), updatedAt:Date.now() };
      persist(next); return next;
    });
  }, [persist]);

  const addSession = () => update(p => {
    const s: CoachSession = { id:uid(), name:`Session ${p.sessions.length+1}`, blocks:[] };
    setTimeout(()=>setActiveSid(s.id), 0);
    return { ...p, sessions:[...p.sessions, s] };
  });
  const removeSession = (sid:string) => update(p => {
    const next = p.sessions.filter(s=>s.id!==sid);
    setTimeout(()=>setActiveSid(c=>c===sid?(next[0]?.id??null):c), 0);
    return { ...p, sessions:next };
  });
  const renameSession = (sid:string, name:string) => update(p => ({
    ...p, sessions: p.sessions.map(s=>s.id===sid?{...s,name}:s)
  }));
  const addBlock = (sid:string, kind:CoachBlock["kind"], name?:string) => update(p => ({
    ...p, sessions: p.sessions.map(s => {
      if (s.id!==sid) return s;
      const b: CoachBlock = kind==="exercise"
        ? { id:uid(), kind:"exercise", name:name??"Új gyakorlat", targetSets:3, targetReps:"8-12" }
        : kind==="drill" ? { id:uid(), kind:"drill", name:name??"Drill", durationSec:300 }
        : { id:uid(), kind:"interval", name:name??"Intervall", rounds:6, workSec:30, restSec:30 };
      return { ...s, blocks:[...s.blocks, b] };
    })
  }));
  const patchBlock = (sid:string, idx:number, patch:Partial<CoachBlock>) => update(p => ({
    ...p, sessions: p.sessions.map(s=>s.id!==sid?s:{ ...s, blocks:s.blocks.map((b,i)=>i===idx?{...b,...patch}:b) })
  }));
  const removeBlock = (sid:string, idx:number) => update(p => ({
    ...p, sessions: p.sessions.map(s=>s.id!==sid?s:{ ...s, blocks:s.blocks.filter((_,i)=>i!==idx) })
  }));
  const addCustomEx = (name:string) => update(p => ({
    ...p, customExercises:[...(p.customExercises??[]).filter(e=>e!==name), name]
  }));

  const activeSess = program?.sessions.find(s=>s.id===activeSessionId)??null;

  if (loading) return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-sm" style={{ color:"var(--text-muted)" }}>Betöltés…</div>
    </div>
  );
  if (!program) return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
      <span className="text-3xl">🔍</span>
      <div className="text-sm font-semibold" style={{ color:"var(--text-primary)" }}>Program nem található</div>
      <button onClick={()=>router.push("/coach")} className="rounded-lg px-4 py-2 text-sm pressable"
        style={{ background:"var(--surface-1)", color:"var(--text-primary)", border:"1px solid var(--border-subtle)" }}>
        Vissza
      </button>
    </div>
  );

  const levelDot = LEVEL_DOT[program.level] ?? "#888";

  return (
    <div className="flex min-h-dvh flex-col" style={{ background:"var(--bg-base)" }}>
      {/* Modals */}
      {showPicker && (
        <ExercisePickerSheet customExercises={program.customExercises??[]}
          onPick={n=>{ addBlock(showPicker,"exercise",n); setShowPicker(null); }}
          onClose={()=>setShowPicker(null)}
          onNewExercise={addCustomEx}/>
      )}
      {editBlock && (() => {
        const b = program.sessions.find(s=>s.id===editBlock.sid)?.blocks[editBlock.idx];
        return b ? <BlockEditModal b={b} onSave={p=>patchBlock(editBlock.sid,editBlock.idx,p)} onClose={()=>setEditBlock(null)}/> : null;
      })()}

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
        style={{ background:"var(--bg-base)", borderBottom:"1px solid var(--border-subtle)" }}>
        <button onClick={()=>router.push("/coach")}
          className="h-8 w-8 rounded-lg grid place-items-center pressable shrink-0"
          style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)", color:"var(--text-secondary)" }}>
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-black truncate" style={{ color:"var(--text-primary)" }}>{program.name}</span>
            <span className="shrink-0 flex items-center gap-1 text-xs" style={{ color:"var(--text-muted)" }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background:levelDot }}/>
              {LEVEL_LABEL[program.level]??program.level}
            </span>
          </div>
          <div className="text-xs" style={{ color:"var(--text-muted)" }}>{program.category}</div>
        </div>
        <div className="shrink-0 text-xs tabular-nums transition-all"
          style={{ color: saving?"var(--text-muted)":"#22c55e", opacity: (saving||savedPing>0)?1:0 }}>
          {saving ? "Mentés…" : "✓"}
        </div>
      </header>

      {/* ── TAB BAR ── */}
      <div className="flex gap-0 px-4 pt-3 shrink-0" style={{ borderBottom:"1px solid var(--border-subtle)" }}>
        {(["sessions","settings"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className="px-4 pb-2.5 text-sm font-semibold transition-colors relative"
            style={{ color: tab===t?"var(--text-primary)":"var(--text-muted)" }}>
            {t==="sessions" ? "Sessionök" : "Beállítások"}
            {tab===t && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background:"var(--accent-primary)" }}/>}
          </button>
        ))}
      </div>

      {/* ── SESSIONS TAB ── */}
      {tab==="sessions" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop: bal oldali session lista */}
          <aside className="hidden md:flex flex-col w-52 shrink-0 overflow-y-auto py-3 px-3 gap-1"
            style={{ borderRight:"1px solid var(--border-subtle)" }}>
            {program.sessions.map(s=>(
              <button key={s.id} onClick={()=>setActiveSid(s.id)}
                className="w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium truncate pressable transition-colors"
                style={{
                  background: activeSessionId===s.id?"rgba(34,211,238,0.1)":"transparent",
                  color: activeSessionId===s.id?"var(--accent-primary)":"var(--text-secondary)",
                  borderLeft: activeSessionId===s.id?"2px solid var(--accent-primary)":"2px solid transparent",
                }}>
                {s.name}
              </button>
            ))}
            <button onClick={addSession}
              className="w-full text-left rounded-lg px-3 py-2.5 text-sm pressable mt-1"
              style={{ color:"var(--text-muted)", borderLeft:"2px solid transparent" }}>
              + Session
            </button>
          </aside>

          {/* Mobile: vízszintes session scroll */}
          <div className="md:hidden flex gap-1.5 px-4 py-2.5 overflow-x-auto no-scrollbar shrink-0 absolute w-full"
            style={{ top:"calc(var(--header-h, 100px) + 40px)", zIndex:10 }}>
          </div>

          {/* Fő tartalom */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile session tabs */}
            <div className="flex md:hidden gap-1.5 px-4 py-2.5 overflow-x-auto no-scrollbar shrink-0">
              {program.sessions.map(s=>(
                <button key={s.id} onClick={()=>setActiveSid(s.id)}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold pressable whitespace-nowrap"
                  style={{
                    background: activeSessionId===s.id?"rgba(34,211,238,0.12)":"var(--surface-1)",
                    color: activeSessionId===s.id?"var(--accent-primary)":"var(--text-muted)",
                    border: activeSessionId===s.id?"1px solid rgba(34,211,238,0.3)":"1px solid var(--border-subtle)",
                  }}>
                  {s.name}
                </button>
              ))}
              <button onClick={addSession}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs pressable whitespace-nowrap"
                style={{ background:"var(--surface-1)", color:"var(--text-muted)", border:"1px dashed var(--border-subtle)" }}>
                + Session
              </button>
            </div>

            {/* Session tartalom */}
            {activeSess ? (
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-4 py-3 pb-32">
                  {/* Session fejléc */}
                  <div className="flex items-center justify-between mb-3">
                    {renamingSid===activeSess.id ? (
                      <input autoFocus defaultValue={activeSess.name}
                        className="flex-1 rounded-lg px-3 py-1.5 text-sm font-bold outline-none mr-2"
                        style={{ background:"var(--surface-1)", border:"1px solid var(--accent-primary)", color:"var(--text-primary)" }}
                        onBlur={e=>{ renameSession(activeSess.id,e.target.value); setRenamingSid(null); }}
                        onKeyDown={e=>{ if(e.key==="Enter"){ renameSession(activeSess.id,(e.target as HTMLInputElement).value); setRenamingSid(null); }}}/>
                    ) : (
                      <button onClick={()=>setRenamingSid(activeSess.id)}
                        className="text-sm font-bold pressable flex items-center gap-1.5"
                        style={{ color:"var(--text-primary)" }}>
                        {activeSess.name}
                        <span className="text-xs" style={{ color:"var(--text-muted)" }}>✎</span>
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color:"var(--text-muted)" }}>
                        {activeSess.blocks.length} blokk
                      </span>
                      <button onClick={()=>removeSession(activeSess.id)}
                        className="text-xs px-2 py-1 rounded-md pressable"
                        style={{ color:"#f87171", background:"rgba(239,68,68,0.08)" }}>
                        Törlés
                      </button>
                    </div>
                  </div>

                  {/* Block lista */}
                  <div className="space-y-1.5 mb-4">
                    {activeSess.blocks.map((b,i)=>(
                      <BlockCard key={b.id??i} b={b} index={i}
                        onEdit={()=>setEditBlock({sid:activeSess.id,idx:i})}
                        onRemove={()=>removeBlock(activeSess.id,i)}/>
                    ))}
                    {activeSess.blocks.length===0 && (
                      <div className="py-8 text-center text-sm rounded-xl"
                        style={{ color:"var(--text-muted)", background:"var(--surface-1)", border:"1px dashed var(--border-subtle)" }}>
                        Adj hozzá blokkokat ↓
                      </div>
                    )}
                  </div>

                  {/* Add blokk gombok */}
                  <div className="flex gap-2">
                    <button onClick={()=>setShowPicker(activeSess.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold pressable"
                      style={{ background:"rgba(34,211,238,0.08)", color:"#22d3ee", border:"1px solid rgba(34,211,238,0.2)" }}>
                      <span className="font-black">↑</span> Gyakorlat
                    </button>
                    <button onClick={()=>addBlock(activeSess.id,"drill")}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold pressable"
                      style={{ background:"rgba(163,230,53,0.08)", color:"#a3e635", border:"1px solid rgba(163,230,53,0.2)" }}>
                      <span className="font-black">◈</span> Drill
                    </button>
                    <button onClick={()=>addBlock(activeSess.id,"interval")}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold pressable"
                      style={{ background:"rgba(249,115,22,0.08)", color:"#f97316", border:"1px solid rgba(249,115,22,0.2)" }}>
                      <span className="font-black">⟳</span> Intervall
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
                <div className="text-sm" style={{ color:"var(--text-muted)" }}>Nincs session</div>
                <button onClick={addSession} className="rounded-lg px-4 py-2 text-sm font-bold pressable"
                  style={{ background:"rgba(34,211,238,0.1)", color:"var(--accent-primary)", border:"1px solid rgba(34,211,238,0.2)" }}>
                  + Első session
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab==="settings" && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
            {/* Név */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color:"var(--text-muted)" }}>Program neve</label>
              <input defaultValue={program.name}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)", color:"var(--text-primary)" }}
                onBlur={e=>update(p=>({...p,name:e.target.value||p.name}))}/>
            </div>

            {/* Szint */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color:"var(--text-muted)" }}>Szint</label>
              <div className="grid grid-cols-3 gap-2">
                {(["beginner","intermediate","advanced"] as const).map(v=>(
                  <button key={v} onClick={()=>update(p=>({...p,level:v}))}
                    className="rounded-lg py-2.5 text-sm font-semibold pressable transition-all"
                    style={{
                      background: program.level===v?`${LEVEL_DOT[v]}18`:"var(--surface-1)",
                      color: program.level===v?LEVEL_DOT[v]:"var(--text-muted)",
                      border: program.level===v?`1px solid ${LEVEL_DOT[v]}40`:"1px solid var(--border-subtle)",
                    }}>
                    {LEVEL_LABEL[v]}
                  </button>
                ))}
              </div>
            </div>

            {/* Saját gyakorlatok */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color:"var(--text-muted)" }}>Saját gyakorlatok</label>
              {(program.customExercises??[]).length === 0 ? (
                <div className="text-sm rounded-lg px-3 py-2.5"
                  style={{ color:"var(--text-muted)", background:"var(--surface-1)", border:"1px solid var(--border-subtle)" }}>
                  Még nincs — a Sessionök tabból adhatod hozzá
                </div>
              ) : (
                <div className="space-y-1">
                  {(program.customExercises??[]).map(ex=>(
                    <div key={ex} className="flex items-center gap-2 rounded-lg px-3 py-2"
                      style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)" }}>
                      <span className="flex-1 text-sm" style={{ color:"var(--text-primary)" }}>⭐ {ex}</span>
                      <button onClick={()=>update(p=>({...p,customExercises:(p.customExercises??[]).filter(e=>e!==ex)}))}
                        className="text-xs pressable" style={{ color:"#f87171" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
