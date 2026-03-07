"use client";

import * as React from "react";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { lsGet, lsSubscribe } from "@/lib/storage";
import { LS_ACTIVE_PROFILE, profileMetaKey, type ProfileMeta } from "@/lib/profiles";

function goalLabel(goal?: ProfileMeta["goal"]) {
  if (goal === "lose") return "Fogyás";
  if (goal === "maintain") return "Szinten tartás";
  if (goal === "gain") return "Tömegelés";
  return "—";
}

function placeLabel(p?: ProfileMeta["trainingPlace"]) {
  if (p === "gym") return "Terem";
  if (p === "home") return "Otthon";
  if (p === "mixed") return "Vegyes";
  return "—";
}

export function ProfileMetaCard() {
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const [meta, setMeta] = React.useState<ProfileMeta | null>(null);

  React.useEffect(() => {
    if (!activeProfileId) {
      setMeta(null);
      return;
    }

    const key = profileMetaKey(activeProfileId);

    const read = () => setMeta(lsGet<ProfileMeta | null>(key, null));
    read();

    const unsub = lsSubscribe(key, read);
    return () => unsub();
  }, [activeProfileId]);

  const focus = React.useMemo(() => {
    const raw: any = (meta as any)?.focus;
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [meta]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-white">Profil adatok</div>
      <div className="mt-1 text-xs text-white/55">Onboarding során megadott adatok.</div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="text-white/50">Név</div>
        <div className="text-white/90">{meta?.fullName || "—"}</div>

        <div className="text-white/50">Cél</div>
        <div className="text-white/90">{goalLabel(meta?.goal)}</div>

        <div className="text-white/50">Hol edzel</div>
        <div className="text-white/90">{placeLabel(meta?.trainingPlace)}</div>

        <div className="text-white/50">Heti nap</div>
        <div className="text-white/90">{meta?.daysPerWeek ?? "—"}</div>

        <div className="text-white/50">Kor</div>
        <div className="text-white/90">{meta?.age ?? "—"}</div>

        <div className="text-white/50">Magasság</div>
        <div className="text-white/90">{meta?.heightCm != null ? `${meta.heightCm} cm` : "—"}</div>

        <div className="text-white/50">Súly</div>
        <div className="text-white/90">{meta?.weightKg != null ? `${meta.weightKg} kg` : "—"}</div>
      </div>

      {focus.length ? (
        <div className="mt-3">
          <div className="mb-2 text-xs text-white/50">Fókusz</div>
          <div className="flex flex-wrap gap-2">
            {focus.map((x) => (
              <span key={x} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/80">
                {x}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {meta?.notes ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">{meta.notes}</div>
      ) : null}
    </section>
  );
}
