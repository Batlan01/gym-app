"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { lsGet, lsSet } from "@/lib/storage";
import {
  LS_ACTIVE_PROFILE,
  onboardedKey,
  profileMetaKey,
  type ProfileMeta,
  type Goal,
  type TrainingPlace,
  type Level,
  type TrainingSplit,
} from "@/lib/profiles";

type StepId =
  | "welcome"
  | "basic"
  | "body"
  | "goals"
  | "training"
  | "experience"
  | "finish";

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function parseOptionalInt(s: string) {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}
function parseOptionalFloat(s: string) {
  const t = s.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

export default function OnboardingPage() {
  const router = useRouter();

  const [activeProfileId, , activeHydrated] =
    useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  // anim state
  const [stepIdx, setStepIdx] = React.useState(0);
  const [phase, setPhase] = React.useState<"in" | "out">("in");
  const [dir, setDir] = React.useState<1 | -1>(1);
  const animTimer = React.useRef<number | null>(null);

  // draft (stringek: stabil input)
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
  const [notes, setNotes] = React.useState("");

  // steps (stabil tömb)
  const steps = React.useMemo<{ id: StepId; title: string; subtitle: string }[]>(
    () => [
      { id: "welcome", title: "Üdv!", subtitle: "Gyorsan beállítjuk a profilodat." },
      { id: "basic", title: "Alap adatok", subtitle: "Hogy megszólíthassunk + személyre szabás." },
      { id: "body", title: "Test adatok", subtitle: "Nem kötelező, de hasznos a célokhoz." },
      { id: "goals", title: "Cél", subtitle: "Mit szeretnél elérni?" },
      { id: "training", title: "Edzés környezet", subtitle: "Hol és milyen gyakran?" },
      { id: "experience", title: "Tapasztalat", subtitle: "Szint + edzésrendszer." },
      { id: "finish", title: "Kész!", subtitle: "Ellenőrzés és mentés." },
    ],
    []
  );

  const step = steps[stepIdx];

  // betöltés (ha már volt meta)
  React.useEffect(() => {
    if (!activeHydrated) return;
    if (!activeProfileId) {
      router.replace("/login");
      return;
    }

    const meta = lsGet<ProfileMeta | null>(profileMetaKey(activeProfileId), null);

    if (meta) {
      if (meta.fullName) setFullName(meta.fullName);
      if (meta.age != null) setDraftAge(String(meta.age));
      if (meta.heightCm != null) setDraftHeight(String(meta.heightCm));
      if (meta.weightKg != null) setDraftWeight(String(meta.weightKg));
      if (meta.goal) setGoal(meta.goal);
      if (meta.trainingPlace) setPlace(meta.trainingPlace);
      if (meta.daysPerWeek != null) setDraftDays(String(meta.daysPerWeek));
      if (meta.level) setLevel(meta.level);
      if (meta.split) setSplit(meta.split);
      if (Array.isArray(meta.focus)) setFocus(meta.focus);
      if (meta.notes) setNotes(meta.notes);
    }
  }, [activeHydrated, activeProfileId, router]);

  React.useEffect(() => {
    return () => {
      if (animTimer.current) window.clearTimeout(animTimer.current);
    };
  }, []);

  const persist = React.useCallback(() => {
    if (!activeProfileId) return;

    const age = parseOptionalInt(draftAge);
    const heightCm = parseOptionalInt(draftHeight);
    const weightKg = parseOptionalFloat(draftWeight);
    const daysPerWeek = parseOptionalInt(draftDays);

    const meta: ProfileMeta = {
      fullName: fullName.trim() || undefined,
      age: age == null ? null : clampInt(age, 8, 110),
      heightCm: heightCm == null ? null : clampInt(heightCm, 80, 250),
      weightKg: weightKg == null ? null : Math.max(20, Math.min(400, weightKg)),
      goal,
      trainingPlace: place,
      daysPerWeek: daysPerWeek == null ? null : clampInt(daysPerWeek, 1, 7),
      level,
      split,
      focus,
      notes: notes.trim() || undefined,
    };

    lsSet(profileMetaKey(activeProfileId), meta);
  }, [
    activeProfileId,
    fullName,
    draftAge,
    draftHeight,
    draftWeight,
    goal,
    place,
    draftDays,
    level,
    split,
    focus,
    notes,
  ]);

  const gotoStep = React.useCallback(
    (next: number) => {
      const n = clampInt(next, 0, steps.length - 1);
      if (n === stepIdx) return;

      // mindig mentsünk lépésváltáskor
      persist();

      setDir(n > stepIdx ? 1 : -1);
      setPhase("out");

      if (animTimer.current) window.clearTimeout(animTimer.current);
      animTimer.current = window.setTimeout(() => {
        setStepIdx(n);
        setPhase("in");
      }, 160);
    },
    [persist, stepIdx, steps.length]
  );

  const canNext = React.useMemo(() => {
    if (step.id === "welcome") return true;
    if (step.id === "basic") return fullName.trim().length >= 2;
    if (step.id === "body") return true; // opcionális
    if (step.id === "goals") return !!goal;
    if (step.id === "training") {
      const d = parseOptionalInt(draftDays);
      return !!place && d != null && d >= 1 && d <= 7;
    }
    if (step.id === "experience") return !!level && !!split;
    if (step.id === "finish") return true;
    return true;
  }, [step.id, fullName, goal, place, draftDays, level, split]);

  const onNext = React.useCallback(() => {
    if (!canNext) return;
    if (step.id === "finish") return;
    gotoStep(stepIdx + 1);
  }, [canNext, step.id, gotoStep, stepIdx]);

  const onBack = React.useCallback(() => {
    if (stepIdx === 0) return;
    gotoStep(stepIdx - 1);
  }, [gotoStep, stepIdx]);

  const onFinish = React.useCallback(() => {
    if (!activeProfileId) return;
    persist();
    lsSet(onboardedKey(activeProfileId), true);
    router.replace("/workout");
  }, [activeProfileId, persist, router]);

  const toggleFocus = React.useCallback((label: string) => {
    setFocus((prev) => {
      const has = prev.includes(label);
      if (has) return prev.filter((x) => x !== label);
      return [...prev, label];
    });
  }, []);

  if (!activeHydrated) {
    return (
      <main className="mx-auto max-w-md px-4 pt-10 pb-24">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white/70">Loading…</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-8 pb-28">
      <div className="mb-4">
        <div className="text-[11px] tracking-[0.35em] text-white/50">ARCX</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">Profil beállítás</h1>
        <div className="mt-1 text-sm text-white/55">
          {stepIdx + 1}/{steps.length} — {step.title}
        </div>
      </div>

      {/* progress */}
      <div className="mb-5 flex gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= stepIdx ? "bg-white/25" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* animated card */}
      <section
        className={[
          "rounded-3xl border border-white/10 bg-white/5 p-4 transition-all duration-200",
          phase === "in"
            ? "opacity-100 translate-x-0"
            : dir === 1
            ? "opacity-0 -translate-x-3"
            : "opacity-0 translate-x-3",
        ].join(" ")}
      >
        <div className="text-lg font-semibold text-white">{step.title}</div>
        <div className="mt-1 text-sm text-white/55">{step.subtitle}</div>

        <div className="mt-4">
          {step.id === "welcome" ? (
            <div className="text-sm text-white/70">
              1 perc, és kész. Utána kezdheted az edzést.
            </div>
          ) : null}

          {step.id === "basic" ? (
            <div className="space-y-3">
              <label className="block">
                <div className="text-xs text-white/60">Név</div>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Pl. Nikolas"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
                />
              </label>
            </div>
          ) : null}

          {step.id === "body" ? (
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <div className="text-xs text-white/60">Kor</div>
                <input
                  value={draftAge}
                  onChange={(e) => setDraftAge(e.target.value)}
                  inputMode="numeric"
                  placeholder="pl. 29"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
                />
              </label>
              <label className="block">
                <div className="text-xs text-white/60">Magasság</div>
                <input
                  value={draftHeight}
                  onChange={(e) => setDraftHeight(e.target.value)}
                  inputMode="numeric"
                  placeholder="cm"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
                />
              </label>
              <label className="block">
                <div className="text-xs text-white/60">Súly</div>
                <input
                  value={draftWeight}
                  onChange={(e) => setDraftWeight(e.target.value)}
                  inputMode="decimal"
                  placeholder="kg"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
                />
              </label>

              <div className="col-span-3 mt-2 text-xs text-white/45">
                Tipp: ezek opcionálisak, később bármikor átírhatod.
              </div>
            </div>
          ) : null}

          {step.id === "goals" ? (
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "lose" as Goal, label: "Fogyás" },
                { v: "maintain" as Goal, label: "Szintentartás" },
                { v: "gain" as Goal, label: "Tömegelés" },
              ].map((x) => (
                <button
                  key={x.v}
                  type="button"
                  onClick={() => setGoal(x.v)}
                  className={`rounded-2xl border px-3 py-3 text-sm transition ${
                    goal === x.v
                      ? "border-white/20 bg-white/15 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {x.label}
                </button>
              ))}
            </div>
          ) : null}

          {step.id === "training" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "gym" as TrainingPlace, label: "Terem" },
                  { v: "home" as TrainingPlace, label: "Otthon" },
                  { v: "mixed" as TrainingPlace, label: "Vegyes" },
                ].map((x) => (
                  <button
                    key={x.v}
                    type="button"
                    onClick={() => setPlace(x.v)}
                    className={`rounded-2xl border px-3 py-3 text-sm transition ${
                      place === x.v
                        ? "border-white/20 bg-white/15 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {x.label}
                  </button>
                ))}
              </div>

              <label className="block">
                <div className="text-xs text-white/60">Hányszor edzenél egy héten?</div>
                <input
                  value={draftDays}
                  onChange={(e) => setDraftDays(e.target.value)}
                  inputMode="numeric"
                  placeholder="1–7"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
                />
              </label>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-white/55 mb-2">Fókusz (opcionális)</div>
                <div className="flex flex-wrap gap-2">
                  {["Mell", "Hát", "Láb", "Váll", "Kar", "Has"].map((x) => {
                    const active = focus.includes(x);
                    return (
                      <button
                        key={x}
                        type="button"
                        onClick={() => toggleFocus(x)}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          active
                            ? "border-white/20 bg-white/15 text-white"
                            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {x}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {step.id === "experience" ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-white/60 mb-2">Szint</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: "beginner" as Level, label: "Kezdő" },
                    { v: "intermediate" as Level, label: "Közép" },
                    { v: "advanced" as Level, label: "Haladó" },
                  ].map((x) => (
                    <button
                      key={x.v}
                      type="button"
                      onClick={() => setLevel(x.v)}
                      className={`rounded-2xl border px-3 py-3 text-sm transition ${
                        level === x.v
                          ? "border-white/20 bg-white/15 text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-white/60 mb-2">Edzés rendszer</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "fullbody" as TrainingSplit, label: "Full body" },
                    { v: "upperlower" as TrainingSplit, label: "Upper/Lower" },
                    { v: "ppl" as TrainingSplit, label: "PPL" },
                    { v: "custom" as TrainingSplit, label: "Saját" },
                  ].map((x) => (
                    <button
                      key={x.v}
                      type="button"
                      onClick={() => setSplit(x.v)}
                      className={`rounded-2xl border px-3 py-3 text-sm transition ${
                        split === x.v
                          ? "border-white/20 bg-white/15 text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <div className="text-xs text-white/60">Megjegyzés (opcionális)</div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Pl. sérülés, preferencia, időkorlát…"
                  className="mt-1 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
                />
              </label>
            </div>
          ) : null}

          {step.id === "finish" ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
                <div className="font-semibold text-white">Összefoglaló</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-white/60">Név</div>
                  <div className="text-white">{fullName.trim() || "—"}</div>

                  <div className="text-white/60">Cél</div>
                  <div className="text-white">{goal}</div>

                  <div className="text-white/60">Hely</div>
                  <div className="text-white">{place}</div>

                  <div className="text-white/60">Heti nap</div>
                  <div className="text-white">{draftDays || "—"}</div>

                  <div className="text-white/60">Szint</div>
                  <div className="text-white">{level}</div>

                  <div className="text-white/60">Split</div>
                  <div className="text-white">{split}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={onFinish}
                className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm text-emerald-100 hover:bg-emerald-500/15 active:scale-[0.99]"
              >
                Mentés és tovább
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* bottom nav */}
      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={stepIdx === 0}
          className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/75 hover:bg-white/10 disabled:opacity-40"
        >
          Vissza
        </button>

        {step.id !== "finish" ? (
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className="flex-1 rounded-2xl border border-white/10 bg-white/10 py-3 text-sm text-white hover:bg-white/15 disabled:opacity-40"
          >
            Tovább
          </button>
        ) : (
          <button
            type="button"
            onClick={onFinish}
            className="flex-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm text-emerald-100 hover:bg-emerald-500/15 active:scale-[0.99]"
          >
            Kezdjük!
          </button>
        )}
      </div>
    </main>
  );
}
