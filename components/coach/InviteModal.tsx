"use client";
// components/coach/InviteModal.tsx
// In-app meghívó: email keresés → user kártya → Firestore invite
import * as React from "react";
import { auth } from "@/lib/firebase";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FoundUser {
  uid: string;
  displayName: string | null;
  email: string;
  photoURL: string | null;
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

async function apiGet(path: string) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export function InviteModal({ open, onClose }: Props) {
  const [email, setEmail] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [foundUser, setFoundUser] = React.useState<FoundUser | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setEmail(""); setGroup(""); setFoundUser(null);
      setNotFound(false); setSending(false); setSent(false); setError(null);
    }
  }, [open]);

  const searchUser = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setSearching(true); setFoundUser(null); setNotFound(false); setError(null); setSent(false);
    try {
      const data = await apiGet(`/api/coach/invite/search-user?email=${encodeURIComponent(trimmed)}`);
      if (data.found) {
        setFoundUser({ uid: data.uid, displayName: data.displayName, email: data.email, photoURL: data.photoURL });
      } else {
        setNotFound(true);
      }
    } catch {
      setError("Hálózati hiba. Próbáld újra.");
    }
    setSearching(false);
  };

  const sendInvite = async () => {
    if (!foundUser) return;
    setSending(true); setError(null);
    try {
      const data = await apiFetch("/api/coach/invite/send-to-user", {
        targetUid: foundUser.uid,
        targetEmail: foundUser.email,
        targetName: foundUser.displayName ?? "",
        group: group.trim(),
      });
      if (data.invite) {
        setSent(true);
      } else {
        setError(data.error ?? "Hiba történt.");
      }
    } catch {
      setError("Hálózati hiba. Próbáld újra.");
    }
    setSending(false);
  };

  if (!open) return null;

  const initials = foundUser
    ? (foundUser.displayName ?? foundUser.email).split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md rounded-3xl p-6 animate-in"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Tag meghívása</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Keress rá az appban regisztrált emailre</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center pressable"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Email kereső */}
        <div className="mb-4">
          <label className="label-xs mb-1.5 block">Email cím</label>
          <div className="flex gap-2">
            <input
              value={email}
              onChange={e => { setEmail(e.target.value); setFoundUser(null); setNotFound(false); setError(null); setSent(false); }}
              onKeyDown={e => e.key === "Enter" && searchUser()}
              placeholder="tag@email.com"
              type="email"
              className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-mid)", color: "var(--text-primary)" }}
            />
            <button
              onClick={searchUser}
              disabled={searching || !email.trim()}
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 pressable"
              style={{ background: "var(--accent-primary)", color: "#080B0F", opacity: searching || !email.trim() ? 0.5 : 1 }}
            >
              {searching
                ? <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              }
            </button>
          </div>
        </div>

        {/* Nincs találat */}
        {notFound && (
          <div className="rounded-2xl px-4 py-3 mb-4 text-sm"
            style={{ background: "rgba(251,191,36,0.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
            ⚠️ Ezzel az email cím{"\u00ed"}mel nem regisztrált még senki az appba.
          </div>
        )}

        {/* Találat – user kártya */}
        {foundUser && !sent && (
          <div className="rounded-2xl p-4 mb-4 animate-in"
            style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.18)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: "linear-gradient(135deg,rgba(34,211,238,0.2),rgba(74,222,128,0.15))", border: "1px solid rgba(34,211,238,0.25)", color: "var(--accent-primary)" }}>
                {initials}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                  {foundUser.displayName ?? "Névtelen felhasználó"}
                </div>
                <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{foundUser.email}</div>
              </div>
              <div className="ml-auto flex-shrink-0 text-xs px-2 py-1 rounded-full font-semibold"
                style={{ background: "rgba(34,211,238,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.2)" }}>
                ✓ Az appban
              </div>
            </div>

            {/* Csoport */}
            <div className="mb-3">
              <label className="label-xs mb-1.5 block">Csoport (opcionális)</label>
              <input value={group} onChange={e => setGroup(e.target.value)} placeholder="pl. A csoport"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-mid)", color: "var(--text-primary)" }} />
            </div>

            {error && (
              <div className="rounded-xl px-3 py-2 mb-3 text-xs"
                style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}

            <button onClick={sendInvite} disabled={sending}
              className="w-full rounded-xl py-3 text-sm font-bold pressable"
              style={{ background: "var(--accent-primary)", color: "#080B0F", opacity: sending ? 0.5 : 1 }}>
              {sending ? "Küldés..." : "Meghívó küldése →"}
            </button>
          </div>
        )}

        {/* Sikeres küldés */}
        {sent && foundUser && (
          <div className="rounded-2xl p-5 mb-4 text-center animate-in"
            style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
            <div className="text-3xl mb-2">🎉</div>
            <div className="font-bold text-sm mb-1" style={{ color: "#4ade80" }}>Meghívó elküldve!</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {foundUser.displayName ?? foundUser.email} megkapja a meghívót az appban.
            </div>
            <button onClick={() => { setEmail(""); setFoundUser(null); setNotFound(false); setSent(false); }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold pressable"
              style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
              Újabb meghívó
            </button>
          </div>
        )}

        {/* Alap tipp */}
        {!foundUser && !notFound && !searching && !sent && (
          <p className="text-xs text-center mt-2" style={{ color: "var(--text-muted)" }}>
            Csak az ARCX appban regisztrált emaileket lehet megtalálni
          </p>
        )}
      </div>
    </div>
  );
}
