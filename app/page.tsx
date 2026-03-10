"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE, profileKey, profileMetaKey, type ProfileMeta } from "@/lib/profiles";
import { PROGRAM_TEMPLATES } from "@/lib/programTemplates";
import type { Workout } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

// ─── helpers ────────────────────────────────────────────────────────────────
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
    if (d === cursor || d === cursor - 86400000) { streak++; cursor = d - 86400000; }
    else break;
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
  const mon = startOfDay(new Date(now));
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const result = new Set<number>();
  for (const w of workouts) {
    const d = startOfDay(new Date(w.startedAt));
    const diff = Math.round((d.getTime() - mon.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) result.add(diff);
  }
  return result;
}

// ─── Day labels per language ──────────────────────────────────────────────────
const WEEK_DAYS: Record<string, string[]> = {
  hu: ["H","K","Sz","Cs","P","Sz","V"],
  en: ["M","T","W","T","F","S","S"],
  de: ["Mo","Di","Mi","Do","Fr","Sa","So"],
  es: ["L","M","X","J","V","S","D"],
  sk: ["Po","Ut","St","Št","Pi","So","Ne"],
  cs: ["Po","Út","St","Čt","Pá","So","Ne"],
};

// ─── WeekStrip ───────────────────────────────────────────────────────────────
function WeekStrip({ activeDays, days }: { activeDays: Set<number>; days: string[] }) {
  return (
    <div className="flex gap-1.5">
      {days.map((label, i) => {
        const done = activeDays.has(i);
        const isToday = i === (new Date().getDay() + 6) % 7;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all"
              style={done
                ? { background: "var(--accent-primary)", color: "#000" }
                : isToday
                  ? { background: "rgba(255,255,255,0.08)", color: "var(--accent-primary)", outline: "1px solid var(--accent-primary)" }
                  : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)" }
              }>
              {done ? "✓" : label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── StatBlock ────────────────────────────────────────────────────────────────
function StatBlock({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="flex-1 rounded-2xl p-4"
      style={{
        background: accent ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: accent ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.05)",
      }}>
      <div className="text-2xl font-black leading-none"
        style={{ color: accent ? "var(--accent-primary)" : "var(--text-primary)" }}>
        {value}
      </div>
      <div className="text-[10px] font-semibold mt-1.5 uppercase tracking-wider"
        style={{ color: "rgba(255,255,255,0.3)" }}>
        {label}
      </div>
    </div>
  );
}

// ─── ProgramsRow ─────────────────────────────────────────────────────────────
const SPORT_EMOJI: Record<string, string> = { gym:"🏋️", home:"🏠", running:"🏃", boxing:"🥊", yoga:"🧘" };
const SPORT_BG: Record<string, string> = {
  gym:     "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  home:    "linear-gradient(135deg, #1a2e1a 0%, #162116 100%)",
  running: "linear-gradient(135deg, #2e1a1a 0%, #211616 100%)",
  boxing:  "linear-gradient(135deg, #2e1a2e 0%, #211621 100%)",
  yoga:    "linear-gradient(135deg, #1a2a2e 0%, #162021 100%)",
};

function ProgramsRow({ label, allLabel, perWeek }: { label: string; allLabel: string; perWeek: string }) {
  const router = useRouter();
  const shown = PROGRAM_TEMPLATES.slice(0, 4);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-black tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</div>
        <button onClick={() => router.push("/programs")} className="text-[10px] font-bold pressable"
          style={{ color: "var(--accent-primary)" }}>{allLabel}</button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {shown.map((p) => (
          <button key={p.id} onClick={() => router.push("/programs")}
            className="shrink-0 rounded-2xl p-3 pressable text-left"
            style={{ width: 110, background: SPORT_BG[p.sport ?? "gym"] ?? SPORT_BG.gym, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-2xl mb-2">{SPORT_EMOJI[p.sport ?? "gym"] ?? "🏋️"}</div>
            <div className="text-[11px] font-black leading-tight" style={{ color: "var(--text-primary)" }}>{p.title}</div>
            <div className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{p.sessions?.length ?? 0} {perWeek}</div>
          </button>
        ))}
        <button onClick={() => router.push("/programs")}
          className="shrink-0 rounded-2xl p-3 pressable flex flex-col items-center justify-center"
          style={{ width: 80, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-xl mb-1">＋</div>
          <div className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>{allLabel}</div>
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const { t, lang } = useTranslation();
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const profileId = activeProfileId ?? "guest";
  const lsKey = React.useMemo(() => profileKey(profileId, "workouts"), [profileId]);
  const [workouts] = useLocalStorageState<Workout[]>(lsKey, []);
  const [meta] = useLocalStorageState<ProfileMeta | null>(
    React.useMemo(() => profileMetaKey(profileId), [profileId]), null
  );
  const streak    = React.useMemo(() => calcStreak(workouts), [workouts]);
  const monthVol  = React.useMemo(() => totalVolumeMonth(workouts), [workouts]);
  const monthCount = React.useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return workouts.filter(w => new Date(w.startedAt).getTime() > cutoff).length;
  }, [workouts]);
  const lastWorkout = React.useMemo(() => getLastWorkout(workouts), [workouts]);
  const activeDays  = React.useMemo(() => workoutsThisWeek(workouts), [workouts]);
  const hasActiveToday = activeDays.has((new Date().getDay() + 6) % 7);
  const greeting = React.useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t.home.greeting_morning;
    if (h < 18) return t.home.greeting_afternoon;
    return t.home.greeting_evening;
  }, [t]);
  const name = meta?.fullName?.split(" ")[0] ?? null;
  const weekDays = WEEK_DAYS[lang] ?? WEEK_DAYS.hu;

  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-10 pb-32">

        {/* ── HEADER ── */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[10px] font-black tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>ARCX</div>
            <h1 className="text-2xl font-black leading-tight" style={{ color: "var(--text-primary)" }}>
              {greeting}{name ? "," : ""}<br />
              {name ? <span style={{ color: "var(--accent-primary)" }}>{name}</span> : ""}
            </h1>
          </div>
          <Link href="/profile" className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 pressable"
            style={{ background: "var(--accent-primary)" }}>
            <span className="text-base font-black" style={{ color: "#000" }}>
              {name ? name[0].toUpperCase() : "👤"}
            </span>
          </Link>
        </header>

        {/* ── HERO ── */}
        <button onClick={() => {}} className="w-full text-left pressable">
          <Link href="/workout" className="block">
            <div className="relative overflow-hidden rounded-3xl" style={{ background: "var(--accent-primary)" }}>
              <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage: "repeating-linear-gradient(-45deg, #000 0px, #000 1px, transparent 1px, transparent 8px)" }} />
              <div className="relative p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-[10px] font-black tracking-widest" style={{ color: "rgba(0,0,0,0.5)" }}>
                    {hasActiveToday ? t.home.hero_active : t.home.hero_today}
                  </div>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: "rgba(0,0,0,0.15)" }}>
                      <span className="text-xs">🔥</span>
                      <span className="text-xs font-black" style={{ color: "#000" }}>{streak}</span>
                    </div>
                  )}
                </div>
                <div className="text-3xl font-black leading-none mb-1" style={{ color: "#000" }}>
                  {hasActiveToday ? t.home.hero_continue : t.home.hero_start}
                </div>
                <div className="text-sm font-medium mt-1" style={{ color: "rgba(0,0,0,0.5)" }}>
                  {lastWorkout
                    ? `${t.home.hero_last}: ${new Date(lastWorkout.startedAt).toLocaleDateString(lang, { weekday: "long" })}`
                    : t.home.hero_no_workout}
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-black"
                  style={{ background: "rgba(0,0,0,0.15)", color: "#000" }}>
                  {hasActiveToday ? t.home.hero_cta_continue : t.home.hero_cta_start}
                </div>
              </div>
            </div>
          </Link>
        </button>

        {/* ── STATS ── */}
        <div className="flex gap-2 mt-3">
          <StatBlock value={streak ? `${streak}` : "—"} label={t.home.stats_streak} accent />
          <StatBlock value={`${monthCount}`} label={t.home.stats_workouts} />
          <StatBlock value={monthVol > 0 ? formatK(monthVol) : "—"} label={t.home.stats_volume} />
        </div>

        {/* ── HETI CSÍK ── */}
        <div className="mt-3 rounded-2xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="text-[9px] font-black tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.25)" }}>
            {t.home.this_week}
          </div>
          <WeekStrip activeDays={activeDays} days={weekDays} />
        </div>

        {/* ── PROGRAMOK ── */}
        <div className="mt-5">
          <ProgramsRow label={t.home.programs} allLabel={t.home.programs_all} perWeek={t.home.programs_per_week} />
        </div>

        {/* ── GYORS AKCIÓK ── */}
        <div className="mt-5">
          <div className="text-[10px] font-black tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
            {t.home.quick_access}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t.home.quick_calendar, icon: "📅", href: "/calendar" },
              { label: t.home.quick_stats, icon: "📈", href: "/progress" },
              { label: t.home.quick_profile, icon: "👤", href: "/profile" },
            ].map(({ label, icon, href }) => (
              <Link key={href} href={href}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 pressable"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-xl">{icon}</span>
                <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>

      </main>
      <BottomNav />
    </>
  );
}
