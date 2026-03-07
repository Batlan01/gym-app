// app/programs/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { ProgramPosterCard } from "@/components/ProgramPosterCard";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";
import { PROGRAM_TEMPLATES, sportLabel } from "@/lib/programTemplates";
import type { SportTag, UserProgram } from "@/lib/programsTypes";
import { createProgramFromTemplate, readPrograms } from "@/lib/programsStorage";

type Mode = "mine" | "templates";

const chips: { id: "all" | SportTag; label: string }[] = [
  { id: "all", label: "Összes" },
  { id: "gym", label: "Edzőterem" },
  { id: "home", label: "Otthon" },
  { id: "running", label: "Futás" },
  { id: "boxing", label: "Box" },
  { id: "mobility", label: "Mobilitás" },
  { id: "hybrid", label: "Hibrid" },
];

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <div className="mb-2 flex items-end justify-between">
        <div className="text-xs tracking-widest text-white/50">{title.toUpperCase()}</div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1 no-scrollbar scroll-smooth snap-x snap-mandatory">
        <div className="flex gap-3 pb-2">{children}</div>
      </div>
    </section>
  );
}

export default function ProgramsPage() {
  const router = useRouter();
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  const [mode, setMode] = React.useState<Mode>("templates");
  const [q, setQ] = React.useState("");
  const [chip, setChip] = React.useState<"all" | SportTag>("all");
  const [mine, setMine] = React.useState<UserProgram[]>([]);

  React.useEffect(() => {
    if (!activeProfileId) return;
    setMine(readPrograms(activeProfileId));
  }, [activeProfileId]);

  const filteredTemplates = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    return PROGRAM_TEMPLATES.filter((t) => {
      const passChip = chip === "all" ? true : t.sport === chip;
      const passQ =
        !qq ||
        t.title.toLowerCase().includes(qq) ||
        (t.subtitle ?? "").toLowerCase().includes(qq) ||
        (t.tags ?? []).some((x) => x.toLowerCase().includes(qq));
      return passChip && passQ;
    });
  }, [q, chip]);

  const bySport = React.useMemo(() => {
    const groups: Record<string, typeof filteredTemplates> = {};
    for (const t of filteredTemplates) {
      groups[t.sport] ||= [];
      groups[t.sport].push(t);
    }
    return groups;
  }, [filteredTemplates]);

  function goBuilder(programId: string) {
    router.push(`/programs/builder/${programId}`);
  }

  function startFromTemplate(tplId: string) {
    if (!activeProfileId) return;
    const tpl = PROGRAM_TEMPLATES.find((x) => x.id === tplId);
    if (!tpl) return;
    const p = createProgramFromTemplate(activeProfileId, tpl);
    goBuilder(p.id);
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-28 animate-in">
      <header className="mb-4">
        <div className="text-xs tracking-widest text-white/50">PROGRAMOK</div>
        <h1 className="mt-1 text-2xl font-bold text-white">Netflix katalógus</h1>
        <div className="mt-1 text-xs text-white/50">
          Sablonból indulsz, aztán a builderben személyre szabod. (Naptár később.)
        </div>
      </header>

      {/* Mode switch */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode("mine")}
            className={[
              "rounded-2xl px-3 py-3 text-sm font-semibold",
              "transitionied pressable",
              mode === "mine" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5",
            ].join(" ")}
          >
            Saját
          </button>
          <button
            onClick={() => setMode("templates")}
            className={[
              "rounded-2xl px-3 py-3 text-sm font-semibold",
              "Ried pressable",
              mode === "templates" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5",
            ].join(" ")}
          >
            Sablonok
          </button>
        </div>

        <div className="mt-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Keresés… (pl: full body, futás, box)"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/20 transition"
          />
        </div>

        <div className="-mx-1 mt-3 overflow-x-auto px-1 no-scrollbar scroll-smooth snap-x snap-mandatory">
          <div className="flex gap-2 pb-1">
            {chips.map((c) => (
              <button
                key={c.id}
                onClick={() => setChip(c.id)}
                className={[
                  "shrink-0 rounded-full border px-3 py-2 text-xs",
                  "pressable transition",
                  chip === c.id
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5",
                ].join(" ")}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 text-xs text-white/50">
          Tipp: nyomj egy poszterre → builder → finomhangolás.
        </div>
      </div>

      {/* Content */}
      {mode === "mine" ? (
        <>
          <Row title="Folytasd">
            {mine.length ? (
              mine.slice(0, 12).map((p) => (
                <button
                  key={p.id}
                  onClick={() => goBuilder(p.id)}
                  className={[
                    "relative w-[150px] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 text-left",
                    "snap-start pressable transition",
                    "hover:bg-white/10",
                  ].join(" ")}
                >
                  <div className="text-[10px] text-white/60">
                    {sportLabel(p.sport)} • {p.level}
                  </div>
                  <div className="mt-1 line-clamp-3 text-sm font-semibold text-white">{p.name}</div>
                  <div className="mt-2 text-[11px] text-white/55">{p.sessions.length} session</div>
                </button>
              ))
            ) : (
              <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Még nincs saját programod. Válassz egy sablont és indítsd el.
              </div>
            )}
          </Row>

          <Row title="Ajánlott sablonok">
            {PROGRAM_TEMPLATES.slice(0, 10).map((t) => (
              <ProgramPosterCard key={t.id} tpl={t} onClick={() => startFromTemplate(t.id)} />
            ))}
          </Row>
        </>
      ) : (
        <>
          <Row title="Neked ajánlott">
            {filteredTemplates.slice(0, 12).map((t) => (
              <ProgramPosterCard key={t.id} tpl={t} onClick={() => startFromTemplate(t.id)} />
            ))}
          </Row>

          {(["gym", "home", "running", "boxing", "mobility", "hybrid"] as SportTag[]).map((s) => {
            const list = bySport[s] ?? [];
            if (!list.length) return null;
            return (
              <Row key={s} title={sportLabel(s)}>
                {list.map((t) => (
                  <ProgramPosterCard key={t.id} tpl={t} onClick={() => startFromTemplate(t.id)} />
                ))}
              </Row>
            );
          })}
        </>
      )}

      <BottomNav />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .pressable { transform: translateZ(0); }
        .pressable:active { transform: scale(0.98); }

        @media (prefers-reduced-motion: no-preference) {
          .animate-in {
            animation: fadeUp 280ms ease-out both;
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        }
      `}</style>
    </main>
  );
}
