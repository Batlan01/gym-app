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
const GOAL_LABEL: Record<string,string> = {lose:"Fogyás",maintain:"Szinten tartás",gain:"Tömegelés"};
const LEVEL_LABEL: Record<string,string> = {beginner:"Kezdő",intermediate:"Középhaladó",advanced:"Haladó"};

// ── XP Level bar ─────────────────────────────────────────────
function LevelBar({ xp }: { xp: number }) {
  const lvl = getLevel(xp);
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-black" style={{color:"var(--accent-primary)"}}>
          Lvl {lvl.level} · {lvl.title}
        </span>
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
function WeightChart({ data }: { data: WeightEntry[] }) {
  const chartData = [...data].reverse().slice(-30).map(e => ({ date: e.date.slice(5), kg: e.weightKg }));
  if (chartData.length < 2) return (
    <div className="flex h-20 items-center justify-center text-xs" style={{color:"rgba(255,255,255,0.25)"}}>
      Legalább 2 mérés kell a grafikonhoz
    </div>
  );
  return (
    <ResponsiveContainer width="100%" height={90}>
      <LineChart data={chartData} margin={{top:4,right:4,left:-28,bottom:0}}>
        <XAxis dataKey="date" tick={{fontSize:9,fill:"rgba(255,255,255,0.25)"}} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{background:"#0d0d0f",border:"none",borderRadius:10,fontSize:12}}
          labelStyle={{color:"rgba(255,255,255,0.4)"}}
          itemStyle={{color:"var(--accent-primary)"}}
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
      style={unlocked
        ? { background: colors.bg, border: `1px solid ${colors.border}` }
        : { background: "rgba(255,255,255,0.03)", opacity: 0.35, filter: "grayscale(1)" }}>
      <div className="text-2xl">{a.icon}</div>
      <div className="text-center text-[10px] font-black leading-tight"
        style={{color: unlocked ? colors.text : "rgba(255,255,255,0.3)"}}>
        {a.title}
      </div>
      <div className="text-[9px]" style={{color: unlocked ? colors.text : "rgba(255,255,255,0.2)", opacity:0.7}}>
        +{a.xp} XP
      </div>
    </div>
  );
}

// ── Weight Modal ──────────────────────────────────────────────
function WeightModal({ current, onSave, onClose }: {
  current?: number; onSave: (kg: number) => void; onClose: () => void;
}) {
  const [val, setVal] = React.useState(current ? String(current) : "");
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center"
      style={{paddingBottom:"env(safe-area-inset-bottom)"}}>
      <button className="absolute inset-0" style={{background:"rgba(0,0,0,0.7)"}} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl p-6" style={{background:"#0d0d0f"}}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{background:"rgba(255,255,255,0.12)"}} />
        <div className="text-base font-black mb-4" style={{color:"var(--text-primary)"}}>Súly felvétele</div>
        <div className="flex items-center gap-3">
          <input value={val} onChange={e => setVal(e.target.value)} inputMode="decimal"
            placeholder="82.5"
            className="flex-1 rounded-2xl px-4 py-4 text-2xl font-black text-center outline-none"
            style={{background:"rgba(255,255,255,0.06)", color:"var(--text-primary)"}} />
          <span className="text-base font-bold" style={{color:"rgba(255,255,255,0.3)"}}>kg</span>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-2xl py-3.5 text-sm font-bold pressable"
            style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)"}}>
            Mégse
          </button>
          <button onClick={() => { const n=parseFloat(val.replace(",",".")); if(n>0) { onSave(n); onClose(); }}}
            className="flex-1 rounded-2xl py-3.5 text-sm font-black pressable"
            style={{background:"var(--accent-primary)",color:"#000"}}>
            Mentés ✓
          </button>
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
  const [editGoal, setEditGoal] = React.useState("");
  const [editLevel, setEditLevel] = React.useState("");
  const [editPlace, setEditPlace] = React.useState("");
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

  const TABS = [
    { id: "stats", label: t.profile.tab_stats },
    { id: "achievements", label: t.profile.tab_achievements },
    { id: "settings", label: t.profile.tab_appearance },
  ] as const;

  return (
    <div className="flex flex-col" style={{minHeight:"100dvh"}}>
    <div className="flex-1 pb-32 animate-in">

      {/* ── HERO ── */}
      <div className="px-4 pt-10 pb-5">
        <div className="text-[10px] font-black tracking-widest mb-4" style={{color:"rgba(255,255,255,0.25)"}}>ARCX</div>

        <div className="flex items-center gap-4 mb-5">
          {/* Avatar */}
          <button onClick={() => fileRef.current?.click()} className="relative shrink-0 pressable" disabled={avatarUploading}>
            <div className="h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{background:"var(--accent-primary)"}}>
              {avatarUrl
                ? <img src={avatarUrl} className="h-full w-full object-cover" alt="avatar" />
                : <span className="text-xl font-black" style={{color:"#000"}}>{initials}</span>}
            </div>
            <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-lg text-[10px] font-black"
              style={{background:"rgba(255,255,255,0.15)",color:"#fff"}}>
              {avatarUploading ? "…" : "✎"}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </button>

          {/* Név + tagek */}
          <div className="flex-1 min-w-0">
            <div className="text-xl font-black truncate" style={{color:"var(--text-primary)"}}>
              {name ?? "Névtelen"}
            </div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {meta?.goal && (
                <span className="rounded-lg px-2 py-0.5 text-[10px] font-black"
                  style={{background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)"}}>
                  {GOAL_LABEL[meta.goal]}
                </span>
              )}
              {meta?.level && (
                <span className="rounded-lg px-2 py-0.5 text-[10px] font-black"
                  style={{background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)"}}>
                  {LEVEL_LABEL[meta.level]}
                </span>
              )}
            </div>
          </div>

          {/* Settings ikon */}
          <button onClick={() => router.push("/settings")}
            className="h-10 w-10 rounded-2xl flex items-center justify-center pressable shrink-0"
            style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)"}}>
            ⚙️
          </button>
        </div>

        {/* XP bar */}
        <LevelBar xp={xp} />

        {/* Profil szerk gomb */}
        <button onClick={() => setEditMode(true)}
          className="mt-4 w-full rounded-2xl py-3 text-sm font-black pressable"
          style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)"}}>
          Profil szerkesztése
        </button>
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

      {/* ── STATS TAB ── */}
      {tab==="stats" && (
        <div className="px-4 space-y-3">
          {/* Stat blokkok — nagy számok */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {label:"Edzés",value:String(workouts.length)},
              {label:"Streak",value:streak ? `${streak}` : "—",unit:streak ? "nap" : undefined},
              {label:"Volume",value:fmtK(vol),unit:vol>0?"kg":undefined},
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center"
                style={{background:"rgba(255,255,255,0.04)"}}>
                <div className="text-2xl font-black leading-none" style={{color:"var(--accent-primary)"}}>
                  {s.value}
                </div>
                {s.unit && <div className="text-[9px] font-bold mt-0.5" style={{color:"rgba(255,255,255,0.3)"}}>{s.unit}</div>}
                <div className="text-[10px] font-semibold mt-1" style={{color:"rgba(255,255,255,0.3)"}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Top gyakorlatok */}
          {topEx.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,0.04)"}}>
              <div className="px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>TOP GYAKORLATOK</div>
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

          {/* Testsúly */}
          <div className="rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,0.04)"}}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>TESTSÚLY</div>
              <button onClick={() => setWeightModal(true)}
                className="rounded-xl px-3 py-1.5 text-[11px] font-black pressable"
                style={{background:"var(--accent-primary)",color:"#000"}}>
                + Felvétel
              </button>
            </div>
            <div className="px-4 pt-3 pb-2">
              {weightHistory.length > 0 && (
                <div className="text-3xl font-black mb-1" style={{color:"var(--text-primary)"}}>
                  {weightHistory[0].weightKg}
                  <span className="text-sm font-normal ml-1" style={{color:"rgba(255,255,255,0.3)"}}>kg</span>
                </div>
              )}
              <WeightChart data={weightHistory} />
            </div>
          </div>
        </div>
      )}

      {/* ── ACHIEVEMENTS TAB ── */}
      {tab==="achievements" && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>
              {unlockedIds.size} / {ACHIEVEMENTS.length} FELOLDVA
            </div>
            <div className="rounded-xl px-3 py-1.5 text-xs font-black"
              style={{background:"var(--accent-primary)",color:"#000"}}>
              {xp} XP
            </div>
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
              <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>TÉMA SZÍN</div>
            </div>
            <div className="grid grid-cols-5 gap-2 p-3">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => { applyTheme(t.id); setSavedTheme(t.id); }}
                  className="flex flex-col items-center gap-1.5 rounded-2xl py-3 pressable"
                  style={savedTheme===t.id
                    ? { background: t.vars["--accent-primary"], }
                    : { background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-4 w-4 rounded-full"
                    style={{ background: savedTheme===t.id ? "rgba(0,0,0,0.25)" : t.vars["--accent-primary"] }} />
                  <div className="text-[9px] font-black"
                    style={{color: savedTheme===t.id ? "#000" : "rgba(255,255,255,0.35)"}}>{t.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Nyelv */}
          <div className="rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,0.04)"}}>
            <div className="px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>NYELV</div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {[{id:"hu",label:"🇭🇺 Magyar"},{id:"en",label:"🇬🇧 English (hamarosan)"}].map(l => (
                <button key={l.id}
                  className="rounded-2xl py-3 text-sm font-black pressable"
                  style={l.id==="hu"
                    ? {background:"var(--accent-primary)",color:"#000"}
                    : {background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.25)"}}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings link */}
          <button onClick={() => router.push("/settings")}
            className="w-full rounded-2xl p-4 text-left pressable flex items-center justify-between"
            style={{background:"rgba(255,255,255,0.04)"}}>
            <div>
              <div className="text-sm font-black" style={{color:"var(--text-primary)"}}>{t.profile.tech_settings}</div>
              <div className="text-xs mt-0.5" style={{color:"rgba(255,255,255,0.3)"}}>Sync, fiók, onboarding</div>
            </div>
            <span style={{color:"rgba(255,255,255,0.3)"}}>→</span>
          </button>
        </div>
      )}
    </div>

    {/* Weight modal */}
    {weightModal && (
      <WeightModal current={weightHistory[0]?.weightKg}
        onSave={kg => { addWeightEntry(pid, kg); setWeightHistory(readWeightHistory(pid)); }}
        onClose={() => setWeightModal(false)} />
    )}

    {/* Edit profil modal */}
    {editMode && (
      <div className="fixed inset-0 z-[80] flex flex-col overflow-y-auto"
        style={{background:"#0a0a0c",paddingBottom:"env(safe-area-inset-bottom)"}}>
        <div className="mx-auto w-full max-w-md px-4 pt-8 pb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="text-lg font-black" style={{color:"var(--text-primary)"}}>Profil szerkesztése</div>
            <button onClick={() => setEditMode(false)}
              className="rounded-xl px-3 py-2 text-sm font-bold pressable"
              style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)"}}>
              Mégse
            </button>
          </div>
          <div className="space-y-4">
            {[
              {label:"NÉV",value:editName,set:setEditName,type:"text",placeholder:"Teljes neved"},
              {label:"KOR",value:editAge,set:setEditAge,type:"number",placeholder:"éves"},
              {label:"MAGASSÁG (CM)",value:editHeight,set:setEditHeight,type:"number",placeholder:"cm"},
            ].map(f => (
              <div key={f.label}>
                <div className="text-[9px] font-black tracking-widest mb-1.5" style={{color:"rgba(255,255,255,0.25)"}}>{f.label}</div>
                <input value={f.value} onChange={e => f.set(e.target.value)}
                  type={f.type} placeholder={f.placeholder}
                  className="w-full rounded-2xl px-4 py-3.5 text-sm font-bold outline-none"
                  style={{background:"rgba(255,255,255,0.06)",color:"var(--text-primary)"}} />
              </div>
            ))}
            <div>
              <div className="text-[9px] font-black tracking-widest mb-2" style={{color:"rgba(255,255,255,0.25)"}}>CÉL</div>
              <div className="grid grid-cols-3 gap-2">
                {[{v:"lose",l:"Fogyás"},{v:"maintain",l:"Szinten"},{v:"gain",l:"Tömegelés"}].map(x => (
                  <button key={x.v} onClick={() => setEditGoal(x.v)}
                    className="rounded-2xl py-3 text-xs font-black pressable"
                    style={editGoal===x.v
                      ? {background:"var(--accent-primary)",color:"#000"}
                      : {background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.45)"}}>
                    {x.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-black tracking-widest mb-2" style={{color:"rgba(255,255,255,0.25)"}}>SZINT</div>
              <div className="grid grid-cols-3 gap-2">
                {[{v:"beginner",l:"Kezdő"},{v:"intermediate",l:"Közép"},{v:"advanced",l:"Haladó"}].map(x => (
                  <button key={x.v} onClick={() => setEditLevel(x.v)}
                    className="rounded-2xl py-3 text-xs font-black pressable"
                    style={editLevel===x.v
                      ? {background:"var(--accent-primary)",color:"#000"}
                      : {background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.45)"}}>
                    {x.l}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveEdit}
              className="w-full rounded-2xl py-4 text-sm font-black pressable mt-2"
              style={{background:"var(--accent-primary)",color:"#000"}}>
              Mentés ✓
            </button>
          </div>
        </div>
      </div>
    )}

    <BottomNav />
    </div>
  );
}
