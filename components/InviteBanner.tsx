"use client";
// components/InviteBanner.tsx
// Meghívó értesítés banner – az appban jelenik meg ha van pending invite
import * as React from "react";
import { useInviteNotification } from "@/lib/useInviteNotification";

export function InviteBanner() {
  const { invites, acceptInvite, declineInvite } = useInviteNotification();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  const visible = invites.filter(i => !dismissed.has(i.id));
  if (visible.length === 0) return null;

  const invite = visible[0]; // egyszerre csak az első invite-ot mutatjuk

  const handleAccept = async () => {
    setBusy("accept");
    await acceptInvite(invite.id);
    setBusy(null);
  };

  const handleDecline = async () => {
    setBusy("decline");
    await declineInvite(invite.id);
    setDismissed(prev => new Set([...prev, invite.id]));
    setBusy(null);
  };

  return (
    <div className="fixed top-4 left-1/2 z-50 w-full max-w-sm px-4 animate-in"
      style={{ transform: "translateX(-50%)" }}>
      <div className="rounded-2xl p-4 shadow-xl"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid rgba(34,211,238,0.3)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.15)"
        }}>
        {/* Icon + szöveg */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
            style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
            🏋️
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>
              Edzői meghívó érkezett!
            </div>
            <div className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Egy edző csapatához hívtak meg az ARCX appban.
              {invite.group ? ` Csoport: ${invite.group}.` : ""}
            </div>
          </div>
        </div>

        {/* Gombok */}
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={!!busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold pressable"
            style={{
              background: "var(--accent-primary)",
              color: "#080B0F",
              opacity: busy ? 0.6 : 1
            }}>
            {busy === "accept" ? "..." : "✓ Elfogadom"}
          </button>
          <button
            onClick={handleDecline}
            disabled={!!busy}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold pressable"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
              opacity: busy ? 0.6 : 1
            }}>
            {busy === "decline" ? "..." : "Elutasítom"}
          </button>
        </div>
      </div>
    </div>
  );
}
