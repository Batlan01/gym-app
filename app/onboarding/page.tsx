"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { lsGet, lsSet } from "@/lib/storage";
import { PROGRAM_TEMPLATES } from "@/lib/programTemplates";
import { readPrograms, upsertProgram } from "@/lib/programsStorage";
import {
  LS_ACTIVE_PROFILE, onboardedKey, profileMetaKey, type ProfileMeta,
  type Goal, type TrainingPlace, type Level, type TrainingSplit,
} from "@/lib/profiles";

type StepId = "welcome" | "basic" | "body" | "goals" | "training" | "experience" | "program" | "finish";

function clampInt(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function parseOptionalInt(s: string) {
  const n = Number(s.trim()); return Number.isFinite(n) && s.trim() ? Math.trunc(n) : null;
}
function parseOptionalFloat(s: string) {
  const n = Number(s.trim().replace(",", ".")); return Number.isFinite(n) && s.trim() ? n : null;
}

// Chip selector
function Chips<T extends string>({ options, value, onChange, cols = 3 }: {
  options: { v: T; label: string; icon?: string }[];
  value: T; onChange: (v: T) => void; cols?: number;
}) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className="rounded-2xl py-3 px-2 text-sm font-semibold pressable transition-all"
          style={value === o.v ? {
            background: "rgba(34,211,238,0.15)",
            color: "var(--accent-primary)",
            border: "1px solid rgba(34,211,238,0.4)",
          } : {
            background: "var(--bg-card)",
            color: "var(--text-muted)",
            border: "1px solid var(--border-subtle)",
          }}>
          {o.icon && <div className="text-xl mb-1">{o.icon}</div>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Number input
function NumberInput({ label, value, onChange, placeholder, unit }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; unit?: string;
}) {
  return (
    <div>
      <div className="label-xs mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <input value={value} onChange={e => onChange(e.target.value)}
          inputMode="decimal" placeholder={placeholder ?? "—"}
          className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }} />
        {unit && <span className="text-sm" style={{ color: "var(--text-muted)" }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [activeProfileId, , activeHydrated] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  const [stepIdx, setStepIdx] = React.useState(0);
  const [phase, setPhase] = React.useState<"in" | "out">("in");
  const [dir, setDir] = React.useState<1 | -1>(1);
  const animTimer = React.useRef<number | null>(null);

  const [fullName, setFullName] = React.useState("");
  const [draftAge, setDraftAge] = React.useState("");
  const [draftHeight, setDraftHeight] = React.useState("");
  const [draftWeight, setDraftWeight] = React.useState("");
  const [goal, setGoal] = React.useState<Goal>("maintain");
  const [place, setPlace] = React.useState<TrainingPlace>("gym");
  const [draftDays, setDraftDays] = React.useState("3");
  const [level, setLevel] = React.useState<Level>("beginner");
  const [split, setSplit] = React.useState<TrainingSplit>("fullbody");
  const [focus, setFocus] = React.useState<string[]>([]);

  const steps: { id: StepId; title: string; subtitle: string; emoji: string }[] = [
    { id: "welcome",    title: "Üdv az ARCX-ben!", subtitle: "1 perc és kész", emoji: "👋" },
    { id: "basic",      title: "Mi a neved?",       subtitle: "Hogy megszólíthassunk", emoji: "✏️" },
    { id: "body",       title: "Test adatok",        subtitle: "Opcionális, de hasznos", emoji: "📏" },
    { id: "goals",      title: "Mi a célod?",        subtitle: "Személyre szabjuk az appot", emoji: "🎯" },
    { id: "training",   title: "Edzés körülmény",    subtitle: "Hol és milyen sűrűn?", emoji: "🏋️" },
    { id: "experience", title: "Tapasztalat",         subtitle: "Szint és edzésrendszer", emoji: "⭐" },
    { id: "program",   title: "Program ajánlás",      subtitle: "Kezdd rögtön ezzel", emoji: "📋" },
    { id: "finish",     title: "Kész!",               subtitle: "Ellenőrzöd és mentesz", emoji: "🚀" },
  ];

  const step = steps[stepIdx];

  React.useEffect(() => {
    if (!activeHydrated) return;
    if (!activeProfileId) { router.replace("/login"); return; }
    const meta = lsGet<ProfileMeta | null>(profileMetaKey(activeProfileId), null);
    if (meta) {
      if (meta.fullName)         setFullName(meta.fullName);
      if (meta.age != null)      setDraftAge(String(meta.age));
      if (meta.heightCm != null) setDraftHeight(String(meta.heightCm));
      if (meta.weightKg != null) setDraftWeight(String(meta.weightKg));
      if (meta.goal)             setGoal(meta.goal);
      if (meta.trainingPlace)    setPlace(meta.trainingPlace);
      if (meta.daysPerWeek != null) setDraftDays(String(meta.daysPerWeek));
      if (meta.level)            setLevel(meta.level);
      if (meta.split)            setSplit(meta.split);
      if (Array.isArray(meta.focus)) setFocus(meta.focus);
    }
  }, [activeHydrated, activeProfileId, router]);

  React.useEffect(() => () => { if (animTimer.current) window.clearTimeout(animTimer.current); }, []);

  const persist = React.useCallback(() => {
    if (!activeProfileId) return;
    const meta: ProfileMeta = {
      fullName: fullName.trim() || undefined,
      age:       parseOptionalInt(draftAge)    != null ? clampInt(parseOptionalInt(draftAge)!, 8, 110)    : null,
      heightCm:  parseOptionalInt(draftHeight) != null ? clampInt(parseOptionalInt(draftHeight)!, 80, 250) : null,
      weightKg:  parseOptionalFloat(draftWeight) != null ? Math.max(20, Math.min(400, parseOptionalFloat(draftWeight)!)) : null,
      goal, trainingPlace: place,
      daysPerWeek: parseOptionalInt(draftDays) != null ? clampInt(parseOptionalInt(draftDays)!, 1, 7) : null,
      level, split, focus,
    };
    lsSet(profileMetaKey(activeProfileId), meta);
  }, [activeProfileId, fullName, draftAge, draftHeight, draftWeight, goal, place, draftDays, level, split, focus]);

  const gotoStep = React.useCallback((next: number) => {
    const n = clampInt(next, 0, steps.length - 1);
    if (n === stepIdx) return;
    persist();
    setDir(n > stepIdx ? 1 : -1);
    setPhase("out");
    if (animTimer.current) window.clearTimeout(animTimer.current);
    animTimer.current = window.setTimeout(() => { setStepIdx(n); setPhase("in"); }, 150);
  }, [persist, stepIdx, steps.length]);

  const canNext = React.useMemo(() => {
    if (step.id === "basic") return fullName.trim().length >= 2;
    if (step.id === "program") return true;
    if (step.id === "training") {
      const d = parseOptionalInt(draftDays);
      return !!place && d != null && d >= 1 && d <= 7;
    }
    return true;
  }, [step.id, fullName, place, draftDays]);

  const onFinish = React.useCallback(() => {
    if (!activeProfileId) return;
    persist();
    lsSet(onboardedKey(activeProfileId), true);
    router.replace("/workout");
  }, [activeProfileId, persist, router]);

  const toggleFocus = (label: string) =>
    setFocus(p => p.includes(label) ? p.filter(x => x !== label) : [...p, label]);

  if (!activeHydrated) return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="text-sm" style={{ color: "var(--text-muted)" }}>Betöltés…</div>
    </div>
  );

  return (
    <main className="mx-auto max-w-md px-4 pt-8 pb-28 min-h-dvh flex flex-col">

      {/* Top: logo + progress */}
      <div className="mb-6">
        <div className="label-xs mb-4">ARCX</div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-4">
          {steps.map((_, i) => (
            <button key={i} onClick={() => i < stepIdx && gotoStep(i)}
              className="flex-1 rounded-full transition-all duration-400"
              style={{
                height: 4,
                background: i < stepIdx
                  ? "var(--accent-primary)"
                  : i === stepIdx
                  ? "rgba(34,211,238,0.5)"
                  : "var(--bg-card)",
                cursor: i < stepIdx ? "pointer" : "default",
              }} />
          ))}
        </div>

        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {stepIdx + 1} / {steps.length}
        </div>
      </div>

      {/* Animated step card */}
      <div className="flex-1" style={{
        opacity: phase === "in" ? 1 : 0,
        transform: phase === "in" ? "translateX(0)" : `translateX(${dir * -16}px)`,
        transition: "opacity 0.15s ease, transform 0.15s ease",
      }}>
        {/* Step emoji + title */}
        <div className="mb-6">
          <div className="text-4xl mb-3">{step.emoji}</div>
          <h1 className="text-2xl font-black mb-1" style={{ color: "var(--text-primary)" }}>
            {step.title}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{step.subtitle}</p>
        </div>

        {/* Step content */}
        <div className="space-y-4">

          {step.id === "welcome" && (
            <div className="space-y-3">
              {[
                { icon: "📋", title: "Edzésprogramok", desc: "Tervezz saját vagy töltsd be a sablonokat" },
                { icon: "📝", title: "Edzésnapló", desc: "Kövesd a szetteket, súlyokat, fejlődést" },
                { icon: "📈", title: "Statisztikák", desc: "PR-ok, volum, streak — minden egy helyen" },
                { icon: "📅", title: "Heti naptár", desc: "Tervezd meg, mikor mit edzel" },
              ].map(f => (
                <div key={f.title} className="flex items-center gap-4 rounded-2xl px-4 py-3"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                  <span className="text-2xl shrink-0">{f.icon}</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{f.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step.id === "basic" && (
            <div>
              <div className="label-xs mb-2">NÉVLEL SZERETNÉNK MEGSZÓLÍTANI</div>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Pl. Nikolas"
                autoFocus
                className="w-full rounded-2xl px-4 py-4 text-lg font-bold outline-none"
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${fullName.trim().length >= 2 ? "rgba(34,211,238,0.4)" : "var(--border-subtle)"}`,
                  color: "var(--text-primary)",
                  transition: "border-color 0.2s",
                }}
              />
              {fullName.trim().length >= 2 && (
                <div className="mt-2 text-sm" style={{ color: "var(--accent-primary)" }}>
                  Szia, {fullName.trim().split(" ")[0]}! 👋
                </div>
              )}
            </div>
          )}

          {step.id === "body" && (
            <div className="grid grid-cols-3 gap-3">
              <NumberInput label="KOR" value={draftAge} onChange={setDraftAge} placeholder="29" unit="év" />
              <NumberInput label="MAGASSÁG" value={draftHeight} onChange={setDraftHeight} placeholder="175" unit="cm" />
              <NumberInput label="TESTSÚLY" value={draftWeight} onChange={setDraftWeight} placeholder="80" unit="kg" />
              <div className="col-span-3 text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                💡 Ezek az adatok segítenek a testsúly grafikonban és a kalória becslésben. Bármikor módosíthatod a profilban.
              </div>
            </div>
          )}

          {step.id === "goals" && (
            <Chips<Goal>
              value={goal} onChange={setGoal}
              options={[
                { v: "lose", label: "Fogyás", icon: "🔥" },
                { v: "maintain", label: "Szinten tartás", icon: "⚖️" },
                { v: "gain", label: "Tömegelés", icon: "💪" },
              ]}
            />
          )}

          {step.id === "training" && (
            <div className="space-y-4">
              <div>
                <div className="label-xs mb-2">HOL EDZESZ?</div>
                <Chips<TrainingPlace>
                  value={place} onChange={setPlace}
                  options={[
                    { v: "gym", label: "Terem", icon: "🏋️" },
                    { v: "home", label: "Otthon", icon: "🏠" },
                    { v: "mixed", label: "Vegyes", icon: "🔀" },
                  ]}
                />
              </div>
              <NumberInput
                label="HÁNYSZOR EGY HÉTEN?"
                value={draftDays} onChange={setDraftDays}
                placeholder="3" unit="nap/hét"
              />
              <div>
                <div className="label-xs mb-2">FÓKUSZ TERÜLETEK (opcionális)</div>
                <div className="flex flex-wrap gap-2">
                  {["Mell", "Hát", "Láb", "Váll", "Kar", "Has"].map(x => (
                    <button key={x} type="button" onClick={() => toggleFocus(x)}
                      className="rounded-2xl px-3 py-2 text-xs font-semibold pressable"
                      style={focus.includes(x) ? {
                        background: "rgba(34,211,238,0.12)", color: "var(--accent-primary)",
                        border: "1px solid rgba(34,211,238,0.35)",
                      } : {
                        background: "var(--bg-card)", color: "var(--text-muted)",
                        border: "1px solid var(--border-subtle)",
                      }}>
                      {x}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step.id === "experience" && (
            <div className="space-y-4">
              <div>
                <div className="label-xs mb-2">EDZÉSI SZINT</div>
                <Chips<Level>
                  value={level} onChange={setLevel}
                  options={[
                    { v: "beginner", label: "Kezdő", icon: "🌱" },
                    { v: "intermediate", label: "Közép", icon: "⚡" },
                    { v: "advanced", label: "Haladó", icon: "🔥" },
                  ]}
                />
              </div>
              <div>
                <div className="label-xs mb-2">EDZÉSRENDSZER</div>
                <Chips<TrainingSplit>
                  value={split} onChange={setSplit} cols={2}
                  options={[
                    { v: "fullbody", label: "Full body" },
                    { v: "upperlower", label: "Upper/Lower" },
                    { v: "ppl", label: "Push/Pull/Leg" },
                    { v: "custom", label: "Saját" },
                  ]}
                />
              </div>
            </div>
          )}


          {step.id === "program" && (() => {
            // Ajánl 1-2 programot szint + hely alapján
            const recommended = PROGRAM_TEMPLATES.filter(p => {
              const sportMatch = place === "home" ? p.sport === "home" || p.sport === "calisthenics"
                : place === "gym" ? p.sport === "gym" || p.sport === "powerlifting" || p.sport === "bodybuilding"
                : true;
              const levelMatch = !p.level || p.level === level || (level === "intermediate" && p.level === "beginner");
              return sportMatch && levelMatch;
            }).slice(0, 3);

            return (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  A megadott adatok alapján ezek illenek hozzád. Egyet rögtön hozzáadhatsz — vagy később is megcsinálod.
                </p>
                {recommended.map(tmpl => (
                  <div key={tmpl.id} className="rounded-2xl p-4"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{tmpl.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {tmpl.sessions?.length ?? 0} session · {tmpl.level === "beginner" ? "Kezdő" : tmpl.level === "intermediate" ? "Közép" : "Haladó"}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!activeProfileId) return;
                          const existing = readPrograms(activeProfileId);
                          if (existing.some(p => p.name === tmpl.title)) return;
                          const prog = {
                            id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()),
                            createdAt: Date.now(), updatedAt: Date.now(),
                            name: tmpl.title, sport: tmpl.sport as any, level: tmpl.level as any,
                            sessions: (tmpl.sessions ?? []).map((s: any, i: number) => ({
                              id: String(Date.now() + i),
                              name: s.name ?? `Session ${i+1}`,
                              blocks: (s.exercises ?? []).map((e: string) => ({ kind: "exercise", name: e, targetSets: 3, targetReps: "8-12" })),
                            })),
                          };
                          upsertProgram(activeProfileId, prog as any);
                          alert(`"${tmpl.title}" hozzáadva! ✓`);
                        }}
                        className="rounded-xl px-4 py-2 text-xs font-bold pressable shrink-0"
                        style={{ background: "rgba(34,211,238,0.12)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.3)" }}>
                        + Hozzáad
                      </button>
                    </div>
                  </div>
                ))}
                {recommended.length === 0 && (
                  <div className="rounded-2xl p-4 text-sm text-center" style={{ color: "var(--text-muted)", background: "var(--bg-card)" }}>
                    Programokat a Programok oldalon hozzáadhatsz bármikor.
                  </div>
                )}
              </div>
            );
          })()}

          {step.id === "finish" && (
            <div className="rounded-3xl overflow-hidden"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              {[
                { label: "Név", value: fullName || "—" },
                { label: "Cél", value: { lose: "🔥 Fogyás", maintain: "⚖️ Szinten tartás", gain: "💪 Tömegelés" }[goal] },
                { label: "Hely", value: { gym: "🏋️ Terem", home: "🏠 Otthon", mixed: "🔀 Vegyes" }[place] },
                { label: "Szint", value: { beginner: "🌱 Kezdő", intermediate: "⚡ Közép", advanced: "🔥 Haladó" }[level] },
                { label: "Heti nap", value: draftDays || "—" },
              ].map((r, i, arr) => (
                <div key={r.label} className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{r.label}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{r.value}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Bottom nav */}
      <div className="mt-6 flex gap-3">
        {stepIdx > 0 && (
          <button onClick={() => gotoStep(stepIdx - 1)}
            className="rounded-2xl px-5 py-4 text-sm font-semibold pressable"
            style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
            ← Vissza
          </button>
        )}

        {step.id !== "finish" ? (
          <button onClick={() => gotoStep(stepIdx + 1)} disabled={!canNext}
            className="flex-1 rounded-2xl py-4 text-sm font-black pressable"
            style={{
              background: canNext ? "var(--accent-primary)" : "var(--bg-card)",
              color: canNext ? "#000" : "var(--text-muted)",
              opacity: canNext ? 1 : 0.5,
            }}>
            Tovább →
          </button>
        ) : (
          <button onClick={onFinish}
            className="flex-1 rounded-2xl py-4 text-sm font-black pressable"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            🚀 Kezdjük!
          </button>
        )}
      </div>
    </main>
  );
}
