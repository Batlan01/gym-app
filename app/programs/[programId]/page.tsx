// app/programs/builder/[programId]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";
import type { UserProgram, ProgramSessionTemplate, ProgramBlockTemplate, SportTag } from "@/lib/programsTypes";
import { readPrograms, upsertProgram, deleteProgram } from "@/lib/programsStorage";
import { sportLabel } from "@/lib/programTemplates";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random());
}

const levelLabel: Record<UserProgram["level"], string> = {
  beginner: "Kezdő",
  intermediate: "Közép",
  advanced: "Haladó",
};

export default function ProgramBuilderPage() {
  const router = useRouter();
  const params = useParams<{ programId: string }>();
  const programId = params?.programId ?? "";

  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  const [program, setProgram] = React.useState<UserProgram | null>(null);
  const [hydrated, setHydrated] = React.useState(false);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  const [savedPing, setSavedPing] = React.useState(0);

  // load program
  React.useEffect(() => {
    if (!activeProfileId || !programId) return;
    const list = readPrograms(activeProfileId);
    const p = list.find((x) => x.id === programId) ?? null;
    setProgram(p);
    setActiveSessionId(p?.sessions?.[0]?.id ?? null);
    setHydrated(true);
  }, [activeProfileId, programId]);

  const persist = React.useCallback(
    (next: UserProgram) => {
      if (!activeProfileId) return;
      upsertProgram(activeProfileId, next);
      setSavedPing((x) => x + 1);
    },
    [activeProfileId]
  );

  const updateProgram = React.useCallback(
    (fn: (p: UserProgram) => UserProgram) => {
      setProgram((prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        const stamped: UserProgram = { ...next, updatedAt: Date.now() };
        persist(stamped);
        return stamped;
      });
    },
    [persist]
  );

  const activeSession = React.useMemo(() => {
    if (!program) return null;
    return program.sessions.find((s) => s.id === activeSessionId) ?? null;
  }, [program, activeSessionId]);

  // actions
  const addSession = React.useCallback(() => {
    updateProgram((p) => {
      const s: ProgramSessionTemplate = {
        id: uid(),
        name: `Session ${p.sessions.length + 1}`,
        blocks: [],
      };
      // set active AFTER state update
      setTimeout(() => setActiveSessionId(s.id), 0);
      return { ...p, sessions: [...p.sessions, s] };
    });
  }, [updateProgram]);

  const removeSession = React.useCallback(
    (sessionId: string) => {
      updateProgram((p) => {
        const nextSessions = p.sessions.filter((s) => s.id !== sessionId);
        // if deleted active -> pick first
        setTimeout(() => {
          setActiveSessionId((cur) => {
            if (cur !== sessionId) return cur;
            return nextSessions[0]?.id ?? null;
          });
        }, 0);
        return { ...p, sessions: nextSessions };
      });
    },
    [updateProgram]
  );

  const renameSession = React.useCallback(
    (sessionId: string, name: string) => {
      updateProgram((p) => ({
        ...p,
        sessions: p.sessions.map((s) => (s.id === sessionId ? { ...s, name } : s)),
      }));
    },
    [updateProgram]
  );

  const addBlock = React.useCallback(
    (sessionId: string, kind: ProgramBlockTemplate["kind"]) => {
      updateProgram((p) => ({
        ...p,
        sessions: p.sessions.map((s) => {
          if (s.id !== sessionId) return s;

          const baseName =
            kind === "exercise" ? "Gyakorlat" : kind === "drill" ? "Drill" : "Intervallum";

          const b: ProgramBlockTemplate =
            kind === "exercise"
              ? { kind: "exercise", name: baseName, targetSets: 3, targetReps: "8-12" }
              : kind === "drill"
              ? { kind: "drill", name: baseName, durationSec: 300 }
              : { kind: "interval", name: baseName, rounds: 6, workSec: 30, restSec: 30 };

          return { ...s, blocks: [...s.blocks, b] };
        }),
      }));
    },
    [updateProgram]
  );

  const patchBlock = React.useCallback(
    (sessionId: string, index: number, patch: Partial<ProgramBlockTemplate>) => {
      updateProgram((p) => ({
        ...p,
        sessions: p.sessions.map((s) => {
          if (s.id !== sessionId) return s;
          const blocks = s.blocks.map((b, i) => (i === index ? ({ ...b, ...patch } as any) : b));
          return { ...s, blocks };
        }),
      }));
    },
    [updateProgram]
  );

  const removeBlock = React.useCallback(
    (sessionId: string, index: number) => {
      updateProgram((p) => ({
        ...p,
        sessions: p.sessions.map((s) => {
          if (s.id !== sessionId) return s;
          const blocks = s.blocks.filter((_, i) => i !== index);
          return { ...s, blocks };
        }),
      }));
    },
    [updateProgram]
  );

  const onDeleteProgram = React.useCallback(() => {
    if (!activeProfileId) return;
    deleteProgram(activeProfileId, programId);
    router.replace("/programs");
  }, [activeProfileId, programId, router]);

  // UI states
  if (!hydrated) {
    return (
      <main className="mx-auto max-w-md px-4 pt-5 pb-28">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white/70">Loading…</div>
        <BottomNav />
      </main>
    );
  }

  if (!activeProfileId) {
    return (
      <main className="mx-auto max-w-md px-4 pt-5 pb-28">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white/70">Nincs aktív profil.</div>
        <button
          type="button"
          onClick={() => router.replace("/programs")}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 py-3 text-sm text-white pressable"
        >
          Vissza a programokra
        </button>
        <BottomNav />
      </main>
    );
  }

  if (!program) {
    return (
      <main className="mx-auto max-w-md px-4 pt-5 pb-28">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white/70">Program nem található.</div>
        <button
          type="button"
          onClick={() => router.replace("/programs")}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 py-3 text-sm text-white pressable"
        >
          Vissza
        </button>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-28 animate-in">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs tracking-widest text-white/50">PROGRAM BUILDER</div>
          <h1 className="mt-1 text-2xl font-bold text-white">{program.name}</h1>
          <div className="mt-1 text-xs text-white/50">
            {sportLabel(program.sport)} • {levelLabel[program.level]} • {program.sessions.length} session
          </div>
          <div className="mt-1 text-[11px] text-white/35">id: {programId}</div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/programs")}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 pressable"
        >
          Bezár
        </button>
      </header>

      {/* meta */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Program adatok</div>
          <div className="text-[11px] text-white/40">{savedPing ? "Mentve ✓" : ""}</div>
        </div>

        <label className="mt-3 block">
          <div className="text-xs text-white/60">Név</div>
          <input
            value={program.name}
            onChange={(e) => updateProgram((p) => ({ ...p, name: e.target.value }))}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20 transition"
          />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="block">
            <div className="text-xs text-white/60">Sport</div>
            <select
              value={program.sport}
              onChange={(e) => updateProgram((p) => ({ ...p, sport: e.target.value as SportTag }))}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20 transition"
            >
              {(["gym", "home", "running", "boxing", "mobility", "hybrid"] as SportTag[]).map((s) => (
                <option key={s} value={s}>
                  {sportLabel(s)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs text-white/60">Szint</div>
            <select
              value={program.level}
              onChange={(e) => updateProgram((p) => ({ ...p, level: e.target.value as any }))}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20 transition"
            >
              <option value="beginner">Kezdő</option>
              <option value="intermediate">Közép</option>
              <option value="advanced">Haladó</option>
            </select>
          </label>
        </div>

        <label className="mt-3 block">
          <div className="text-xs text-white/60">Megjegyzés</div>
          <textarea
            value={program.notes ?? ""}
            onChange={(e) => updateProgram((p) => ({ ...p, notes: e.target.value || undefined }))}
            rows={3}
            className="mt-1 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20 transition"
            placeholder="pl. cél / preferenciák / sérülés…"
          />
        </label>
      </section>

      {/* sessions */}
      <section className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Sessionök</div>
          <button
            type="button"
            onClick={addSession}
            className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/15 pressable"
          >
            + Új session
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {program.sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-black/20 p-3 transition">
                <button
                  type="button"
                  onClick={() => setActiveSessionId(isActive ? null : s.id)}
                  className="flex w-full items-start justify-between gap-2 text-left pressable"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">{s.name}</div>
                    <div className="mt-1 text-xs text-white/55">{s.blocks.length} elem</div>
                  </div>
                  <div className="text-xs text-white/40">{isActive ? "▲" : "▼"}</div>
                </button>

                {isActive ? (
                  <div className="mt-3">
                    <label className="block">
                      <div className="text-xs text-white/60">Session név</div>
                      <input
                        value={s.name}
                        onChange={(e) => renameSession(s.id, e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20 transition"
                      />
                    </label>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => addBlock(s.id, "exercise")}
                        className="rounded-2xl border border-white/10 bg-white/10 py-3 text-xs text-white hover:bg-white/15 pressable"
                      >
                        + Gyakorlat
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock(s.id, "drill")}
                        className="rounded-2xl border border-white/10 bg-white/10 py-3 text-xs text-white hover:bg-white/15 pressable"
                      >
                        + Drill
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock(s.id, "interval")}
                        className="rounded-2xl border border-white/10 bg-white/10 py-3 text-xs text-white hover:bg-white/15 pressable"
                      >
                        + Intervall
                      </button>
                    </div>

                    {s.blocks.length ? (
                      <div className="mt-3 space-y-2">
                        {s.blocks.map((b, i) => (
                          <div key={`${b.kind}-${i}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-xs text-white/60">
                                {b.kind === "exercise" ? "GYAKORLAT" : b.kind === "drill" ? "DRILL" : "INTERVALL"}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeBlock(s.id, i)}
                                className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[11px] text-red-200 hover:bg-red-500/15 pressable"
                              >
                                Törlés
                              </button>
                            </div>

                            <div className="mt-2 grid grid-cols-1 gap-2">
                              <label>
                                <div className="text-xs text-white/60">Név</div>
                                <input
                                  value={b.name}
                                  onChange={(e) => patchBlock(s.id, i, { name: e.target.value })}
                                  className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-white/20 transition"
                                />
                              </label>

                              {b.kind === "exercise" ? (
                                <div className="grid grid-cols-2 gap-2">
                                  <label>
                                    <div className="text-xs text-white/60">Szettek</div>
                                    <input
                                      type="number"
                                      value={b.targetSets ?? 0}
                                      onChange={(e) => patchBlock(s.id, i, { targetSets: Number(e.target.value || 0) })}
                                      className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-white/20 transition"
                                    />
                                  </label>
                                  <label>
                                    <div className="text-xs text-white/60">Ismétlés</div>
                                    <input
                                      value={b.targetReps ?? ""}
                                      onChange={(e) => patchBlock(s.id, i, { targetReps: e.target.value })}
                                      className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-white/20 transition"
                                      placeholder="pl 8-12"
                                    />
                                  </label>
                                </div>
                              ) : null}

                              {b.kind === "drill" ? (
                                <label>
                                  <div className="text-xs text-white/60">Időtartam (sec)</div>
                                  <input
                                    type="number"
                                    value={b.durationSec ?? 0}
                                    onChange={(e) => patchBlock(s.id, i, { durationSec: Number(e.target.value || 0) })}
                                    className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-white/20 transition"
                                  />
                                </label>
                              ) : null}

                              {b.kind === "interval" ? (
                                <div className="grid grid-cols-3 gap-2">
                                  <label>
                                    <div className="text-xs text-white/60">Kör</div>
                                    <input
                                      type="number"
                                      value={b.rounds ?? 0}
                                      onChange={(e) => patchBlock(s.id, i, { rounds: Number(e.target.value || 0) })}
                                      className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-white/20 transition"
                                    />
                                  </label>
                                  <label>
                                    <div className="text-xs text-white/60">Work (sec)</div>
                                    <input
                                      type="number"
                                      value={b.workSec ?? 0}
                                      onChange={(e) => patchBlock(s.id, i, { workSec: Number(e.target.value || 0) })}
                                      className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-white/20 transition"
                                    />
                                  </label>
                                  <label>
                                    <div className="text-xs text-white/60">Rest (sec)</div>
                                    <input
                                      type="number"
                                      value={b.restSec ?? 0}
                                      onChange={(e) => patchBlock(s.id, i, { restSec: Number(e.target.value || 0) })}
                                      className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-white/20 transition"
                                    />
                                  </label>
                                </div>
                              ) : null}

                              <label>
                                <div className="text-xs text-white/60">Jegyzet</div>
                                <input
                                  value={b.notes ?? ""}
                                  onChange={(e) => patchBlock(s.id, i, { notes: e.target.value || undefined })}
                                  className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-white/20 transition"
                                  placeholder="opcionális"
                                />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/60">
                        Nincs elem ebben a sessionben. Adj hozzá gyakorlatot / drillt / intervallt.
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeSession(s.id)}
                      className="mt-3 w-full rounded-2xl border border-red-500/25 bg-red-500/10 py-3 text-sm text-red-200 hover:bg-red-500/15 pressable"
                    >
                      Session törlése
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-3 rounded-3xl border border-red-500/20 bg-red-500/5 p-4">
        <div className="text-sm font-semibold text-red-100">Veszély zóna</div>
        <button
          type="button"
          onClick={onDeleteProgram}
          className="mt-3 w-full rounded-2xl border border-red-500/25 bg-red-500/10 py-3 text-sm text-red-100 hover:bg-red-500/15 pressable"
        >
          Program törlése
        </button>
      </section>

      <BottomNav />
    </main>
  );
}
