"use client";
// components/coach/InviteModal.tsx
import * as React from "react";
import { auth } from "@/lib/firebase";

type Tab = "email" | "code";

interface Props {
  open: boolean;
  onClose: () => void;
}

async function apiFetch(path: string, body: object) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function InviteModal({ open, onClose }: Props) {
  const [tab, setTab] = React.useState<Tab>("email");
  const [email, setEmail] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; msg: string; code?: string } | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!open) { setResult(null); setEmail(""); setGroup(""); setCopied(false); }
  }, [open]);

  const sendEmail = async () => {
    if (!email.trim()) return;
    setBusy(true); setResult(null);
    try {
      const data = await apiFetch("/api/coach/invite/email", { email: email.trim(), group: group.trim() || undefined });
      if (data.invite) {
        setResult({ ok: true, msg: data.alreadyExists ? "Ez az email már meg van hívva." : "✉️ Meghívó email elküldve!" });
      } else {
        setResult({ ok: false, msg: data.error ?? "Hiba történt." });
      }
    } catch { setResult({ ok: false, msg: "Hálózati hiba." }); }
    setBusy(false);
  };

  const generateCode = async () => {
    setBusy(true); setResult(null);
    try {
      const data = await apiFetch("/api/coach/invite/code", { group: group.trim() || undefined });
      if (data.invite?.inviteCode) {
        setResult({ ok: true, msg: "Kód generálva!", code: data.invite.inviteCode });
      } else {
        setResult({ ok: false, msg: data.error ?? "Hiba történt." });
      }
    } catch { setResult({ ok: false, msg: "Hálózati hiba." }); }
    setBusy(false);
  };

  const copyCode = () => {
    if (!result?.code) return;
    navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md rounded-3xl p-6 animate-in"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Tag meghívása</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Válaszd ki a meghívási módot</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center pressable"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabok */}
        <div className="flex gap-1 p-1 rounded-2xl mb-5"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
          {([["email","✉️ Email"], ["code","🔑 Meghívókód"]] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); setResult(null); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold pressable transition-all"
              style={tab === t ? { background: "var(--accent-primary)", color: "#080B0F" } : { color: "var(--text-secondary)" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Csoport */}
        <div className="mb-3">
          <label className="label-xs mb-1.5 block">Csoport (opcionális)</label>
          <input value={group} onChange={e => setGroup(e.target.value)} placeholder="pl. A csoport"
            className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-mid)", color: "var(--text-primary)" }} />
        </div>

        {/* Email tab */}
        {tab === "email" && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="label-xs mb-1.5 block">Email cím</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendEmail()}
                placeholder="tag@email.com" type="email"
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-mid)", color: "var(--text-primary)" }} />
            </div>
            {result && (
              <div className="rounded-2xl px-4 py-3 text-sm"
                style={{ background: result.ok ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
                  color: result.ok ? "#4ade80" : "#fca5a5",
                  border: `1px solid ${result.ok ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                {result.msg}
              </div>
            )}
            <button onClick={sendEmail} disabled={busy || !email.trim()}
              className="w-full rounded-2xl py-3 text-sm font-bold pressable"
              style={{ background: "var(--accent-primary)", color: "#080B0F", opacity: busy || !email.trim() ? 0.5 : 1 }}>
              {busy ? "Küldés..." : "Meghívó küldése →"}
            </button>
          </div>
        )}

        {/* Kód tab */}
        {tab === "code" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Generálj egyedi kódot, amit bármelyik tagnak megadhatsz. 7 napig érvényes.
            </p>
            {result?.code && (
              <div className="rounded-2xl p-4 text-center"
                style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.2)" }}>
                <p className="label-xs mb-2">Meghívókód</p>
                <p className="text-2xl font-black mb-3" style={{ color: "var(--accent-primary)", letterSpacing: "0.12em" }}>
                  {result.code}
                </p>
                <button onClick={copyCode} className="px-5 py-2 rounded-xl text-sm font-semibold pressable"
                  style={{ background: copied ? "rgba(74,222,128,0.2)" : "rgba(34,211,238,0.15)",
                    color: copied ? "#4ade80" : "var(--accent-primary)",
                    border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "rgba(34,211,238,0.3)"}` }}>
                  {copied ? "✓ Másolva!" : "📋 Másolás"}
                </button>
              </div>
            )}
            {result && !result.code && (
              <div className="rounded-2xl px-4 py-3 text-sm"
                style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)" }}>
                {result.msg}
              </div>
            )}
            <button onClick={generateCode} disabled={busy}
              className="w-full rounded-2xl py-3 text-sm font-bold pressable"
              style={{ background: "var(--accent-primary)", color: "#080B0F", opacity: busy ? 0.5 : 1 }}>
              {busy ? "Generálás..." : result?.code ? "🔄 Új kód generálása" : "🔑 Kód generálása"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
