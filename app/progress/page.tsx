"use client";

import * as React from "react";
import { BottomNav } from "@/components/BottomNav";
import { WorkoutDetailSheet } from "@/components/WorkoutDetailSheet";
import type { Workout } from "@/lib/types";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import {
  workoutVolume, workoutSetCounts, workoutExerciseCount,
  withinLastDays, topExercisesByVolume, formatK,
} from "@/lib/workoutMetrics";
import { LS_ACTIVE_PROFILE, GUEST_PROFILE_ID, profileKey } from "@/lib/profiles";
import { auth, db } from "@/lib/firebase";
import { subscribeWorkouts } from "@/lib/workoutsCloud";
import { collection, deleteDoc, doc, getDocs, writeBatch, query, orderBy } from "firebase/firestore";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { rebuildPRs, type PRMap, type PREntry } from "@/lib/prStorage";

function isCloudPid(p: string) { return p.startsWith("fb:"); }
function cloudUid(p: string) { return p.startsWith("fb:") ? p.slice(3).trim() : null; }
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
function calcStreak(workouts: Workout[]): number {
  if (!workouts.length) return 0;
  const days = Array.from(new Set(workouts.map(w => startOfDay(new Date(w.startedAt))))).sort((a,b)=>b-a);
  let streak = 0, cursor = startOfDay(new Date());
  for (const d of days) { if (d===cursor||d===cursor-86400000){streak++;cursor=d-86400000;}else break; }
  return streak;
}
function buildVolumeChart(workouts: Workout[]) {
  const map = new Map<string, number>();
  const now = Date.now();
  for (let i = 29; i >= 0; i--) { const d = new Date(now - i * 86400000); map.set(d.toISOString().slice(0,10), 0); }
  for (const w of workouts) {
    const key = new Date(w.startedAt).toISOString().slice(0,10);
    if (map.has(key)) map.set(key, (map.get(key)??0) + workoutVolume(w));
  }
  return Array.from(map.entries()).map(([date, vol]) => ({ date: date.slice(5), vol: Math.round(vol) }));
}
function buildWeeklyChart(workouts: Workout[]) {
  const weeks: {week: string; count: number}[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(Date.now() - (i+1)*7*86400000);
    const end = new Date(Date.now() - i*7*86400000);
    const count = workouts.filter(w => { const t = new Date(w.startedAt).getTime(); return t >= start.getTime() && t < end.getTime(); }).length;
    weeks.push({week: `${start.getMonth()+1}/${start.getDate()}`, count});
  }
  return weeks;
}
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("hu", {month:"short",day:"2-digit",weekday:"short"}); }
function fmtDuration(w: Workout) {
  if (!w.finishedAt) return null;
  const mins = Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000);
  return mins >= 60 ? `${Math.floor(mins/60)}ó ${mins%60}p` : `${mins}p`;
}

function exportWorkoutsCSV(workouts: Workout[]) {
  const rows: string[] = ["Datum,Cim,Gyakorlat,Setek,Volume(kg),Idotartam(perc)"];
  for (const w of workouts) {
    const date = new Date(w.startedAt).toLocaleDateString("hu");
    const title = (w.title || date).replace(/,/g,"");
    const exCount = w.exercises.length;
    const sets = w.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
    const vol = Math.round(workoutVolume(w));
    const dur = w.finishedAt ? Math.round((new Date(w.finishedAt).getTime()-new Date(w.startedAt).getTime())/60000) : "";
    rows.push([date,title,exCount,sets,vol,dur].join(","));
  }
  const blob = new Blob([rows.join("\n")], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "arcx_workouts.csv"; a.click();
  URL.revokeObjectURL(url);
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("hu", {month:"short", day:"2-digit"});
}

// ── PR Tab komponens ──────────────────────────────────────────
function PRTab({ prs, onSearch }: { prs: PRMap; onSearch: (q: string) => void }) {
  const [q, setQ] = React.useState("");
  const entries = React.useMemo(() => {
    const all = Object.values(prs).sort((a, b) => b.bestWeight - a.bestWeight);
    if (!q.trim()) return all;
    const qq = q.toLowerCase();
    return all.filter(e => e.name.toLowerCase().includes(qq));
  }, [prs, q]);

  if (Object.keys(prs).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-8">
        <div className="text-4xl mb-3">🏆</div>
        <div className="text-base font-black mb-2" style={{color:"var(--text-primary)"}}>Még nincs PR</div>
        <div className="text-sm" style={{color:"rgba(255,255,255,0.3)"}}>
          Végezz el egy edzést és automatikusan megjelennek a személyes rekordjaid
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-3">
      {/* Kereső */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color:"rgba(255,255,255,0.25)"}}>🔍</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Keresés gyakorlatra…"
          className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm outline-none"
          style={{background:"rgba(255,255,255,0.05)", color:"var(--text-primary)"}} />
      </div>

      {/* PR lista */}
      <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>
        {entries.length} GYAKORLAT
      </div>
      {entries.map((e, i) => <PRCard key={e.exerciseId} entry={e} rank={i + 1} />)}
    </div>
  );
}

function PRCard({ entry, rank }: { entry: PREntry; rank: number }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <button onClick={() => setExpanded(x => !x)}
      className="w-full rounded-2xl text-left pressable overflow-hidden"
      style={{background:"rgba(255,255,255,0.04)"}}>
      {/* Fő sor */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="text-xs font-black w-5 text-center shrink-0"
          style={{color: rank <= 3 ? "var(--accent-primary)" : "rgba(255,255,255,0.2)"}}>
          {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black truncate" style={{color:"var(--text-primary)"}}>{entry.name}</div>
          <div className="text-[10px] mt-0.5" style={{color:"rgba(255,255,255,0.3)"}}>
            {fmtDateShort(entry.achievedAt)}
          </div>
        </div>
        {/* Best weight badge */}
        <div className="text-right shrink-0">
          <div className="text-lg font-black leading-none" style={{color:"var(--accent-primary)"}}>
            {entry.bestWeight}
            <span className="text-xs font-normal ml-0.5" style={{color:"rgba(255,255,255,0.3)"}}>kg</span>
          </div>
          <div className="text-[10px]" style={{color:"rgba(255,255,255,0.3)"}}>
            × {entry.bestWeightReps} rep
          </div>
        </div>
        <div className="ml-1 text-xs" style={{color:"rgba(255,255,255,0.2)"}}>{expanded ? "▲" : "▼"}</div>
      </div>

      {/* Kibontva — részletek */}
      {expanded && (
        <div className="px-4 pb-3" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          <div className="grid grid-cols-3 gap-2 pt-3">
            {[
              {label:"Legsúlyosabb", value:`${entry.bestWeight} kg`, sub:`${entry.bestWeightReps} rep`},
              {label:"Legjobb szet", value:`${entry.bestVolume} kg`, sub:`${entry.bestVolumeWeight}×${entry.bestVolumeReps}`},
              {label:"Össz. szet", value:String(entry.totalSets), sub:`${formatK(entry.totalVolume)} kg vol`},
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-2.5 text-center"
                style={{background:"rgba(255,255,255,0.05)"}}>
                <div className="text-sm font-black" style={{color:"var(--accent-primary)"}}>{stat.value}</div>
                <div className="text-[9px] mt-0.5" style={{color:"rgba(255,255,255,0.3)"}}>{stat.sub}</div>
                <div className="text-[8px] mt-1" style={{color:"rgba(255,255,255,0.2)"}}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ProgressPage() {
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const profileId = activeProfileId ?? GUEST_PROFILE_ID;
  const LS_HISTORY = React.useMemo(() => profileKey(profileId, "workouts"), [profileId]);
  const [localHistory, setLocalHistory] = useLocalStorageState<Workout[]>(LS_HISTORY, []);
  const [cloudHistory, setCloudHistory] = React.useState<Workout[] | null>(null);
  const [cloudStatus, setCloudStatus] = React.useState<"idle"|"loading"|"ready"|"wrong-user">("idle");
  const [tab, setTab] = React.useState<"overview"|"prs"|"history">("overview");
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [chartMode, setChartMode] = React.useState<"volume"|"frequency">("volume");
  const [prs, setPrs] = React.useState<PRMap>({});

  React.useEffect(() => {
    if (!isCloudPid(profileId)) { setCloudHistory(null); setCloudStatus("idle"); return; }
    const uid = cloudUid(profileId);
    const user = auth.currentUser;
    if (!uid || !user?.uid || user.uid !== uid) { setCloudHistory(null); setCloudStatus("wrong-user"); return; }
    setCloudStatus("loading");
    const unsub = subscribeWorkouts(user.uid, (items) => { setCloudHistory(items); setCloudStatus("ready"); });
    return () => unsub?.();
  }, [profileId]);

  const usingCloud = isCloudPid(profileId) && cloudStatus === "ready";
  const history = usingCloud ? (cloudHistory ?? []) : localHistory;
  const sorted = React.useMemo(() => [...history].sort((a,b) =>
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()), [history]);

  // PR-ek újraszámítása ha változik a history
  React.useEffect(() => {
    if (history.length > 0) {
      const computed = rebuildPRs(profileId, history);
      setPrs(computed);
    }
  }, [history, profileId]);

  const streak = React.useMemo(() => calcStreak(history), [history]);
  const totalVol = React.useMemo(() => history.reduce((a,w) => a+workoutVolume(w), 0), [history]);
  const last7count = history.filter(w => withinLastDays(w, 7)).length;
  const last30count = history.filter(w => withinLastDays(w, 30)).length;
  const top = React.useMemo(() => topExercisesByVolume(history, 5), [history]);
  const volChart = React.useMemo(() => buildVolumeChart(history), [history]);
  const weekChart = React.useMemo(() => buildWeeklyChart(history), [history]);
  const prCount = Object.keys(prs).length;

  const selected = React.useMemo(() =>
    selectedId ? history.find(w => w.id === selectedId) ?? null : null, [history, selectedId]);

  const deleteWorkout = React.useCallback(async () => {
    if (!selectedId) return;
    if (!window.confirm("Törlöd ezt az edzést?")) return;
    if (usingCloud) {
      const uid = cloudUid(profileId); const user = auth.currentUser;
      if (!uid || !user?.uid || user.uid !== uid) return;
      try { await deleteDoc(doc(db, "users", user.uid, "workouts", selectedId)); } catch {}
    } else { setLocalHistory(p => p.filter(w => w.id !== selectedId)); }
    setDetailOpen(false); setSelectedId(null);
  }, [selectedId, usingCloud, profileId, setLocalHistory]);

  const clearAll = React.useCallback(async () => {
    if (!window.confirm("Minden edzést törölsz?")) return;
    if (usingCloud) {
      const uid = cloudUid(profileId); const user = auth.currentUser;
      if (!uid || !user?.uid || user.uid !== uid) return;
      try {
        const snap = await getDocs(query(collection(db, "users", user.uid, "workouts"), orderBy("startedAt","desc")));
        const batch = writeBatch(db); snap.docs.forEach(d => batch.delete(d.ref)); await batch.commit();
      } catch {}
    } else { setLocalHistory([]); }
  }, [usingCloud, profileId, setLocalHistory]);

  const TABS = [
    { id: "overview", label: "Áttekintés" },
    { id: "prs", label: `PR${prCount ? ` (${prCount})` : ""}` },
    { id: "history", label: `Edzések${history.length ? ` (${history.length})` : ""}` },
  ] as const;

  return (
    <div className="flex flex-col" style={{minHeight:"100dvh"}}>
    <div className="flex-1 pb-32 animate-in">

      {/* ── HEADER ── */}
      <div className="px-4 pt-10 pb-4">
        <div className="text-[10px] font-black tracking-widest mb-1" style={{color:"rgba(255,255,255,0.25)"}}>ARCX</div>
        <h1 className="text-2xl font-black" style={{color:"var(--text-primary)"}}>Progress</h1>
      </div>

      {/* ── STAT GRID ── */}
      <div className="px-4 grid grid-cols-2 gap-2 mb-4">
        {[
          {label:"Összes edzés", value: String(history.length), sub: `${last30count} az elmúlt 30 napban`},
          {label:"Streak", value: streak ? `${streak} nap` : "—", sub: `${last7count} edzés 7 napban`},
          {label:"Összes volume", value: formatK(totalVol), sub:"kg összesen"},
          {label:"Átlag/hét", value: history.length ? `${(last30count/4).toFixed(1)}` : "—", sub:"edzés/hét (30n)"},
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{background:"rgba(255,255,255,0.04)"}}>
            <div className="text-xl font-black leading-none" style={{color:"var(--accent-primary)"}}>{s.value}</div>
            <div className="text-[10px] font-black mt-1.5" style={{color:"var(--text-primary)"}}>{s.label}</div>
            <div className="text-[9px] mt-0.5" style={{color:"rgba(255,255,255,0.25)"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex gap-1 px-4 mb-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 rounded-2xl py-2.5 text-[11px] font-black pressable"
            style={tab===t.id
              ? { background: "var(--accent-primary)", color: "#000" }
              : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab==="overview" && (
        <div className="px-4 space-y-3">
          {/* Chart */}
          {history.length > 1 && (
            <div className="rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,0.04)"}}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>GRAFIKON</div>
                <div className="flex gap-1">
                  {(["volume","frequency"] as const).map(m => (
                    <button key={m} onClick={() => setChartMode(m)}
                      className="rounded-xl px-2.5 py-1 text-[10px] font-black pressable"
                      style={chartMode===m
                        ? {background:"var(--accent-primary)",color:"#000"}
                        : {background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.35)"}}>
                      {m==="volume" ? "Volume" : "Frekvencia"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-2 pt-2 pb-3">
                {chartMode==="volume" ? (
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={volChart} margin={{top:4,right:0,left:-28,bottom:0}}>
                      <XAxis dataKey="date" tick={{fontSize:8,fill:"rgba(255,255,255,0.2)"}} tickLine={false} axisLine={false} interval={6} />
                      <Tooltip contentStyle={{background:"#0d0d0f",border:"none",borderRadius:10,fontSize:11}}
                        itemStyle={{color:"var(--accent-primary)"}} labelStyle={{color:"rgba(255,255,255,0.4)"}}
                        formatter={(v:any) => [`${formatK(Number(v))} kg`]} />
                      <Bar dataKey="vol" fill="var(--accent-primary)" radius={[3,3,0,0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={weekChart} margin={{top:4,right:0,left:-28,bottom:0}}>
                      <XAxis dataKey="week" tick={{fontSize:8,fill:"rgba(255,255,255,0.2)"}} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{background:"#0d0d0f",border:"none",borderRadius:10,fontSize:11}}
                        itemStyle={{color:"#4ade80"}} labelStyle={{color:"rgba(255,255,255,0.4)"}}
                        formatter={(v:any) => [`${v} edzés`]} />
                      <Bar dataKey="count" fill="#4ade80" radius={[3,3,0,0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* Top gyakorlatok */}
          {top.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,0.04)"}}>
              <div className="px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>TOP GYAKORLATOK</div>
              </div>
              <div className="px-4 py-2">
                {top.map((t,i) => {
                  const maxVol = top[0].volume;
                  return (
                    <div key={t.name} className="py-2" style={{borderBottom: i<top.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none"}}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{color:"var(--text-primary)"}}>{i+1}. {t.name}</span>
                        <span style={{color:"rgba(255,255,255,0.3)"}}>{formatK(t.volume)} kg</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.06)"}}>
                        <div className="h-full rounded-full"
                          style={{width:`${Math.round((t.volume/maxVol)*100)}%`,background:"var(--accent-primary)",opacity:1-i*0.15}} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PR TAB ── */}
      {tab==="prs" && <PRTab prs={prs} onSearch={() => {}} />}

      {/* ── HISTORY TAB ── */}
      {tab==="history" && (
        <div className="px-4 space-y-2">
          {isCloudPid(profileId) && cloudStatus==="wrong-user" && (
            <div className="rounded-2xl p-4 text-sm"
              style={{background:"rgba(239,68,68,0.08)",color:"#fca5a5"}}>
              Cloud profil aktív, de nincs bejelentkezve. Lépj be újra.
            </div>
          )}
          {cloudStatus==="loading" && (
            <div className="text-sm px-2" style={{color:"rgba(255,255,255,0.3)"}}>Cloud adatok betöltése…</div>
          )}
          {history.length===0 && cloudStatus!=="loading" && (
            <div className="rounded-2xl p-10 text-center" style={{background:"rgba(255,255,255,0.03)"}}>
              <div className="text-3xl mb-2">🏋️</div>
              <div className="text-sm" style={{color:"rgba(255,255,255,0.3)"}}>Még nincs mentett edzés</div>
            </div>
          )}
          {sorted.map(w => {
            const counts = workoutSetCounts(w);
            const vol = workoutVolume(w);
            const exCount = workoutExerciseCount(w);
            const dur = fmtDuration(w);
            return (
              <button key={w.id} onClick={() => { setSelectedId(w.id); setDetailOpen(true); }}
                className="w-full rounded-2xl p-4 text-left pressable"
                style={{background:"rgba(255,255,255,0.04)"}}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-sm font-black" style={{color:"var(--text-primary)"}}>
                    {w.title || fmtDate(w.startedAt)}
                  </div>
                  <div className="text-[10px] shrink-0" style={{color:"rgba(255,255,255,0.3)"}}>
                    {new Date(w.startedAt).toLocaleDateString("hu",{month:"short",day:"2-digit"})}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    {icon:"🏋️", val:`${exCount} gyakorlat`},
                    {icon:"✅", val:`${counts.done}/${counts.total} set`},
                    {icon:"📈", val:`${formatK(vol)} kg`},
                    ...(dur ? [{icon:"⏱", val:dur}] : []),
                  ].map(chip => (
                    <span key={chip.val} className="rounded-xl px-2 py-1 text-[10px] font-semibold"
                      style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.4)"}}>
                      {chip.icon} {chip.val}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
          {history.length > 0 && (
            <div className="flex gap-2 mt-1">
              <button onClick={() => exportWorkoutsCSV(sorted)}
                className="flex-1 rounded-2xl py-3 text-xs font-black pressable"
                style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.4)"}}>
                CSV export
              </button>
              <button onClick={clearAll} className="flex-1 rounded-2xl py-3 text-xs pressable"
                style={{background:"rgba(239,68,68,0.06)",color:"rgba(239,68,68,0.5)"}}>
                Összes törlése
              </button>
            </div>
          )}
        </div>
      )}
    </div>

    <WorkoutDetailSheet open={detailOpen} onClose={() => setDetailOpen(false)}
      workout={selected} onDelete={deleteWorkout} />
    <BottomNav />
    </div>
  );
}
