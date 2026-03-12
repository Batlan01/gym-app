"use client";

import * as React from "react";
import { useTranslation } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";
import { WorkoutDetailSheet } from "@/components/WorkoutDetailSheet";
import type { Workout } from "@/lib/types";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import {
  workoutVolume, workoutSetCounts, workoutExerciseCount,
  withinLastDays, topExercisesByVolume, formatK,
  buildWeeklyVolumeChart, buildMonthlyVolumeChart,
  buildHeatmapData, topExercisesDetailed,
} from "@/lib/workoutMetrics";
import { LS_ACTIVE_PROFILE, GUEST_PROFILE_ID, profileKey } from "@/lib/profiles";
import { auth, db } from "@/lib/firebase";
import { subscribeWorkouts } from "@/lib/workoutsCloud";
import { collection, deleteDoc, doc, getDocs, writeBatch, query, orderBy } from "firebase/firestore";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { rebuildPRs, buildExerciseHistory, type PRMap, type PREntry, type ExerciseHistoryPoint } from "@/lib/prStorage";
import { PRChartSheet } from "@/components/PRChartSheet";

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

// ── Hőtérkép komponens (GitHub-style) ────────────────────────
const MONTH_LABELS = ["Jan","Feb","Már","Ápr","Máj","Jún","Júl","Aug","Szep","Okt","Nov","Dec"];
const DAY_LABELS = ["H","K","Sze","Cs","P","Szo","V"];

function WorkoutHeatmap({ workouts }: { workouts: Workout[] }) {
  const data = React.useMemo(() => buildHeatmapData(workouts), [workouts]);

  // 52 hét × 7 nap grid
  const weeks: { date: string; count: number }[][] = [];
  // Kezdőnap: 364 nappal ezelőtt (hétfőre igazítva)
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  // data already ordered oldest → newest (365 items)
  // Build week columns
  let weekBuf: { date: string; count: number }[] = [];
  for (const d of data) {
    weekBuf.push(d);
    const dow = new Date(d.date).getDay(); // 0=Sun
    if (dow === 0) { weeks.push(weekBuf); weekBuf = []; }
  }
  if (weekBuf.length) weeks.push(weekBuf);

  function cellColor(count: number): string {
    if (count === 0) return "rgba(255,255,255,0.05)";
    if (count === 1) return "rgba(34,211,238,0.25)";
    if (count === 2) return "rgba(34,211,238,0.55)";
    return "rgba(34,211,238,0.9)";
  }

  const totalWorkouts = data.reduce((a,d)=>a+d.count,0);
  const activeDays = data.filter(d=>d.count>0).length;

  return (
    <div className="rounded-2xl overflow-hidden" style={{background:"var(--surface-1)"}}>
      <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:"1px solid var(--border-subtle)"}}>
        <div className="text-[9px] font-black tracking-widest" style={{color:"var(--text-muted)"}}>EDZÉS HŐTÉRKÉP</div>
        <div className="text-[9px]" style={{color:"var(--text-muted)"}}>{totalWorkouts} edzés · {activeDays} aktív nap</div>
      </div>
      <div className="px-3 pt-2 pb-3 overflow-x-auto">
        <div className="flex gap-0.5" style={{minWidth: 'max-content'}}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((d, di) => (
                <div key={d.date} title={`${d.date}: ${d.count} edzés`}
                  className="rounded-sm"
                  style={{
                    width: 10, height: 10,
                    background: cellColor(d.count),
                    outline: d.date === todayStr ? '1px solid rgba(34,211,238,0.8)' : 'none',
                  }} />
              ))}
            </div>
          ))}
        </div>
        {/* Jelmagyarázat */}
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-[8px]" style={{color:"var(--text-muted)"}}>Kevés</span>
          {[0,1,2,3].map(v => (
            <div key={v} className="rounded-sm" style={{width:9,height:9,background:cellColor(v)}} />
          ))}
          <span className="text-[8px]" style={{color:"var(--text-muted)"}}>Sok</span>
        </div>
      </div>
    </div>
  );
}

// ── Volume chart helpers ──────────────────────────────────────
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
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString(undefined, {month:"short",day:"2-digit",weekday:"short"}); }
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
  return new Date(iso).toLocaleDateString(undefined, {month:"short", day:"2-digit"});
}

// ── PR Tab ───────────────────────────────────────────────────
function PRTab({ prs, onSearch, onOpenChart }: { prs: PRMap; onSearch: (q: string) => void; onOpenChart: (e: PREntry) => void }) {
  const { t: pt } = useTranslation();
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
        <div className="text-base font-black mb-2" style={{color:"var(--text-primary)"}}>{pt.progress.pr_none}</div>
        <div className="text-sm" style={{color:"var(--text-muted)"}}>{pt.progress.pr_none_sub}</div>
      </div>
    );
  }
  return (
    <div className="px-4 space-y-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color:"var(--text-muted)"}}>🔍</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={pt.common.search}
          className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm outline-none"
          style={{background:"var(--surface-1)", color:"var(--text-primary)"}} />
      </div>
      <div className="text-[9px] font-black tracking-widest" style={{color:"var(--text-muted)"}}>{entries.length} GYAKORLAT</div>
      {entries.map((e, i) => <PRCard key={e.exerciseId} entry={e} rank={i + 1} onOpen={() => onOpenChart(e)} />)}
    </div>
  );
}

function PRCard({ entry, rank, onOpen }: { entry: PREntry; rank: number; onOpen: () => void }) {
  const { t: ct } = useTranslation();
  const [expanded, setExpanded] = React.useState(false);
  return (
    <button onClick={() => setExpanded(x => !x)} className="w-full rounded-2xl text-left pressable overflow-hidden" style={{background:"var(--surface-1)"}}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="text-xs font-black w-5 text-center shrink-0" style={{color: rank <= 3 ? "var(--accent-primary)" : "rgba(255,255,255,0.2)"}}>
          {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black truncate" style={{color:"var(--text-primary)"}}>{entry.name}</div>
          <div className="text-[10px] mt-0.5" style={{color:"var(--text-muted)"}}>{fmtDateShort(entry.achievedAt)}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-black leading-none" style={{color:"var(--accent-primary)"}}>
            {entry.bestWeight}<span className="text-xs font-normal ml-0.5" style={{color:"var(--text-muted)"}}>kg</span>
          </div>
          <div className="text-[10px]" style={{color:"var(--text-muted)"}}>× {entry.bestWeightReps} rep</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="rounded-xl px-2 py-1 text-[10px] font-black" style={{background:"var(--accent-primary)",color:"#000"}}>
            Grafikon →
          </button>
          <div className="text-xs" style={{color:"rgba(255,255,255,0.2)"}}>{expanded ? "▲" : "▼"}</div>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-3" style={{borderTop:"1px solid var(--border-subtle)"}}>
          <div className="grid grid-cols-3 gap-2 pt-3">
            {[
              {label:ct.progress.pr_best_weight, value:`${entry.bestWeight} kg`, sub:`${entry.bestWeightReps} rep`},
              {label:ct.progress.pr_best_set, value:`${entry.bestVolume} kg`, sub:`${entry.bestVolumeWeight}×${entry.bestVolumeReps}`},
              {label:ct.progress.pr_total_sets, value:String(entry.totalSets), sub:`${formatK(entry.totalVolume)} kg vol`},
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-2.5 text-center" style={{background:"var(--surface-1)"}}>
                <div className="text-sm font-black" style={{color:"var(--accent-primary)"}}>{stat.value}</div>
                <div className="text-[9px] mt-0.5" style={{color:"var(--text-muted)"}}>{stat.sub}</div>
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
  const { t } = useTranslation();
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const profileId = activeProfileId ?? GUEST_PROFILE_ID;
  const LS_HISTORY = React.useMemo(() => profileKey(profileId, "workouts"), [profileId]);
  const [localHistory, setLocalHistory] = useLocalStorageState<Workout[]>(LS_HISTORY, []);
  const [cloudHistory, setCloudHistory] = React.useState<Workout[] | null>(null);
  const [cloudStatus, setCloudStatus] = React.useState<"idle"|"loading"|"ready"|"wrong-user">("idle");
  const [tab, setTab] = React.useState<"overview"|"prs"|"history">("overview");
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [chartMode, setChartMode] = React.useState<"daily"|"weekly"|"monthly">("daily");
  const [prs, setPrs] = React.useState<PRMap>({});
  const [prChartEntry, setPrChartEntry] = React.useState<PREntry | null>(null);
  const [prChartHistory, setPrChartHistory] = React.useState<ExerciseHistoryPoint[]>([]);

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

  React.useEffect(() => {
    if (history.length > 0) { const computed = rebuildPRs(profileId, history); setPrs(computed); }
  }, [history, profileId]);

  const streak = React.useMemo(() => calcStreak(history), [history]);
  const totalVol = React.useMemo(() => history.reduce((a,w) => a+workoutVolume(w), 0), [history]);
  const last7count = history.filter(w => withinLastDays(w, 7)).length;
  const last30count = history.filter(w => withinLastDays(w, 30)).length;
  const topDetailed = React.useMemo(() => topExercisesDetailed(history, 5), [history]);
  const volChart = React.useMemo(() => buildVolumeChart(history), [history]);
  const weekVolChart = React.useMemo(() => buildWeeklyVolumeChart(history, 12), [history]);
  const monthVolChart = React.useMemo(() => buildMonthlyVolumeChart(history, 12), [history]);
  const weekChart = React.useMemo(() => buildWeeklyChart(history), [history]);
  const prCount = Object.keys(prs).length;

  const selected = React.useMemo(() =>
    selectedId ? history.find(w => w.id === selectedId) ?? null : null, [history, selectedId]);

  const deleteWorkout = React.useCallback(async () => {
    if (!selectedId) return;
    if (!window.confirm(t.progress.delete_workout)) return;
    if (usingCloud) {
      const uid = cloudUid(profileId); const user = auth.currentUser;
      if (!uid || !user?.uid || user.uid !== uid) return;
      try { await deleteDoc(doc(db, "users", user.uid, "workouts", selectedId)); } catch {}
    } else { setLocalHistory(p => p.filter(w => w.id !== selectedId)); }
    setDetailOpen(false); setSelectedId(null);
  }, [selectedId, usingCloud, profileId, setLocalHistory, t.progress.delete_workout]);

  const clearAll = React.useCallback(async () => {
    if (!window.confirm(t.progress.delete_all)) return;
    if (usingCloud) {
      const uid = cloudUid(profileId); const user = auth.currentUser;
      if (!uid || !user?.uid || user.uid !== uid) return;
      try {
        const snap = await getDocs(query(collection(db, "users", user.uid, "workouts"), orderBy("startedAt","desc")));
        const batch = writeBatch(db); snap.docs.forEach(d => batch.delete(d.ref)); await batch.commit();
      } catch {}
    } else { setLocalHistory([]); }
  }, [usingCloud, profileId, setLocalHistory, t.progress.delete_all]);

  const TABS = [
    { id: "overview", label: t.progress.tab_overview },
    { id: "prs", label: `${t.progress.tab_prs}${prCount ? ` (${prCount})` : ""}` },
    { id: "history", label: `${t.progress.tab_history}${history.length ? ` (${history.length})` : ""}` },
  ] as const;

  const chartData = chartMode === "daily" ? volChart : chartMode === "weekly" ? weekVolChart.map(d=>({date:d.week,vol:d.vol})) : monthVolChart.map(d=>({date:d.month,vol:d.vol}));

  return (
    <div className="flex flex-col" style={{minHeight:"100dvh"}}>
    <div className="flex-1 pb-32 animate-in">

      {/* ── HEADER ── */}
      <div className="px-4 pt-10 pb-4">
        <div className="text-[10px] font-black tracking-widest mb-1" style={{color:"var(--text-muted)"}}>ARCX</div>
        <h1 className="text-2xl font-black" style={{color:"var(--text-primary)"}}>{t.progress.title}</h1>
      </div>

      {/* ── STAT GRID ── */}
      <div className="px-4 grid grid-cols-2 gap-2 mb-4">
        {[
          {label:t.progress.total_workouts, value:String(history.length), sub:`${last30count} ${t.progress.last_30}`},
          {label:t.progress.streak, value:streak ? `${streak} ${t.progress.nap}` : "—", sub:`${last7count} ${t.progress.last_7}`},
          {label:t.progress.total_volume, value:formatK(totalVol), sub:t.progress.kg_total},
          {label:t.progress.avg_per_week, value:history.length ? `${(last30count/4).toFixed(1)}` : "—", sub:t.progress.per_week_30},
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{background:"var(--surface-1)"}}>
            <div className="text-xl font-black leading-none" style={{color:"var(--accent-primary)"}}>{s.value}</div>
            <div className="text-[10px] font-black mt-1.5" style={{color:"var(--text-primary)"}}>{s.label}</div>
            <div className="text-[9px] mt-0.5" style={{color:"var(--text-muted)"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex gap-1 px-4 mb-4">
        {TABS.map(tt => (
          <button key={tt.id} onClick={() => setTab(tt.id)}
            className="flex-1 rounded-2xl py-2.5 text-[11px] font-black pressable"
            style={tab===tt.id
              ? { background: "var(--accent-primary)", color: "#000" }
              : { background:"var(--surface-1)", color:"var(--text-secondary)" }}>
            {tt.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab==="overview" && (
        <div className="px-4 space-y-3">

          {/* Volume grafikon — napi/heti/havi váltóval */}
          {history.length > 1 && (
            <div className="rounded-2xl overflow-hidden" style={{background:"var(--surface-1)"}}>
              <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:"1px solid var(--border-subtle)"}}>
                <div className="text-[9px] font-black tracking-widest" style={{color:"var(--text-muted)"}}>ÖSSZTÖMEG (KG)</div>
                <div className="flex gap-1">
                  {([["daily","30 nap"],["weekly","12 hét"],["monthly","12 hó"]] as const).map(([m,lbl]) => (
                    <button key={m} onClick={() => setChartMode(m)}
                      className="rounded-xl px-2.5 py-1 text-[10px] font-black pressable"
                      style={chartMode===m ? {background:"var(--accent-primary)",color:"#000"} : {background:"var(--surface-2)",color:"var(--text-muted)"}}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-2 pt-2 pb-3">
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={chartData} margin={{top:4,right:0,left:-28,bottom:0}}>
                    <XAxis dataKey="date" tick={{fontSize:8,fill:"rgba(255,255,255,0.2)"}} tickLine={false} axisLine={false}
                      interval={chartMode==="daily" ? 6 : 2} />
                    <Tooltip contentStyle={{background:"var(--bg-elevated)",border:"none",borderRadius:10,fontSize:11}}
                      itemStyle={{color:"var(--accent-primary)"}} labelStyle={{color:"var(--text-secondary)"}}
                      formatter={(v:any) => [`${formatK(Number(v))} kg`]} />
                    <Bar dataKey="vol" fill="var(--accent-primary)" radius={[3,3,0,0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Hőtérkép */}
          {history.length > 0 && <WorkoutHeatmap workouts={history} />}

          {/* Top 5 gyakorlat — részletes */}
          {topDetailed.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{background:"var(--surface-1)"}}>
              <div className="px-4 py-3" style={{borderBottom:"1px solid var(--border-subtle)"}}>
                <div className="text-[9px] font-black tracking-widest" style={{color:"var(--text-muted)"}}>TOP 5 GYAKORLAT</div>
              </div>
              <div className="px-4 py-2 space-y-0">
                {topDetailed.map((ex, i) => {
                  const maxVol = topDetailed[0].volume;
                  const MEDALS = ["🥇","🥈","🥉"];
                  return (
                    <div key={ex.exerciseId} className="py-2.5" style={{borderBottom: i<topDetailed.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none"}}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{MEDALS[i] ?? `${i+1}.`}</span>
                          <span className="text-xs font-bold" style={{color:"var(--text-primary)"}}>{ex.name}</span>
                        </div>
                        <div className="flex gap-3 text-[9px]" style={{color:"var(--text-muted)"}}>
                          <span>{ex.sessions} session</span>
                          <span>{ex.totalSets} set</span>
                          <span className="font-bold" style={{color:"var(--accent-primary)"}}>{formatK(ex.volume)} kg</span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{background:"var(--surface-2)"}}>
                        <div className="h-full rounded-full transition-all"
                          style={{width:`${Math.round((ex.volume/maxVol)*100)}%`, background:"var(--accent-primary)", opacity: 1-i*0.12}} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Edzés frekvencia grafikon */}
          {history.length > 1 && (
            <div className="rounded-2xl overflow-hidden" style={{background:"var(--surface-1)"}}>
              <div className="px-4 py-3" style={{borderBottom:"1px solid var(--border-subtle)"}}>
                <div className="text-[9px] font-black tracking-widest" style={{color:"var(--text-muted)"}}>EDZÉS FREKVENCIA (HETI)</div>
              </div>
              <div className="px-2 pt-2 pb-3">
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={weekChart} margin={{top:4,right:0,left:-28,bottom:0}}>
                    <XAxis dataKey="week" tick={{fontSize:8,fill:"rgba(255,255,255,0.2)"}} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{background:"var(--bg-elevated)",border:"none",borderRadius:10,fontSize:11}}
                      itemStyle={{color:"#4ade80"}} labelStyle={{color:"var(--text-secondary)"}}
                      formatter={(v:any) => [`${v} edzés`]} />
                    <Bar dataKey="count" fill="#4ade80" radius={[3,3,0,0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* CSV Export */}
          {history.length > 0 && (
            <button onClick={() => exportWorkoutsCSV(history)}
              className="w-full rounded-2xl py-3 text-sm font-bold pressable"
              style={{background:"var(--surface-1)",color:"var(--text-muted)"}}>
              ↓ CSV exportálás
            </button>
          )}
        </div>
      )}

      {/* ── PR TAB ── */}
      {tab==="prs" && (
        <PRTab prs={prs} onSearch={() => {}}
          onOpenChart={(entry) => {
            setPrChartEntry(entry);
            setPrChartHistory(buildExerciseHistory(history, entry.exerciseId));
          }} />
      )}

      {/* ── HISTORY TAB ── */}
      {tab==="history" && (
        <div className="px-4 space-y-2">
          {isCloudPid(profileId) && cloudStatus==="wrong-user" && (
            <div className="rounded-2xl p-4 text-sm" style={{background:"rgba(239,68,68,0.08)",color:"#fca5a5"}}>
              {t.progress.cloud_wrong_user}
            </div>
          )}
          {cloudStatus==="loading" && (
            <div className="text-sm px-2" style={{color:"var(--text-muted)"}}>{t.progress.cloud_loading}</div>
          )}
          {history.length===0 && cloudStatus!=="loading" && (
            <div className="rounded-2xl p-10 text-center" style={{background:"var(--surface-0)"}}>
              <div className="text-3xl mb-2">🏋️</div>
              <div className="text-sm" style={{color:"var(--text-muted)"}}>{t.progress.no_workouts}</div>
            </div>
          )}
          {sorted.map(w => {
            const counts = workoutSetCounts(w);
            const vol = workoutVolume(w);
            const dur = fmtDuration(w);
            const exCount = workoutExerciseCount(w);
            return (
              <button key={w.id} onClick={() => { setSelectedId(w.id); setDetailOpen(true); }}
                className="w-full rounded-2xl p-4 text-left pressable"
                style={{background:"var(--surface-1)"}}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-black" style={{color:"var(--text-primary)"}}>{w.title || fmtDate(w.startedAt)}</div>
                    <div className="text-[10px] mt-0.5" style={{color:"var(--text-muted)"}}>{fmtDate(w.startedAt)}</div>
                  </div>
                  {dur && <div className="text-xs font-bold" style={{color:"var(--text-muted)"}}>{dur}</div>}
                </div>
                <div className="flex gap-3 text-[10px]" style={{color:"var(--text-muted)"}}>
                  <span>{exCount} gyakorlat</span>
                  <span>{counts.done} set</span>
                  <span style={{color:"var(--accent-primary)"}}>{formatK(vol)} kg</span>
                </div>
              </button>
            );
          })}
          {history.length > 0 && (
            <button onClick={clearAll} className="w-full rounded-2xl py-3 text-sm font-bold mt-2 pressable"
              style={{background:"rgba(239,68,68,0.06)",color:"#fca5a5"}}>
              Összes edzés törlése
            </button>
          )}
        </div>
      )}

    </div>
    <BottomNav />

    {/* WorkoutDetailSheet */}
    {selected && (
      <WorkoutDetailSheet open={detailOpen} onClose={() => { setDetailOpen(false); setSelectedId(null); }}
        workout={selected} onDelete={deleteWorkout} />
    )}

    {/* PR Chart Sheet */}
    {prChartEntry && (
      <PRChartSheet open={!!prChartEntry} onClose={() => setPrChartEntry(null)}
        entry={prChartEntry} history={prChartHistory} />
    )}
    </div>
  );
}
