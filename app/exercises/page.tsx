"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Tile } from "@/components/Tile";
import { EXERCISES } from "@/lib/exercises";

type AnyExercise = (typeof EXERCISES)[number];

function pickGroup(ex: AnyExercise): string {
  // Próbálunk “alkategóriát” kinyerni több tipikus mező alapján
  const anyEx: any = ex;

  return (
    anyEx.subcategory ??
    anyEx.group ??
    anyEx.muscleGroup ??
    anyEx.muscle ??
    anyEx.category ??
    anyEx.area ??
    "Egyéb"
  );
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export default function ExercisesPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const group = sp.get("g"); // selected group / alkategória
  const [q, setQ] = React.useState("");

  // csoportok (alkategóriák) a teljes katalógusból
  const groups = React.useMemo(() => {
    const set = new Set<string>();
    for (const ex of EXERCISES) set.add(pickGroup(ex));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "hu"));
  }, []);

  const filtered = React.useMemo(() => {
    const base = group
      ? EXERCISES.filter((ex) => pickGroup(ex) === group)
      : EXERCISES;

    const qq = normalize(q.trim());
    if (!qq) return base;

    return base.filter((ex: any) => normalize(ex.name ?? "").includes(qq));
  }, [group, q]);

  const showTiles = !group;

  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-28">
      <header className="mb-4">
        <div className="text-xs tracking-widest text-white/50">GYAKORLATOK</div>

        <div className="mt-1 flex items-end justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">
            {showTiles ? "Katalógus" : group}
          </h1>

          {!showTiles ? (
            <button
              onClick={() => router.push("/exercises")}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
            >
              ← Vissza
            </button>
          ) : null}
        </div>

        {!showTiles ? (
          <div className="mt-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Keresés gyakorlatra…"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
            />
            <div className="mt-2 text-xs text-white/45">
              {filtered.length} találat
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-white/55">
            Válassz egy izomcsoportot / alkategóriát.
          </div>
        )}
      </header>

      {showTiles ? (
        <section className="grid grid-cols-2 gap-3">
          {groups.map((g) => (
            <Tile
              key={g}
              title={g}
              subtitle="Megnyitás"
              href={`/exercises?g=${encodeURIComponent(g)}`}
            />
          ))}
        </section>
      ) : (
        <section className="space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
              Nincs találat.
            </div>
          ) : (
            filtered.map((ex: any) => (
              <div
                key={ex.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-4"
              >
                <div className="text-sm font-semibold text-white">
                  {ex.name}
                </div>
                <div className="mt-1 text-xs text-white/45">
                  {pickGroup(ex)}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      <BottomNav />
    </main>
  );
}
