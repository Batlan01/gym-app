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
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

function isCloudPid(p: string) { return p.startsWith("fb:"); }
function cloudUid(p: string) { return p.startsWith("fb:") ? p.slice(3).trim() : null; }

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
function calcStreak(workouts: Workout[]): number {
  if (!workouts.length) return 0;
  const days = Array.from(new Set(workouts.map(w => startOfDay(new Date(w.startedAt))))).sort((a,b)=>b-a);
  let streak = 0, cursor = startOfDay(new Date());
  for (const d of days) {
    if (d===cursor||d===cursor-86400000){streak++;cursor=d-86400000;}else break;
  }
  return streak;
}

// Volume per day chart data (last 30 days)
function buildVolumeChart(workouts: Workout[]) {
  const map = new Map<string, number>();
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    map.set(d.toISOString().slice(0,10), 0);
  }
  for (const w of workouts) {
    const key = new Date(w.startedAt).toISOString().slice(0,10);
    if (map.has(key)) map.set(key, (map.get(key)??0) + workoutVolume(w));
  }
  return Array.from(map.entries()).map(([date, vol]) => ({
    date: date.slice(5), vol: Math.round(vol),
  }));
}

// Workouts per week (last 8 weeks)
function buildWeeklyChart(workouts: Workout[]) {
  const weeks: {week: string; count: number}[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(Date.now() - (i+1)*7*86400000);
    const end   = new Date(Date.now() - i*7*86400000);
    const count = workouts.filter(w => {
      const t = new Date(w.startedAt).getTime();
      return t >= start.getTime() && t < end.getTime();
    }).length;
    const label = `${start.getMonth()+1}/${start.getDate()}`;
    weeks.push({week: label, count});
  }
  return weeks;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("hu", {month:"short",day:"2-digit",weekday:"short"});
}
function fmtDuration(w: Workout) {
  if (!w.finishedAt) return null;
  const mins = Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000);
  return mins >= 60 ? `${Math.floor(mins/60)}ó ${mins%60}p` : `${mins}p`;
}

export default function ProgressPage() {
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const profileId = activeProfileId ?? GUEST_PROFILE_ID;
  const LS_HISTORY = React.useMemo(() => profileKey(profileId, "workouts"), [profileId]);
  const [localHistory, setLocalHistory] = useLocalStorageState<Workout[]>(LS_HISTORY, []);
  const [cloudHistory, setCloudHistory] = React.useState<Workout[] | null>(null);
  const [cloudStatus, setCloudStatus] = React.useState<"idle"|"loading"|"ready"|"wrong-user">("idle");
  const [tab, setTab] = React.useState<"overview"|"history">("overview");
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [chartMode, setChartMode] = React.useState<"volume"|"frequency">("volume");

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

  const streak = React.useMemo(() => calcStreak(history), [history]);
  const totalVol = React.useMemo(() => history.reduce((a,w) => a+workoutVolume(w), 0), [history]);
  const last7count = history.filter(w => withinLastDays(w, 7)).length;
  const last30count = history.filter(w => withinLastDays(w, 30)).length;
  const top = React.useMemo(() => topExercisesByVolume(history, 5), [history]);
  const volChart = React.useMemo(() => buildVolumeChart(history), [history]);
  const weekChart = React.useMemo(() => buildWeeklyChart(history), [history]);

  const selected = React.useMemo(() =>
    selectedId ? history.find(w => w.id === selectedId) ?? null : null, [history, selectedId]);

  const deleteWorkout = React.useCallback(async () => {
    if (!selectedId) return;
    if (!window.confirm("Törlöd ezt az edzést?")) return;
    if (usingCloud) {
      const uid = cloudUid(profileId);
      const user = auth.currentUser;
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

  return (
    <div className="flex flex-col" style={{minHeight:"100dvh"}}>
    <div className="flex-1 pb-32 animate-in">

      {/* ── HEADER ── */}
      <div className="px-4 pt-12 pb-4">
        <div className="label-xs mb-1">ARCX</div>
        <h1 className="text-2xl font-black" style={{color:"var(--text-primary)"}}>Progress</h1>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="px-4 grid grid-cols-2 gap-2 mb-4">
        {[
          {label:"Összes edzés", value: String(history.length), icon:"💪", sub: `${last30count} az elmúlt 30 napban`},
          {label:"Leghosszabb streak", value: streak ? `${streak} nap` : "—", icon:"🔥", sub: `${last7count} edzés 7 napban`},
          {label:"Összes volume", value: formatK(totalVol), icon:"📈", sub:"kg összesen"},
          {label:"Átlag/hét", value: history.length ? `${(last30count/4).toFixed(1)}` : "—", icon:"📅", sub:"edzés/hét (30n)"},
        ].map(s => (
          <div key={s.label} className="rounded-3xl p-4"
            style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)"}}>
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-xl font-black" style={{color:"var(--accent-primary)"}}>{s.value}</div>
            <div className="text-[10px] font-bold mt-0.5" style={{color:"var(--text-primary)"}}>{s.label}</div>
            <div className="text-[10px] mt-0.5" style={{color:"var(--text-muted)"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── CHART ── */}
      {history.length > 1 && (
        <div className="mx-4 rounded-3xl p-4 mb-4"
          style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)"}}>
          <div className="flex items-center justify-between mb-3">
            <div className="label-xs">GRAFIKON</div>
            <div className="flex gap-1">
              {(["volume","frequency"] as const).map(m => (
                <button key={m} onClick={() => setChartMode(m)}
                  className="rounded-xl px-3 py-1 text-[10px] font-bold pressable"
                  style={chartMode===m
                    ? {background:"rgba(34,211,238,0.15)",color:"var(--accent-primary)",border:"1px solid rgba(34,211,238,0.3)"}
                    : {background:"var(--bg-card)",color:"var(--text-muted)",border:"1px solid var(--border-subtle)"}}>
                  {m==="volume" ? "Volume" : "Frekvencia"}
                </button>
              ))}
            </div>
          </div>
          {chartMode==="volume" ? (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={volChart} margin={{top:4,right:0,left:-28,bottom:0}}>
                <XAxis dataKey="date" tick={{fontSize:8,fill:"rgba(255,255,255,0.25)"}} tickLine={false} axisLine={false}
                  interval={6} />
                <Tooltip contentStyle={{background:"var(--bg-elevated)",border:"1px solid var(--border-mid)",borderRadius:12,fontSize:11}}
                  itemStyle={{color:"var(--accent-primary)"}} labelStyle={{color:"var(--text-muted)"}}
                  formatter={(v:any) => [`${formatK(Number(v))} kg`]} />
                <Bar dataKey="vol" fill="var(--accent-primary)" radius={[4,4,0,0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={weekChart} margin={{top:4,right:0,left:-28,bottom:0}}>
                <XAxis dataKey="week" tick={{fontSize:8,fill:"rgba(255,255,255,0.25)"}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{background:"var(--bg-elevated)",border:"1px solid var(--border-mid)",borderRadius:12,fontSize:11}}
                  itemStyle={{color:"var(--accent-green)"}} labelStyle={{color:"var(--text-muted)"}}
                  formatter={(v:any) => [`${v} edzés`]} />
                <Bar dataKey="count" fill="var(--accent-green)" radius={[4,4,0,0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── TOP EXERCISES ── */}
      {top.length > 0 && (
        <div className="mx-4 rounded-3xl p-4 mb-4"
          style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)"}}>
          <div className="label-xs mb-3">TOP GYAKORLATOK</div>
          {top.map((t,i) => {
            const maxVol = top[0].volume;
            return (
              <div key={t.name} className="mb-2 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{color:"var(--text-primary)"}}>{i+1}. {t.name}</span>
                  <span style={{color:"var(--text-muted)"}}>{formatK(t.volume)} kg</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{background:"var(--bg-card)"}}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{width:`${Math.round((t.volume/maxVol)*100)}%`,background:"var(--accent-primary)",opacity:1-i*0.15}} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB BAR ── */}
      <div className="sticky top-0 z-40 flex gap-1 px-4 py-2 mb-2"
        style={{background:"rgba(8,11,15,0.92)",backdropFilter:"blur(16px)",borderBottom:"1px solid var(--border-subtle)"}}>
        {(["overview","history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 rounded-xl py-2.5 text-xs font-bold pressable"
            style={tab===t
              ? {background:"var(--bg-elevated)",color:"var(--text-primary)"}
              : {color:"var(--text-muted)"}}>
            {t==="overview" ? "📊 Áttekintés" : `📋 Edzések (${history.length})`}
          </button>
        ))}
      </div>

      {/* ── HISTORY LIST ── */}
      {tab==="history" && (
        <div className="px-4 space-y-2">
          {/* Cloud hibák */}
          {isCloudPid(profileId) && cloudStatus==="wrong-user" && (
            <div className="rounded-3xl p-4 text-sm"
              style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",color:"#fca5a5"}}>
              Cloud profil aktív, de nincs bejelentkezve. Lépj be újra.
            </div>
          )}
          {cloudStatus==="loading" && (
            <div className="rounded-3xl p-4 text-sm" style={{color:"var(--text-muted)"}}>
              Cloud adatok betöltése…
            </div>
          )}
          {history.length===0 && cloudStatus!=="loading" && (
            <div className="rounded-3xl p-8 text-center"
              style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)"}}>
              <div className="text-3xl mb-2">🏋️</div>
              <div className="text-sm" style={{color:"var(--text-muted)"}}>Még nincs mentett edzés</div>
            </div>
          )}
          {sorted.map(w => {
            const counts = workoutSetCounts(w);
            const vol = workoutVolume(w);
            const exCount = workoutExerciseCount(w);
            const dur = fmtDuration(w);
            return (
              <button key={w.id} onClick={() => { setSelectedId(w.id); setDetailOpen(true); }}
                className="w-full rounded-3xl p-4 text-left pressable"
                style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)"}}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-sm font-bold" style={{color:"var(--text-primary)"}}>
                    {w.title || fmtDate(w.startedAt)}
                  </div>
                  <div className="text-xs shrink-0" style={{color:"var(--text-muted)"}}>
                    {new Date(w.startedAt).toLocaleDateString("hu",{month:"short",day:"2-digit"})}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    {icon:"🏋️", val:`${exCount} gyakorlat`},
                    {icon:"✅", val:`${counts.done}/${counts.total} set`},
                    {icon:"📈", val:`${formatK(vol)} kg`},
                    ...(dur ? [{icon:"⏱", val:dur}] : []),
                  ].map(chip => (
                    <span key={chip.val} className="rounded-xl px-2.5 py-1 text-[11px]"
                      style={{background:"var(--bg-card)",color:"var(--text-secondary)",border:"1px solid var(--border-subtle)"}}>
                      {chip.icon} {chip.val}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
          {history.length > 0 && (
            <button onClick={clearAll} className="w-full rounded-3xl py-3 text-xs pressable mt-2"
              style={{background:"rgba(239,68,68,0.08)",color:"rgba(239,68,68,0.6)",border:"1px solid rgba(239,68,68,0.15)"}}>
              🗑 Összes edzés törlése
            </button>
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
