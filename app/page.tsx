"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE, profileKey, profileMetaKey, type ProfileMeta } from "@/lib/profiles";
import type { Workout } from "@/lib/types";

// --- helpers ---
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function calcStreak(workouts: Workout[]): number {
  if (!workouts.length) return 0;
  const days = Array.from(new Set(
    workouts.map(w => startOfDay(new Date(w.startedAt)).getTime())
  )).sort((a, b) => b - a);
  let streak = 0;
  let cursor = startOfDay(new Date()).getTime();
  for (const d of days) {
    if (d === cursor || d === cursor - 86400000) {
      streak++;
      cursor = d - 86400000;
    } else break;
  }
  return streak;
}
function totalVolumeMonth(workouts: Workout[]): number {
  const cutoff = Date.now() - 30 * 86400000;
  return workouts
    .filter(w => new Date(w.startedAt).getTime() > cutoff)
    .reduce((sum, w) => sum + w.exercises.reduce((s, e) =>
      s + e.sets.filter(st => st.done).reduce((ss, st) =>
        ss + ((st.reps ?? 0) * (st.weight ?? 0)), 0), 0), 0);
}
function formatK(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`;
}
function getLastWorkout(workouts: Workout[]): Workout | null {
  if (!workouts.length) return null;
  return [...workouts].sort((a, b) =>
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
}
function workoutsThisWeek(workouts: Workout[]): Set<number> {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const mon = startOfDay(new Date(now));
  mon.setDate(now.getDate() - ((day + 6) % 7)); // Monday
  const result = new Set<number>();
  for (const w of workouts) {
    const d = startOfDay(new Date(w.startedAt));
    const diff = Math.round((d.getTime() - mon.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) result.add(diff);
  }
  return result;
}

// --- WeekStrip ---
const DAYS = ["H", "K", "Sz", "Cs", "P", "Sz", "V"];
function WeekStrip({ activeDays }: { activeDays: Set<number> }) {
  return (
    <div className="flex gap-2 justify-between">
      {DAYS.map((label, i) => {
        const active = activeDays.has(i);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
              style={{
                background: active ? 'var(--accent-green)' : 'rgba(255,255,255,0.06)',
                color: active ? '#000' : 'rgba(255,255,255,0.35)',
                boxShadow: active ? '0 0 10px rgba(74,222,128,0.4)' : 'none',
              }}
            >
              {active ? '✓' : label}
            </div>
            <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

// --- HeroCard ---
function HeroCard({ lastWorkout, hasActiveToday }: { lastWorkout: Workout | null; hasActiveToday: boolean }) {
  const router = useRouter();
  const subtitle = lastWorkout
    ? `Utolsó: ${new Date(lastWorkout.startedAt).toLocaleDateString("hu", { weekday: "long" })} — ${lastWorkout.exercises.length} gyakorlat`
    : "Még nincs mentett edzésed";

  return (
    <button
      onClick={() => router.push("/workout")}
      className="w-full text-left pressable"
    >
      <div
        className="relative overflow-hidden rounded-3xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(34,211,238,0.05) 100%)',
          border: '1px solid rgba(34,211,238,0.25)',
        }}
      >
        {/* glow blob */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl"
          style={{ background: 'rgba(34,211,238,0.12)' }} />

        <div className="label-xs mb-2" style={{ color: 'var(--accent-primary)' }}>MAI EDZÉS</div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {hasActiveToday ? "Folytatás →" : "Edzés indítása →"}
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold"
          style={{ background: 'var(--accent-primary)', color: '#000' }}>
          {hasActiveToday ? "Folytatás" : "Kezdés"}
        </div>
      </div>
    </button>
  );
}

// --- StatPill ---
function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex-1 rounded-2xl p-3 text-center"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="text-base">{icon}</div>
      <div className="mt-1 text-base font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

// --- QuickTile ---
function QuickTile({ title, subtitle, href, accent }: {
  title: string; subtitle: string; href: string;
  accent: "cyan" | "green" | "amber";
}) {
  const colors = {
    cyan:  { glow: 'rgba(34,211,238,0.1)',  border: 'rgba(34,211,238,0.2)',  dot: '#22d3ee' },
    green: { glow: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.18)', dot: '#4ade80' },
    amber: { glow: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.18)', dot: '#fbbf24' },
  }[accent];

  return (
    <Link href={href} className="block pressable">
      <div className="relative overflow-hidden rounded-2xl p-4"
        style={{ background: 'var(--bg-card)', border: `1px solid ${colors.border}`, minHeight: '88px' }}>
        <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl"
          style={{ background: colors.glow }} />
        <div className="mb-2 h-1 w-4 rounded-full" style={{ background: colors.dot }} />
        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</div>
        <div className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</div>
      </div>
    </Link>
  );
}

// --- Main Page ---
export default function Home() {
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const profileId = activeProfileId ?? "guest";

  const lsKey = React.useMemo(() => profileKey(profileId, "workouts"), [profileId]);
  const [workouts] = useLocalStorageState<Workout[]>(lsKey, []);

  const [meta] = useLocalStorageState<ProfileMeta | null>(
    React.useMemo(() => profileMetaKey(profileId), [profileId]),
    null
  );

  const streak = React.useMemo(() => calcStreak(workouts), [workouts]);
  const monthVol = React.useMemo(() => totalVolumeMonth(workouts), [workouts]);
  const monthCount = React.useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return workouts.filter(w => new Date(w.startedAt).getTime() > cutoff).length;
  }, [workouts]);
  const lastWorkout = React.useMemo(() => getLastWorkout(workouts), [workouts]);
  const activeDays = React.useMemo(() => workoutsThisWeek(workouts), [workouts]);
  const hasActiveToday = activeDays.has((new Date().getDay() + 6) % 7);

  const greeting = React.useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Jó reggelt";
    if (h < 18) return "Jó napot";
    return "Jó estét";
  }, []);

  const name = meta?.fullName?.split(" ")[0] ?? null;

  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-8 pb-32 animate-in">

        {/* Header */}
        <header className="mb-5 flex items-center justify-between">
          <div>
            <div className="label-xs mb-1">GYM WEBAPP</div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {greeting}{name ? `, ${name}` : ""}
            </h1>
          </div>
          {/* Profil / Settings gomb */}
          <Link href="/settings"
            className="flex h-11 w-11 items-center justify-center rounded-full pressable shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.18), rgba(34,211,238,0.06))',
              border: '1px solid rgba(34,211,238,0.3)',
            }}>
            <span className="text-lg font-black" style={{ color: 'var(--accent-primary)' }}>
              {name ? name[0].toUpperCase() : "⚙"}
            </span>
          </Link>
        </header>

        {/* Hero */}
        <HeroCard lastWorkout={lastWorkout} hasActiveToday={hasActiveToday} />

        {/* Stat sor */}
        <div className="mt-4 flex gap-2">
          <StatPill icon="🔥" label="streak" value={streak ? `${streak} nap` : "—"} />
          <StatPill icon="💪" label="30 nap" value={`${monthCount} edzés`} />
          <StatPill icon="📈" label="volume" value={monthVol > 0 ? formatK(monthVol) : "—"} />
        </div>

        {/* Heti naptár */}
        <div className="mt-4 rounded-2xl p-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="label-xs mb-3">EZEN A HÉTEN</div>
          <WeekStrip activeDays={activeDays} />
        </div>

        {/* Gyors akciók */}
        <div className="mt-5">
          <div className="label-xs mb-3">GYORS ELÉRÉS</div>
          <div className="grid grid-cols-3 gap-3">
            <QuickTile title="Programok" subtitle="Sablonok" href="/programs" accent="green" />
            <QuickTile title="Statisztika" subtitle="Haladás" href="/progress" accent="cyan" />
            <QuickTile title="Gyakorlatok" subtitle="Katalógus" href="/exercises" accent="amber" />
          </div>
        </div>

      </main>
      <BottomNav />
    </>
  );
}
