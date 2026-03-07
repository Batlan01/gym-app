// components/ProgramPosterCard.tsx
"use client";

import * as React from "react";
import type { ProgramTemplate } from "@/lib/programsTypes";
import { levelLabel, sportLabel } from "@/lib/programTemplates";

const gradientMap: Record<string, string> = {
  slate: "from-white/10 to-white/0",
  ember: "from-amber-500/20 to-white/0",
  emerald: "from-emerald-500/20 to-white/0",
  violet: "from-violet-500/20 to-white/0",
  sky: "from-sky-500/20 to-white/0",
};

export function ProgramPosterCard({
  tpl,
  onClick,
}: {
  tpl: ProgramTemplate;
  onClick?: () => void;
}) {
  const g = tpl.cover?.gradient ?? "slate";
  const grad = gradientMap[g] ?? gradientMap.slate;

  return (
    <button
      onClick={onClick}
      className={[
        "group relative w-[170px] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 text-left",
        "transition duration-200",
        "hover:border-white/20 hover:bg-white/10",
        "active:scale-[0.985]",
      ].join(" ")}
    >
      {/* gradient wash */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${grad}`} />
      {/* subtle vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

      {/* shine */}
      <div className="pointer-events-none absolute -inset-y-8 -left-24 w-24 rotate-12 bg-white/10 blur-xl opacity-0 transition duration-300 group-hover:opacity-100 group-hover:translate-x-[320px]" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="text-lg">{tpl.cover?.emoji ?? "🏋️"}</div>
          <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[11px] text-white/75">
            {levelLabel(tpl.level)}
          </span>
        </div>

        <div className="mt-2 text-sm font-semibold text-white leading-snug">{tpl.title}</div>

        <div className="mt-2 text-[11px] text-white/60">
          {sportLabel(tpl.sport)} • {tpl.sessions.length} session
        </div>

        {tpl.subtitle ? (
          <div className="mt-2 text-[11px] text-white/55">{tpl.subtitle}</div>
        ) : null}
      </div>
    </button>
  );
}
