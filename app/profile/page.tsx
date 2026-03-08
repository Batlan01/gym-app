"use client";
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

// ── Helpers ──────────────────────────────────────────────────
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
const PLACE_LABEL: Record<string,string> = {gym:"Terem",home:"Otthon",mixed:"Vegyes"};
const LEVEL_LABEL: Record<string,string> = {beginner:"Kezdő",intermediate:"Középhaladó",advanced:"Haladó"};

// ── XP Level bar ─────────────────────────────────────────────
function LevelBar({ xp }: { xp: number }) {
  const lvl = getLevel(xp);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-bold" style={{color:"var(--accent-primary)"}}>
          Lvl {lvl.level} · {lvl.title}
        </span>
        <span style={{color:"var(--text-muted)"}}>
          {lvl.next ? `${xp} / ${lvl.next.minXp} XP` : `${xp} XP · MAX`}
        </span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden" style={{background:"var(--bg-card)"}}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{width:`${Math.round(lvl.progress*100)}%`, background:"var(--accent-primary)"}} />
      </div>
    </div>
  );
}

// ── Weight Chart ──────────────────────────────────────────────
function WeightChart({ data }: { data: WeightEntry[] }) {
  const chartData = [...data].reverse().slice(-30).map(e => ({
    date: e.date.slice(5),
    kg: e.weightKg,
  }));
  if (chartData.length < 2) return (
    <div className="flex h-24 items-center justify-center text-sm" style={{color:"var(--text-muted)"}}>
      Legalább 2 mérés kell a grafikonhoz
    </div>
  );
  return (
    <ResponsiveContainer width="100%" height={100}>
      <LineChart data={chartData} margin={{top:4,right:4,left:-28,bottom:0}}>
        <XAxis dataKey="date" tick={{fontSize:9,fill:"rgba(255,255,255,0.3)"}} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{background:"var(--bg-elevated)",border:"1px solid var(--border-mid)",borderRadius:12,fontSize:12}}
          labelStyle={{color:"var(--text-muted)"}}
          itemStyle={{color:"var(--accent-primary)"}}
          formatter={(v:any) => [`${v} kg`]} />
        <Line type="monotone" dataKey="kg" stroke="var(--accent-primary)" strokeWidth={2}
          dot={false} activeDot={{r:4,fill:"var(--accent-primary)"}} />
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
      style={unlocked ? {
        background: colors.bg, border: `1px solid ${colors.border}`,
      } : {
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
        opacity: 0.45, filter: "grayscale(1)",
      }}>
      <div className="text-2xl">{a.icon}</div>
      <div className="text-center text-[10px] font-bold leading-tight" style={{color: unlocked ? colors.text : "var(--text-muted)"}}>
        {a.title}
      </div>
      <div className="text-[9px]" style={{color: unlocked ? colors.text : "var(--text-muted)", opacity:0.7}}>
        +{a.xp} XP
      </div>
    </div>
  );
}

// ── Add Weight Modal ──────────────────────────────────────────
function WeightModal({ current, onSave, onClose }: {
  current?: number; onSave: (kg: number) => void; onClose: () => void;
}) {
  const [val, setVal] = React.useState(current ? String(current) : "");
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center"
      style={{paddingBottom:"env(safe-area-inset-bottom)"}}>
      <button className="absolute inset-0" style={{background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)"}} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-[2rem] p-6"
        style={{background:"var(--bg-elevated)",borderTop:"1px solid var(--border-mid)"}}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{background:"var(--border-mid)"}} />
        <div className="text-base font-bold mb-4" style={{color:"var(--text-primary)"}}>⚖️ Súly felvétele</div>
        <div className="flex gap-3">
          <input value={val} onChange={e => setVal(e.target.value)} inputMode="decimal"
            placeholder="pl. 82.5"
            className="flex-1 rounded-2xl px-4 py-3 text-lg font-bold text-center outline-none"
            style={{background:"var(--bg-card)",border:"1px solid var(--border-mid)",color:"var(--text-primary)"}} />
          <span className="flex items-center text-sm" style={{color:"var(--text-muted)"}}>kg</span>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-2xl py-3 text-sm pressable"
            style={{background:"var(--bg-card)",color:"var(--text-muted)",border:"1px solid var(--border-subtle)"}}>
            Mégse
          </button>
          <button onClick={() => { const n=parseFloat(val.replace(",",".")); if(n>0) { onSave(n); onClose(); }}}
            className="flex-1 rounded-2xl py-3 text-sm font-bold pressable"
            style={{background:"rgba(34,211,238,0.15)",color:"var(--accent-primary)",border:"1px solid rgba(34,211,238,0.3)"}}>
            Mentés ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ProfilePage() {
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

  // Lokális meta szerk mezők
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
      setEditName(m.fullName ?? "");
      setEditAge(m.age != null ? String(m.age) : "");
      setEditHeight(m.heightCm != null ? String(m.heightCm) : "");
      setEditGoal(m.goal ?? "maintain");
      setEditLevel(m.level ?? "beginner");
      setEditPlace(m.trainingPlace ?? "gym");
      setEditDays(m.daysPerWeek != null ? String(m.daysPerWeek) : "");
    }
    setWeightHistory(readWeightHistory(pid));
    setUnlocked(lsGet<UnlockedAchievement[]>(profileKey(pid,"achievements"), []));
    setSavedTheme((localStorage.getItem(LS_THEME) as ThemeId) ?? "cyan");
  }, [pid]);

  // Achievement check
  React.useEffect(() => {
    if (!workouts.length) return;
    const streak = calcStreak(workouts);
    const data = { workouts, weightHistory, streak };
    const newOnes = checkNewAchievements(data, unlocked);
    if (newOnes.length) {
      const merged = [...unlocked, ...newOnes];
      setUnlocked(merged);
      lsSet(profileKey(pid,"achievements"), merged);
    }
  }, [workouts, weightHistory]);

  function saveMeta(patch: Partial<ProfileMeta>) {
    const next = { ...meta, ...patch } as ProfileMeta;
    setMeta(next);
    lsSet(profileMetaKey(pid), next);
  }

  function saveEdit() {
    saveMeta({
      fullName: editName.trim() || undefined,
      age: editAge ? parseInt(editAge) : null,
      heightCm: editHeight ? parseInt(editHeight) : null,
      goal: editGoal as any,
      level: editLevel as any,
      trainingPlace: editPlace as any,
      daysPerWeek: editDays ? parseInt(editDays) : null,
    });
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
        // localStorage fallback: base64
        const reader = new FileReader();
        url = await new Promise(res => { reader.onload = () => res(reader.result as string); reader.readAsDataURL(file); });
      }
      saveMeta({ avatarUrl: url } as any);
    } finally {
      setAvatarUploading(false);
    }
  }

  const streak = React.useMemo(() => calcStreak(workouts), [workouts]);
  const vol = React.useMemo(() => totalVol(workouts), [workouts]);
  const topEx = React.useMemo(() => topExercisesByVolume(workouts, 3), [workouts]);
  const xp = React.useMemo(() => calcXP(workouts, unlocked), [workouts, unlocked]);
  const unlockedIds = new Set(unlocked.map(u => u.id));
  const avatarUrl = (meta as any)?.avatarUrl ?? null;
  const name = meta?.fullName ?? null;
  const initials = name ? name.split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase() : "?";

  return (
    <div className="flex flex-col" style={{minHeight:"100dvh"}}>
    <div className="flex-1 pb-32 animate-in">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden px-4 pt-12 pb-6"
        style={{background:"linear-gradient(160deg,rgba(34,211,238,0.1) 0%,transparent 60%)"}}>
        <button onClick={() => router.push("/settings")}
          className="absolute top-4 right-4 rounded-full p-2 pressable"
          style={{background:"var(--bg-card)",color:"var(--text-muted)"}}>⚙️</button>

        <div className="flex items-end gap-4">
          {/* Avatar */}
          <button onClick={() => fileRef.current?.click()}
            className="relative shrink-0 pressable" disabled={avatarUploading}>
            <div className="h-20 w-20 rounded-full overflow-hidden flex items-center justify-center"
              style={{background:"linear-gradient(135deg,rgba(34,211,238,0.3),rgba(34,211,238,0.1))",
                border:"2px solid rgba(34,211,238,0.4)"}}>
              {avatarUrl
                ? <img src={avatarUrl} className="h-full w-full object-cover" alt="avatar" />
                : <span className="text-2xl font-black" style={{color:"var(--accent-primary)"}}>{initials}</span>}
            </div>
            <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full text-xs"
              style={{background:"var(--accent-primary)",color:"#000"}}>
              {avatarUploading ? "…" : "📷"}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </button>

          {/* Név + szint */}
          <div className="flex-1 min-w-0">
            <div className="text-xl font-black truncate" style={{color:"var(--text-primary)"}}>
              {name ?? "Névtelen"}
            </div>
            <div className="flex gap-2 mt-1 flex-wrap">
              {meta?.goal && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{background:"rgba(34,211,238,0.12)",color:"var(--accent-primary)"}}>
                {GOAL_LABEL[meta.goal]}
              </span>}
              {meta?.level && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{background:"rgba(74,222,128,0.12)",color:"#4ade80"}}>
                {LEVEL_LABEL[meta.level]}
              </span>}
            </div>
            <div className="mt-2">
              <LevelBar xp={xp} />
            </div>
          </div>
        </div>

        <button onClick={() => setEditMode(true)}
          className="mt-4 w-full rounded-2xl py-2.5 text-sm font-semibold pressable"
          style={{background:"rgba(255,255,255,0.05)",color:"var(--text-muted)",border:"1px solid var(--border-subtle)"}}>
          ✏️ Profil szerkesztése
        </button>
      </div>

      {/* ── TAB BAR ── */}
      <div className="sticky top-0 z-40 flex gap-1 px-4 py-2"
        style={{background:"rgba(8,11,15,0.92)",backdropFilter:"blur(16px)",borderBottom:"1px solid var(--border-subtle)"}}>
        {(["stats","achievements","settings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 rounded-xl py-2.5 text-xs font-bold transition-all pressable"
            style={tab===t ? {background:"var(--bg-elevated)",color:"var(--text-primary)"}
              : {color:"var(--text-muted)"}}>
            {t==="stats" ? "📊 Statisztika" : t==="achievements" ? `🏆 Achievem.` : "🎨 Megj."}
          </button>
        ))}
      </div>

      {/* ── STATS TAB ── */}
      {tab==="stats" && (
        <div className="px-4 py-4 space-y-4">
          {/* Stat grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {label:"Edzés",value:String(workouts.length),icon:"💪"},
              {label:"Streak",value:streak ? `${streak}n` : "—",icon:"🔥"},
              {label:"Volume",value:fmtK(vol),icon:"📈"},
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-3 text-center"
                style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)"}}>
                <div className="text-lg">{s.icon}</div>
                <div className="text-lg font-black mt-1" style={{color:"var(--accent-primary)"}}>{s.value}</div>
                <div className="text-[10px] mt-0.5" style={{color:"var(--text-muted)"}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Top exercises */}
          {topEx.length > 0 && (
            <div className="rounded-3xl p-4"
              style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)"}}>
              <div className="label-xs mb-3">TOP GYAKORLATOK</div>
              {topEx.map((e,i) => (
                <div key={e.name} className="flex items-center gap-3 py-2"
                  style={{borderBottom: i<topEx.length-1 ? "1px solid var(--border-subtle)" : "none"}}>
                  <div className="text-sm font-black w-5" style={{color:"var(--accent-primary)"}}>{i+1}</div>
                  <div className="flex-1 text-sm" style={{color:"var(--text-primary)"}}>{e.name}</div>
                  <div className="text-xs" style={{color:"var(--text-muted)"}}>{fmtK(e.volume)} kg</div>
                </div>
              ))}
            </div>
          )}

          {/* Weight tracker */}
          <div className="rounded-3xl p-4"
            style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)"}}>
            <div className="flex items-center justify-between mb-3">
              <div className="label-xs">TESTSÚLY</div>
              <button onClick={() => setWeightModal(true)}
                className="rounded-xl px-3 py-1.5 text-xs font-bold pressable"
                style={{background:"rgba(34,211,238,0.1)",color:"var(--accent-primary)",border:"1px solid rgba(34,211,238,0.25)"}}>
                + Felvétel
              </button>
            </div>
            {weightHistory.length > 0 && (
              <div className="text-2xl font-black mb-2" style={{color:"var(--text-primary)"}}>
                {weightHistory[0].weightKg} <span className="text-sm font-normal" style={{color:"var(--text-muted)"}}>kg</span>
              </div>
            )}
            <WeightChart data={weightHistory} />
          </div>
        </div>
      )}

      {/* ── ACHIEVEMENTS TAB ── */}
      {tab==="achievements" && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="label-xs">ACHIEVEMENTEK</div>
              <div className="text-xs mt-1" style={{color:"var(--text-muted)"}}>
                {unlockedIds.size} / {ACHIEVEMENTS.length} feloldva
              </div>
            </div>
            <div className="rounded-2xl px-3 py-2 text-sm font-black"
              style={{background:"rgba(34,211,238,0.12)",color:"var(--accent-primary)"}}>
              {xp} XP
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ACHIEVEMENTS.map(a => (
              <AchBadge key={a.id} id={a.id} unlocked={unlockedIds.has(a.id)} />
            ))}
          </div>
        </div>
      )}

      {/* ── MEGJELENÉS / SETTINGS TAB ── */}
      {tab==="settings" && (
        <div className="px-4 py-4 space-y-4">
          {/* Téma */}
          <div className="rounded-3xl p-4" style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)"}}>
            <div className="label-xs mb-3">TÉMA SZÍN</div>
            <div className="grid grid-cols-5 gap-2">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => { applyTheme(t.id); setSavedTheme(t.id); }}
                  className="flex flex-col items-center gap-1.5 rounded-2xl py-3 pressable transition-all"
                  style={savedTheme===t.id
                    ? {background:t.vars["--accent-primary-dim"],border:`1px solid ${t.vars["--accent-primary-border"]}`}
                    : {background:"var(--bg-card)",border:"1px solid var(--border-subtle)"}}>
                  <div className="h-5 w-5 rounded-full" style={{background:t.vars["--accent-primary"]}} />
                  <div className="text-[10px]" style={{color:"var(--text-muted)"}}>{t.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Nyelv (placeholder) */}
          <div className="rounded-3xl p-4" style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)"}}>
            <div className="label-xs mb-3">NYELV</div>
            <div className="grid grid-cols-2 gap-2">
              {[{id:"hu",label:"🇭🇺 Magyar"},{id:"en",label:"🇬🇧 English"}].map(l => (
                <button key={l.id}
                  className="rounded-2xl py-3 text-sm font-semibold pressable"
                  style={l.id==="hu"
                    ? {background:"rgba(34,211,238,0.12)",color:"var(--accent-primary)",border:"1px solid rgba(34,211,238,0.3)"}
                    : {background:"var(--bg-card)",color:"var(--text-muted)",border:"1px solid var(--border-subtle)"}}>
                  {l.label} {l.id==="en" && <span className="text-[10px]">(hamarosan)</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Settings link */}
          <button onClick={() => router.push("/settings")}
            className="w-full rounded-3xl p-4 text-left pressable"
            style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)"}}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold" style={{color:"var(--text-primary)"}}>⚙️ Technikai beállítások</div>
                <div className="text-xs mt-0.5" style={{color:"var(--text-muted)"}}>Sync, fiók, onboarding</div>
              </div>
              <span style={{color:"var(--text-muted)"}}>→</span>
            </div>
          </button>
        </div>
      )}
    </div>

    {/* Weight modal */}
    {weightModal && (
      <WeightModal
        current={weightHistory[0]?.weightKg}
        onSave={kg => { addWeightEntry(pid, kg); setWeightHistory(readWeightHistory(pid)); }}
        onClose={() => setWeightModal(false)} />
    )}

    {/* Edit profil modal */}
    {editMode && (
      <div className="fixed inset-0 z-[80] flex flex-col overflow-y-auto"
        style={{background:"rgba(8,11,15,0.97)",paddingBottom:"env(safe-area-inset-bottom)"}}>
        <div className="mx-auto w-full max-w-md px-4 pt-6 pb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="text-lg font-black" style={{color:"var(--text-primary)"}}>✏️ Profil szerkesztése</div>
            <button onClick={() => setEditMode(false)} className="text-sm pressable" style={{color:"var(--text-muted)"}}>Mégse</button>
          </div>
          <div className="space-y-3">
            {[
              {label:"Név",value:editName,set:setEditName,type:"text",placeholder:"Teljes neved"},
              {label:"Kor",value:editAge,set:setEditAge,type:"number",placeholder:"éves"},
              {label:"Magasság (cm)",value:editHeight,set:setEditHeight,type:"number",placeholder:"cm"},
            ].map(f => (
              <div key={f.label}>
                <div className="label-xs mb-1">{f.label.toUpperCase()}</div>
                <input value={f.value} onChange={e => f.set(e.target.value)}
                  type={f.type} placeholder={f.placeholder}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",color:"var(--text-primary)"}} />
              </div>
            ))}
            {/* Cél */}
            <div>
              <div className="label-xs mb-2">CÉL</div>
              <div className="grid grid-cols-3 gap-2">
                {[{v:"lose",l:"Fogyás"},{v:"maintain",l:"Szinten"},{v:"gain",l:"Tömegelés"}].map(x => (
                  <button key={x.v} onClick={() => setEditGoal(x.v)}
                    className="rounded-2xl py-2.5 text-xs font-semibold pressable"
                    style={editGoal===x.v
                      ? {background:"rgba(34,211,238,0.15)",color:"var(--accent-primary)",border:"1px solid rgba(34,211,238,0.3)"}
                      : {background:"var(--bg-card)",color:"var(--text-muted)",border:"1px solid var(--border-subtle)"}}>
                    {x.l}
                  </button>
                ))}
              </div>
            </div>
            {/* Szint */}
            <div>
              <div className="label-xs mb-2">SZINT</div>
              <div className="grid grid-cols-3 gap-2">
                {[{v:"beginner",l:"Kezdő"},{v:"intermediate",l:"Közép"},{v:"advanced",l:"Haladó"}].map(x => (
                  <button key={x.v} onClick={() => setEditLevel(x.v)}
                    className="rounded-2xl py-2.5 text-xs font-semibold pressable"
                    style={editLevel===x.v
                      ? {background:"rgba(34,211,238,0.15)",color:"var(--accent-primary)",border:"1px solid rgba(34,211,238,0.3)"}
                      : {background:"var(--bg-card)",color:"var(--text-muted)",border:"1px solid var(--border-subtle)"}}>
                    {x.l}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveEdit}
              className="w-full rounded-2xl py-3.5 text-sm font-black pressable mt-2"
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
