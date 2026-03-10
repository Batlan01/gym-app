"use client";
import { useTranslation } from "@/lib/i18n";
import { LanguagePicker } from "@/components/LanguagePicker";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { BottomNav } from "@/components/BottomNav";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { lsGet, lsSet } from "@/lib/storage";
import { LS_ACTIVE_PROFILE, profileMetaKey, profileKey, isCloudProfileId, type ProfileMeta } from "@/lib/profiles";
import type { Workout } from "@/lib/types";
import { readWeightHistory, addWeightEntry, type WeightEntry } from "@/lib/weightStorage";
import { ACHIEVEMENTS, TIER_COLORS, calcXP, getLevel, checkNewAchievements, type UnlockedAchievement } from "@/lib/achievements";
import { topExercisesByVolume } from "@/lib/workoutMetrics";
import { THEMES, LS_THEME, applyTheme, type ThemeId } from "@/lib/theme";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

function calcStreak(workouts: Workout[]): number {
  if (!workouts.length) return 0;
  const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Array.from(new Set(workouts.map(w => sod(new Date(w.startedAt))))).sort((a,b) => b-a);
  let streak = 0, cursor = sod(new Date());
  for (const d of days) {
    if (d===cursor || d===cursor-86400000) { streak++; cursor=d-86400000; } else break;
  }
  return streak;
}
function totalVol(ws: Workout[]) {
  return ws.reduce((s,w) => s+w.exercises.reduce((s2,e) =>
    s2+e.sets.filter(st=>st.done).reduce((s3,st) => s3+((st.reps??0)*(st.weight??0)),0),0),0);
}
function fmtK(n: number) { return n>=1000 ? `${(n/1000).toFixed(1)}k` : `${Math.round(n)}`; }

// ── XP Level bar ─────────────────────────────────────────────
function LevelBar({ xp }: { xp: number }) {
  const lvl = getLevel(xp);
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-black" style={{color:"var(--accent-primary)"}}>Lvl {lvl.level} · {lvl.title}</span>
        <span className="text-[10px]" style={{color:"rgba(255,255,255,0.3)"}}>
          {lvl.next ? `${xp} / ${lvl.next.minXp} XP` : `${xp} XP · MAX`}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{width:`${Math.round(lvl.progress*100)}%`, background:"var(--accent-primary)"}} />
      </div>
    </div>
  );
}

// ── Weight Chart ──────────────────────────────────────────────
function WeightChart({ data, emptyLabel }: { data: WeightEntry[]; emptyLabel: string }) {
  const chartData = [...data].reverse().slice(-30).map(e => ({ date: e.date.slice(5), kg: e.weightKg }));
  if (chartData.length < 2) return (
    <div className="flex h-20 items-center justify-center text-xs" style={{color:"rgba(255,255,255,0.25)"}}>{emptyLabel}</div>
  );
  return (
    <ResponsiveContainer width="100%" height={90}>
      <LineChart data={chartData} margin={{top:4,right:4,left:-28,bottom:0}}>
        <XAxis dataKey="date" tick={{fontSize:9,fill:"rgba(255,255,255,0.25)"}} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{background:"#0d0d0f",border:"none",borderRadius:10,fontSize:12}}
          labelStyle={{color:"rgba(255,255,255,0.4)"}} itemStyle={{color:"var(--accent-primary)"}}
          formatter={(v:any) => [`${v} kg`]} />
        <Line type="monotone" dataKey="kg" stroke="var(--accent-primary)" strokeWidth={2}
          dot={false} activeDot={{r:3,fill:"var(--accent-primary)"}} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Achievement Badge ─────────────────────────────────────────
function AchBadge({ id, unlocked }: { id: string; unlocked: boolean }) {
  const a = ACHIEVEMENTS.find(x => x.id === id)!;
  const colors = TIER_COLORS[a.tier];
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all"
      style={unlocked ? { background: colors.bg, border: `1px solid ${colors.border}` }
        : { background: "rgba(255,255,255,0.03)", opacity: 0.35, filter: "grayscale(1)" }}>
      <div className="text-2xl">{a.icon}</div>
      <div className="text-center text-[10px] font-black leading-tight"
        style={{color: unlocked ? colors.text : "rgba(255,255,255,0.3)"}}>{a.title}</div>
      <div className="text-[9px]" style={{color: unlocked ? colors.text : "rgba(255,255,255,0.2)", opacity:0.7}}>+{a.xp} XP</div>
    </div>
  );
}

// ── Weight Modal ──────────────────────────────────────────────
function WeightModal({ current, onSave, onClose, labels }: {
  current?: number; onSave: (kg: number) => void; onClose: () => void;
  labels: { title: string; cancel: string; save: string };
}) {
  const [val, setVal] = React.useState(current ? String(current) : "");
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center" style={{paddingBottom:"env(safe-area-inset-bottom)"}}>
      <button className="absolute inset-0" style={{background:"rgba(0,0,0,0.7)"}} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl p-6" style={{background:"#0d0d0f"}}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{background:"rgba(255,255,255,0.12)"}} />
        <div className="text-base font-black mb-4" style={{color:"var(--text-primary)"}}>{labels.title}</div>
        <div className="flex items-center gap-3">
          <input value={val} onChange={e => setVal(e.target.value)} inputMode="decimal" placeholder="82.5"
            className="flex-1 rounded-2xl px-4 py-4 text-2xl font-black text-center outline-none"
            style={{background:"rgba(255,255,255,0.06)", color:"var(--text-primary)"}} />
          <span className="text-base font-bold" style={{color:"rgba(255,255,255,0.3)"}}>kg</span>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-2xl py-3.5 text-sm font-bold pressable"
            style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)"}}>{labels.cancel}</button>
          <button onClick={() => { const n=parseFloat(val.replace(",",".")); if(n>0) { onSave(n); onClose(); }}}
            className="flex-1 rounded-2xl py-3.5 text-sm font-black pressable"
            style={{background:"var(--accent-primary)",color:"#000"}}>{labels.save}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ProfilePage() {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const pid = activeProfileId ?? "guest";
  const [meta, setMeta] = React.useState<ProfileMeta | null>(null);
  const [workouts] = useLocalStorageState<Workout[]>(
    React.useMemo(() => profileKey(pid, "workouts"), [pid]), []
  );
  const [weightHistory, setWeightHistory] = React.useState<WeightEntry[]>([]);
  const [unlocked, setUnlocked] = React.useState<UnlockedAchievement[]>([]);
  const [tab, setTab] = React.useState<"stats"|"achievements"|"settings">("stats");
  const [weightModal, setWeightModal] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [savedTheme, setSavedTheme] = React.useState<ThemeId>("cyan");
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [editName, setEditName] = React.useState("");
  const [editAge, setEditAge] = React.useState("");
  const [editHeight, setEditHeight] = React.useState("");
  const [editGoal, setEditGoal] = React.useState("maintain");
  const [editLevel, setEditLevel] = React.useState("beginner");
  const [editPlace, setEditPlace] = React.useState("gym");
  const [editDays, setEditDays] = React.useState("");

  React.useEffect(() => {
    const m = lsGet<ProfileMeta|null>(profileMetaKey(pid), null);
    setMeta(m);
    if (m) {
      setEditName(m.fullName ?? ""); setEditAge(m.age != null ? String(m.age) : "");
      setEditHeight(m.heightCm != null ? String(m.heightCm) : "");
      setEditGoal(m.goal ?? "maintain"); setEditLevel(m.level ?? "beginner");
      setEditPlace(m.trainingPlace ?? "gym");
      setEditDays(m.daysPerWeek != null ? String(m.daysPerWeek) : "");
    }
    setWeightHistory(readWeightHistory(pid));
    setUnlocked(lsGet<UnlockedAchievement[]>(profileKey(pid,"achievements"), []));
    setSavedTheme((localStorage.getItem(LS_THEME) as ThemeId) ?? "cyan");
  }, [pid]);

  React.useEffect(() => {
    if (!workouts.length) return;
    const newOnes = checkNewAchievements({ workouts, weightHistory, streak: calcStreak(workouts) }, unlocked);
    if (newOnes.length) { const m = [...unlocked, ...newOnes]; setUnlocked(m); lsSet(profileKey(pid,"achievements"), m); }
  }, [workouts, weightHistory]);

  function saveMeta(patch: Partial<ProfileMeta>) {
    const next = { ...meta, ...patch } as ProfileMeta;
    setMeta(next); lsSet(profileMetaKey(pid), next);
  }
  function saveEdit() {
    saveMeta({ fullName: editName.trim() || undefined, age: editAge ? parseInt(editAge) : null,
      heightCm: editHeight ? parseInt(editHeight) : null, goal: editGoal as any,
      level: editLevel as any, trainingPlace: editPlace as any,
      daysPerWeek: editDays ? parseInt(editDays) : null });
    setEditMode(false);
  }
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeProfileId) return;
    setAvatarUploading(true);
    try {
      let url = "";
      if (isCloudProfileId(activeProfileId)) {
        const uid = activeProfileId.replace("fb:","");
        const storageRef = ref(storage, `avatars/${uid}/profile.jpg`);
        await uploadBytes(storageRef, file);
        url = await getDownloadURL(storageRef);
      } else {
        const reader = new FileReader();
        url = await new Promise(res => { reader.onload = () => res(reader.result as string); reader.readAsDataURL(file); });
      }
      saveMeta({ avatarUrl: url } as any);
    } finally { setAvatarUploading(false); }
  }

  const streak = React.useMemo(() => calcStreak(workouts), [workouts]);
  const vol = React.useMemo(() => totalVol(workouts), [workouts]);
  const topEx = React.useMemo(() => topExercisesByVolume(workouts, 3), [workouts]);
  const xp = React.useMemo(() => calcXP(workouts, unlocked), [workouts, unlocked]);
  const unlockedIds = new Set(unlocked.map(u => u.id));
  const avatarUrl = (meta as any)?.avatarUrl ?? null;
  const name = meta?.fullName ?? null;
  const initials = name ? name.split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase() : "?";

  // Translated goal/level labels
  const GOAL_LABELS: Record<string,string> = {
    lose: t.profile.goal_lose, maintain: t.profile.goal_maintain, gain: t.profile.goal_gain
  };
  const LEVEL_LABELS: Record<string,string> = {
    beginner: t.profile.level_beginner, intermediate: t.profile.level_mid, advanced: t.profile.level_advanced
  };

  const TABS = [
    { id: "stats" as const, label: t.profile.tab_stats },
    { id: "achievements" as const, label: t.profile.tab_achievements },
    { id: "settings" as const, label: t.profile.tab_appearance },
  ];

  return (
    <div className="flex flex-col" style={{minHeight:"100dvh"}}>
    <div className="flex-1 pb-32 animate-in">

      {/* ── HERO ── */}
      <div className="px-4 pt-10 pb-5">
        <div className="text-[10px] font-black tracking-widest mb-4" style={{color:"rgba(255,255,255,0.25)"}}>ARCX</div>
        <div className="flex items-center gap-4 mb-5">
          <button onClick={() => fileRef.current?.click()} className="relative shrink-0 pressable" disabled={avatarUploading}>
            <div className="h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{background:"var(--accent-primary)"}}>
              {avatarUrl ? <img src={avatarUrl} className="h-full w-full object-cover" alt="avatar" />
                : <span className="text-xl font-black" style={{color:"#000"}}>{initials}</span>}
            </div>
            <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-lg text-[10px] font-black"
              style={{background:"rgba(255,255,255,0.15)",color:"#fff"}}>{avatarUploading ? "…" : "✎"}</div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-black truncate" style={{color:"var(--text-primary)"}}>
              {name ?? t.profile.unnamed}
            </div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {meta?.goal && (
                <span className="rounded-lg px-2 py-0.5 text-[10px] font-black"
                  style={{background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)"}}>
                  {GOAL_LABELS[meta.goal] ?? meta.goal}
                </span>
              )}
              {meta?.level && (
                <span className="rounded-lg px-2 py-0.5 text-[10px] font-black"
                  style={{background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)"}}>
                  {LEVEL_LABELS[meta.level] ?? meta.level}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => router.push("/settings")}
            className="h-10 w-10 rounded-2xl flex items-center justify-center pressable shrink-0"
            style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)"}}>⚙️</button>
        </div>
        <LevelBar xp={xp} />
        <button onClick={() => setEditMode(true)}
          className="mt-4 w-full rounded-2xl py-3 text-sm font-black pressable"
          style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)"}}>
          {t.profile.edit_btn}
        </button>
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex gap-1 px-4 mb-4">
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className="flex-1 rounded-2xl py-2.5 text-[11px] font-black pressable"
            style={tab===tb.id
              ? { background: "var(--accent-primary)", color: "#000" }
              : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── STATS TAB ── */}
      {tab==="stats" && (
        <div className="px-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              {label:t.profile.stat_workouts, value:String(workouts.length)},
              {label:t.profile.stat_streak, value:streak ? `${streak}` : "—", unit:streak ? t.profile.stat_streak_unit : undefined},
              {label:t.profile.stat_volume, value:fmtK(vol), unit:vol>0?"kg":undefined},
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center" style={{background:"rgba(255,255,255,0.04)"}}>
                <div className="text-2xl font-black leading-none" style={{color:"var(--accent-primary)"}}>{s.value}</div>
                {s.unit && <div className="text-[9px] font-bold mt-0.5" style={{color:"rgba(255,255,255,0.3)"}}>{s.unit}</div>}
                <div className="text-[10px] font-semibold mt-1" style={{color:"rgba(255,255,255,0.3)"}}>{s.label}</div>
              </div>
            ))}
          </div>

          {topEx.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,0.04)"}}>
              <div className="px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>{t.profile.top_exercises}</div>
              </div>
              {topEx.map((e,i) => (
                <div key={e.name} className="flex items-center gap-3 px-4 py-3"
                  style={{borderBottom: i<topEx.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none"}}>
                  <div className="text-sm font-black w-5 text-center" style={{color:"var(--accent-primary)"}}>{i+1}</div>
                  <div className="flex-1 text-sm font-semibold" style={{color:"var(--text-primary)"}}>{e.name}</div>
                  <div className="text-xs font-bold" style={{color:"rgba(255,255,255,0.3)"}}>{fmtK(e.volume)} kg</div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,0.04)"}}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>{t.profile.weight}</div>
              <button onClick={() => setWeightModal(true)}
                className="rounded-xl px-3 py-1.5 text-[11px] font-black pressable"
                style={{background:"var(--accent-primary)",color:"#000"}}>{t.profile.weight_add}</button>
            </div>
            <div className="px-4 pt-3 pb-2">
              {weightHistory.length > 0 && (
                <div className="text-3xl font-black mb-1" style={{color:"var(--text-primary)"}}>
                  {weightHistory[0].weightKg}
                  <span className="text-sm font-normal ml-1" style={{color:"rgba(255,255,255,0.3)"}}>kg</span>
                </div>
              )}
              <WeightChart data={weightHistory} emptyLabel={t.profile.weight_chart_min} />
            </div>
          </div>
        </div>
      )}

      {/* ── ACHIEVEMENTS TAB ── */}
      {tab==="achievements" && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>
              {unlockedIds.size} / {ACHIEVEMENTS.length} {t.profile.achievements_count}
            </div>
            <div className="rounded-xl px-3 py-1.5 text-xs font-black"
              style={{background:"var(--accent-primary)",color:"#000"}}>{xp} {t.profile.xp_label}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ACHIEVEMENTS.map(a => <AchBadge key={a.id} id={a.id} unlocked={unlockedIds.has(a.id)} />)}
          </div>
        </div>
      )}

      {/* ── MEGJELENÉS TAB ── */}
      {tab==="settings" && (
        <div className="px-4 space-y-3">
          {/* Téma */}
          <div className="rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,0.04)"}}>
            <div className="px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>{t.profile.theme_label}</div>
            </div>
            <div className="grid grid-cols-5 gap-2 p-3">
              {THEMES.map(th => (
                <button key={th.id} onClick={() => { applyTheme(th.id); setSavedTheme(th.id); }}
                  className="flex flex-col items-center gap-1.5 rounded-2xl py-3 pressable"
                  style={savedTheme===th.id ? { background: th.vars["--accent-primary"] } : { background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-4 w-4 rounded-full"
                    style={{ background: savedTheme===th.id ? "rgba(0,0,0,0.25)" : th.vars["--accent-primary"] }} />
                  <div className="text-[9px] font-black"
                    style={{color: savedTheme===th.id ? "#000" : "rgba(255,255,255,0.35)"}}>{th.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Nyelv / Language picker */}
          <div className="rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,0.04)"}}>
            <div className="px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>{t.profile.lang_label}</div>
            </div>
            <div className="p-3">
              <LanguagePicker currentLang={lang} />
            </div>
          </div>

          {/* Settings link */}
          <button onClick={() => router.push("/settings")}
            className="w-full rounded-2xl p-4 text-left pressable flex items-center justify-between"
            style={{background:"rgba(255,255,255,0.04)"}}>
            <div>
              <div className="text-sm font-black" style={{color:"var(--text-primary)"}}>{t.profile.tech_settings}</div>
              <div className="text-xs mt-0.5" style={{color:"rgba(255,255,255,0.3)"}}>{t.profile.tech_settings_sub}</div>
            </div>
            <span style={{color:"rgba(255,255,255,0.3)"}}>→</span>
          </button>
        </div>
      )}
    </div>

    {/* ── WEIGHT MODAL ── */}
    {weightModal && (
      <WeightModal current={weightHistory[0]?.weightKg}
        labels={{title:t.profile.weight_modal_title, cancel:t.common.cancel, save:t.common.save}}
        onSave={kg => { addWeightEntry(pid, kg); setWeightHistory(readWeightHistory(pid)); }}
        onClose={() => setWeightModal(false)} />
    )}

    {/* ── EDIT PROFIL MODAL ── */}
    {editMode && (
      <div className="fixed inset-0 z-[80] flex flex-col overflow-y-auto"
        style={{background:"#0a0a0c", paddingBottom:"env(safe-area-inset-bottom)"}}>
        <div className="mx-auto w-full max-w-md px-4 pt-8 pb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="text-lg font-black" style={{color:"var(--text-primary)"}}>{t.profile.edit_title}</div>
            <button onClick={() => setEditMode(false)}
              className="rounded-xl px-3 py-2 text-sm font-bold pressable"
              style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)"}}>
              {t.common.cancel}
            </button>
          </div>
          <div className="space-y-4">
            {[
              {label:t.profile.edit_name, value:editName, set:setEditName, type:"text"},
              {label:t.profile.edit_age, value:editAge, set:setEditAge, type:"number"},
              {label:t.profile.edit_height, value:editHeight, set:setEditHeight, type:"number"},
            ].map(f => (
              <div key={f.label}>
                <div className="text-[9px] font-black tracking-widest mb-1.5" style={{color:"rgba(255,255,255,0.25)"}}>{f.label}</div>
                <input value={f.value} onChange={e => f.set(e.target.value)} type={f.type}
                  className="w-full rounded-2xl px-4 py-3.5 text-sm font-bold outline-none"
                  style={{background:"rgba(255,255,255,0.06)", color:"var(--text-primary)"}} />
              </div>
            ))}
            <div>
              <div className="text-[9px] font-black tracking-widest mb-2" style={{color:"rgba(255,255,255,0.25)"}}>{t.profile.edit_goal}</div>
              <div className="grid grid-cols-3 gap-2">
                {[{v:"lose",l:t.profile.goal_lose},{v:"maintain",l:t.profile.goal_maintain},{v:"gain",l:t.profile.goal_gain}].map(x => (
                  <button key={x.v} onClick={() => setEditGoal(x.v)}
                    className="rounded-2xl py-3 text-xs font-black pressable"
                    style={editGoal===x.v ? {background:"var(--accent-primary)",color:"#000"} : {background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.45)"}}>
                    {x.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-black tracking-widest mb-2" style={{color:"rgba(255,255,255,0.25)"}}>{t.profile.edit_level}</div>
              <div className="grid grid-cols-3 gap-2">
                {[{v:"beginner",l:t.profile.level_beginner},{v:"intermediate",l:t.profile.level_mid},{v:"advanced",l:t.profile.level_advanced}].map(x => (
                  <button key={x.v} onClick={() => setEditLevel(x.v)}
                    className="rounded-2xl py-3 text-xs font-black pressable"
                    style={editLevel===x.v ? {background:"var(--accent-primary)",color:"#000"} : {background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.45)"}}>
                    {x.l}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveEdit}
              className="w-full rounded-2xl py-4 text-sm font-black pressable mt-2"
              style={{background:"var(--accent-primary)",color:"#000"}}>
              {t.common.save}
            </button>
          </div>
        </div>
      </div>
    )}

    <BottomNav />
    </div>
  );
}
