// app/coach/CalendarPage.tsx
"use client";
import * as React from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { TeamMember } from "@/lib/coachTypes";

// ── Típusok ──────────────────────────────────────────────────
export interface ScheduleAssignment {
  memberUid: string; memberName: string;
  programId: string; programName: string;
  sessionId: string; sessionName: string;
  exercises?: string[];  // gyakorlatnevek a session blokkjaiból
}
interface ScheduleEntry { date: string; assignments: ScheduleAssignment[]; }
interface CoachProgSession { id: string; name: string; blocks?: { name: string }[]; }
interface CoachProg { id: string; name: string; sessions: CoachProgSession[]; }

// ── Helpers ──────────────────────────────────────────────────
const MONTHS = ["Január","Február","Március","Április","Május","Június",
  "Július","Augusztus","Szeptember","Október","November","December"];
const DAYS_S = ["H","K","Sz","Cs","P","Sz","V"];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getCalDays(y: number, m: number): (Date|null)[] {
  const startDow = (new Date(y,m,1).getDay()+6)%7;
  const dim = new Date(y,m+1,0).getDate();
  const cells: (Date|null)[] = [];
  for (let i=0;i<startDow;i++) cells.push(null);
  for (let d=1;d<=dim;d++) cells.push(new Date(y,m,d));
  return cells;
}
async function getToken(): Promise<string> {
  const auth = getAuth();
  if (auth.currentUser) return auth.currentUser.getIdToken();
  return new Promise((res,rej) => {
    const u = onAuthStateChanged(auth, user => { u(); user?user.getIdToken().then(res).catch(rej):rej(new Error("noauth")); });
  });
}

// ── Day Assign Modal ──────────────────────────────────────────
function DayAssignModal({ date, members, programs, existing, onSave, onClose }: {
  date: string; members: TeamMember[]; programs: CoachProg[];
  existing: ScheduleAssignment[]; onSave:(a:ScheduleAssignment[])=>void; onClose:()=>void;
}) {
  const [list, setList]   = React.useState<ScheduleAssignment[]>(existing);
  const [mode, setMode]   = React.useState<"individual"|"group">("individual");
  // individual
  const [mem,  setMem]    = React.useState("");
  const [prog, setProg]   = React.useState("");
  const [sess, setSess]   = React.useState("");
  // group
  const [grp,  setGrp]    = React.useState("");
  const [gprog,setGprog]  = React.useState("");
  const [gsess,setGsess]  = React.useState("");

  const sel  = "w-full rounded-lg px-3 py-2 text-sm outline-none appearance-none";
  const selS = { background:"var(--surface-1)", border:"1px solid var(--border-subtle)", color:"var(--text-primary)" };

  const selProg  = programs.find(p=>p.id===prog);
  const selGprog = programs.find(p=>p.id===gprog);
  const sessions  = selProg?.sessions  ?? [];
  const gsessions = selGprog?.sessions ?? [];

  // Egyedi csoportok a tagokból
  const groups = React.useMemo(() => {
    const s = new Set(members.map(m=>m.group).filter(Boolean) as string[]);
    return [...s].sort();
  }, [members]);

  const d = new Date(date+"T12:00:00");
  const label = `${d.getDate()}. ${MONTHS[d.getMonth()]}`;

  function addIndividual() {
    const member  = members.find(m=>m.uid===mem);
    const program = programs.find(p=>p.id===prog);
    const session = sessions.find(s=>s.id===sess);
    if (!member||!program||!session) return;
    const exercises = (session.blocks??[]).map(b=>b.name).filter(Boolean);
    const a: ScheduleAssignment = {
      memberUid:member.uid, memberName:member.displayName||member.email||"",
      programId:program.id, programName:program.name,
      sessionId:session.id, sessionName:session.name,
      exercises,
    };
    setList(prev=>[...prev.filter(x=>!(x.memberUid===a.memberUid&&x.sessionId===a.sessionId)),a]);
    setMem(""); setProg(""); setSess("");
  }

  function addGroup() {
    const program = programs.find(p=>p.id===gprog);
    const session = gsessions.find(s=>s.id===gsess);
    if (!program||!session) return;
    const groupMembers = grp ? members.filter(m=>m.group===grp) : members;
    if (groupMembers.length===0) return;
    const exercises = (session.blocks??[]).map(b=>b.name).filter(Boolean);
    const newEntries: ScheduleAssignment[] = groupMembers.map(m=>({
      memberUid:m.uid, memberName:m.displayName||m.email||"",
      programId:program.id, programName:program.name,
      sessionId:session.id, sessionName:session.name,
      exercises,
    }));
    setList(prev=>{
      const filtered = prev.filter(x=>!newEntries.some(n=>n.memberUid===x.memberUid&&n.sessionId===x.sessionId));
      return [...filtered, ...newEntries];
    });
    setGrp(""); setGprog(""); setGsess("");
  }

  const canAdd  = !!(mem&&prog&&sess);
  const canGAdd = !!(gprog&&gsess);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background:"rgba(0,0,0,0.65)", backdropFilter:"blur(4px)" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl flex flex-col overflow-hidden"
        style={{ background:"var(--bg-elevated)", maxHeight:"92dvh", borderTop:"2px solid var(--accent-primary)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom:"1px solid var(--border-subtle)" }}>
          <div>
            <div className="text-sm font-black" style={{ color:"var(--text-primary)" }}>📅 {label}</div>
            <div className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{list.length} hozzárendelés</div>
          </div>
          <button onClick={onClose} className="text-xl leading-none pressable" style={{ color:"var(--text-muted)" }}>×</button>
        </div>

        {/* Mode tabs */}
        <div className="flex px-5 pt-3 gap-1 shrink-0">
          {(["individual","group"] as const).map(t=>(
            <button key={t} onClick={()=>setMode(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold pressable transition-all"
              style={{
                background: mode===t?"rgba(34,211,238,0.12)":"transparent",
                color: mode===t?"var(--accent-primary)":"var(--text-muted)",
                border: mode===t?"1px solid rgba(34,211,238,0.25)":"1px solid transparent",
              }}>
              {t==="individual" ? "👤 Egyéni" : "👥 Csoport"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="px-5 py-3 space-y-2 shrink-0" style={{ borderBottom:"1px solid var(--border-subtle)" }}>
          {mode==="individual" ? (<>
            <select value={mem} onChange={e=>setMem(e.target.value)} className={sel} style={selS}>
              <option value="">— Tag kiválasztása —</option>
              {members.map(m=>(
                <option key={m.uid} value={m.uid}>
                  {m.displayName||m.email}{m.group ? ` (${m.group})` : ""}
                </option>
              ))}
            </select>
            <select value={prog} onChange={e=>{ setProg(e.target.value); setSess(""); }} className={sel} style={selS}>
              <option value="">— Program —</option>
              {programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={sess} onChange={e=>setSess(e.target.value)} className={sel} style={selS} disabled={!prog}>
              <option value="">— Session —</option>
              {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={addIndividual} disabled={!canAdd}
              className="w-full rounded-lg py-2 text-sm font-bold pressable"
              style={{ background:canAdd?"var(--accent-primary)":"var(--surface-1)",
                color:canAdd?"#000":"var(--text-muted)", border:"1px solid var(--border-subtle)" }}>
              + Hozzáadás
            </button>
          </>) : (<>
            <select value={grp} onChange={e=>setGrp(e.target.value)} className={sel} style={selS}>
              <option value="">— Összes tag —</option>
              {groups.map(g=>(
                <option key={g} value={g}>{g} ({members.filter(m=>m.group===g).length} fő)</option>
              ))}
            </select>
            <select value={gprog} onChange={e=>{ setGprog(e.target.value); setGsess(""); }} className={sel} style={selS}>
              <option value="">— Program —</option>
              {programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={gsess} onChange={e=>setGsess(e.target.value)} className={sel} style={selS} disabled={!gprog}>
              <option value="">— Session —</option>
              {gsessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {canGAdd && (
              <div className="text-xs px-1" style={{ color:"var(--text-muted)" }}>
                {grp
                  ? `${members.filter(m=>m.group===grp).length} tagnak lesz kijelölve`
                  : `Mind a ${members.length} tagnak lesz kijelölve`}
              </div>
            )}
            <button onClick={addGroup} disabled={!canGAdd}
              className="w-full rounded-lg py-2 text-sm font-bold pressable"
              style={{ background:canGAdd?"var(--accent-primary)":"var(--surface-1)",
                color:canGAdd?"#000":"var(--text-muted)", border:"1px solid var(--border-subtle)" }}>
              + Csoport hozzáadása
            </button>
          </>)}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
          {list.length===0 && (
            <div className="py-6 text-center text-sm" style={{ color:"var(--text-muted)" }}>
              Még nincs hozzárendelés erre a napra
            </div>
          )}
          {list.map((a,i)=>(
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)" }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color:"var(--text-primary)" }}>
                  {a.memberName}
                  {(() => { const m = members.find(x=>x.uid===a.memberUid); return m?.group ?
                    <span className="ml-1.5 text-xs font-normal" style={{ color:"var(--text-muted)" }}>({m.group})</span> : null; })()}
                </div>
                <div className="text-xs truncate" style={{ color:"var(--text-muted)" }}>
                  {a.programName} · <span style={{ color:"var(--accent-primary)" }}>{a.sessionName}</span>
                </div>
              </div>
              <button onClick={()=>setList(prev=>prev.filter((_,j)=>j!==i))}
                className="h-7 w-7 rounded-lg grid place-items-center text-xs shrink-0 pressable"
                style={{ background:"rgba(239,68,68,0.08)", color:"#f87171" }}>×</button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 shrink-0" style={{ borderTop:"1px solid var(--border-subtle)" }}>
          <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm pressable"
            style={{ background:"var(--surface-1)", color:"var(--text-muted)", border:"1px solid var(--border-subtle)" }}>Mégse</button>
          <button onClick={()=>{ onSave(list); onClose(); }}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold pressable"
            style={{ background:"var(--accent-primary)", color:"#000" }}>Mentés</button>
        </div>
      </div>
    </div>
  );
}

// ── Főkomponens ──────────────────────────────────────────────
export function CoachCalendarPage({ members }: { members: TeamMember[] }) {
  const today = new Date();
  const [year, setYear]   = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());
  const [entries, setEntries] = React.useState<Record<string, ScheduleAssignment[]>>({});
  const [loadingCal, setLoadingCal] = React.useState(true);
  const [programs, setPrograms] = React.useState<CoachProg[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<string|null>(null);

  const mk = `${year}-${String(month+1).padStart(2,"0")}`;

  // Programok betöltése
  React.useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/coach/programs", { headers:{ Authorization:`Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        const progs = (data.programs ?? []).map((p: Record<string,unknown>) => ({
          ...p,
          sessions: Array.isArray(p.sessions) ? p.sessions
            : typeof p.sessions === "string" ? (() => { try { return JSON.parse(p.sessions as string); } catch { return []; } })()
            : [],
        }));
        setPrograms(progs);
      } catch(e) { console.error(e); }
    })();
  }, []);

  // Schedule betöltése hónapra
  React.useEffect(() => {
    setLoadingCal(true);
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/coach/schedule?month=${mk}`, { headers:{ Authorization:`Bearer ${token}` } });
        if (!res.ok) { setLoadingCal(false); return; }
        const data = await res.json();
        const map: Record<string,ScheduleAssignment[]> = {};
        for (const e of data.entries ?? []) map[e.date] = e.assignments ?? [];
        setEntries(map);
      } catch(e) { console.error(e); }
      finally { setLoadingCal(false); }
    })();
  }, [mk]);

  async function saveDay(date: string, assignments: ScheduleAssignment[]) {
    setEntries(prev => ({ ...prev, [date]: assignments }));
    try {
      const token = await getToken();
      if (assignments.length === 0) {
        await fetch("/api/coach/schedule", {
          method:"DELETE", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
          body: JSON.stringify({ date }),
        });
      } else {
        await fetch("/api/coach/schedule", {
          method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
          body: JSON.stringify({ date, assignments }),
        });
      }
    } catch(e) { console.error(e); }
  }

  const cells = getCalDays(year, month);
  const todayKey = dateKey(today);

  function prevMonth() { if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); }
  function nextMonth() { if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); }

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      {/* Modal */}
      {selectedDate && (
        <DayAssignModal
          date={selectedDate} members={members} programs={programs}
          existing={entries[selectedDate]??[]}
          onSave={a=>saveDay(selectedDate, a)}
          onClose={()=>setSelectedDate(null)}/>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-5 pb-3 flex-wrap gap-2"
        style={{ borderBottom:"1px solid var(--border-subtle)" }}>
        <div>
          <h1 className="text-xl font-black" style={{ color:"var(--text-primary)" }}>Naptár</h1>
          <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>
            Kattints egy napra az edzésterv kijelöléséhez
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="h-8 w-8 rounded-lg grid place-items-center pressable"
            style={{ background:"var(--surface-1)", color:"var(--text-primary)", border:"1px solid var(--border-subtle)" }}>‹</button>
          <span className="text-sm font-bold min-w-[120px] text-center" style={{ color:"var(--text-primary)" }}>
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="h-8 w-8 rounded-lg grid place-items-center pressable"
            style={{ background:"var(--surface-1)", color:"var(--text-primary)", border:"1px solid var(--border-subtle)" }}>›</button>
        </div>
      </div>

      {/* Naptár grid */}
      <div className="px-4 md:px-6 pt-4 pb-6 flex-1">
        {/* Napok fejléc */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_S.map((d,i)=>(
            <div key={i} className="text-center text-xs font-bold py-1"
              style={{ color:"var(--text-muted)" }}>{d}</div>
          ))}
        </div>

        {/* Nap cellák */}
        {loadingCal ? (
          <div className="py-16 text-center text-sm" style={{ color:"var(--text-muted)" }}>Betöltés…</div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i}/>;
              const dk = dateKey(day);
              const isToday = dk === todayKey;
              const asgns = entries[dk] ?? [];
              const hasData = asgns.length > 0;
              const uniqueMembers = [...new Set(asgns.map(a=>a.memberUid))].length;

              return (
                <button key={i} onClick={()=>setSelectedDate(dk)}
                  className="rounded-xl p-1.5 flex flex-col items-center pressable transition-all min-h-[52px] md:min-h-[72px]"
                  style={{
                    background: isToday ? "rgba(34,211,238,0.12)" : hasData ? "rgba(34,211,238,0.05)" : "var(--surface-1)",
                    border: isToday ? "1px solid rgba(34,211,238,0.4)" : hasData ? "1px solid rgba(34,211,238,0.15)" : "1px solid var(--border-subtle)",
                  }}>
                  <span className="text-xs font-bold"
                    style={{ color: isToday?"var(--accent-primary)":"var(--text-primary)" }}>
                    {day.getDate()}
                  </span>
                  {hasData && (
                    <div className="mt-1 flex flex-col gap-0.5 w-full">
                      <div className="text-center">
                        <span className="inline-block rounded-full px-1.5 text-[10px] font-bold"
                          style={{ background:"rgba(34,211,238,0.2)", color:"var(--accent-primary)" }}>
                          {uniqueMembers}👤
                        </span>
                      </div>
                      <div className="hidden md:block text-[10px] truncate text-center"
                        style={{ color:"var(--text-muted)" }}>
                        {asgns[0]?.sessionName}
                        {asgns.length>1&&<span> +{asgns.length-1}</span>}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
