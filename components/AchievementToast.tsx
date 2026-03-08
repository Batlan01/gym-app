"use client";
// components/AchievementToast.tsx
// Felugró értesítés amikor új achievement unlockol

import * as React from "react";
import { ACHIEVEMENTS, TIER_COLORS, type UnlockedAchievement } from "@/lib/achievements";

type Props = {
  newAchievements: UnlockedAchievement[];
  onDismiss: () => void;
};

export function AchievementToast({ newAchievements, onDismiss }: Props) {
  const [visible, setVisible] = React.useState(false);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    if (newAchievements.length === 0) return;
    setIdx(0);
    setVisible(true);
  }, [newAchievements]);

  React.useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      if (idx < newAchievements.length - 1) {
        setIdx(i => i + 1);
      } else {
        setVisible(false);
        onDismiss();
      }
    }, 3200);
    return () => clearTimeout(t);
  }, [visible, idx, newAchievements.length, onDismiss]);

  if (!visible || newAchievements.length === 0) return null;

  const ach = ACHIEVEMENTS.find(a => a.id === newAchievements[idx]?.id);
  if (!ach) return null;

  const colors = TIER_COLORS[ach.tier];

  return (
    <div
      className="fixed left-0 right-0 z-[100] mx-auto max-w-md px-4"
      style={{ bottom: 110 }}
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl"
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          backdropFilter: "blur(20px)",
          animation: "slideUp 0.35s ease-out",
        }}
      >
        {/* Icon */}
        <div
          className="h-11 w-11 shrink-0 flex items-center justify-center rounded-2xl text-2xl"
          style={{ background: "rgba(0,0,0,0.25)" }}
        >
          {ach.icon}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black tracking-widest mb-0.5" style={{ color: colors.text }}>
            🏆 ACHIEVEMENT FELOLDVA
          </div>
          <div className="text-sm font-bold" style={{ color: "#fff" }}>{ach.title}</div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
            {ach.description} · +{ach.xp} XP
          </div>
        </div>

        {/* Counter ha több van */}
        {newAchievements.length > 1 && (
          <div className="shrink-0 text-xs font-bold" style={{ color: colors.text }}>
            {idx + 1}/{newAchievements.length}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
