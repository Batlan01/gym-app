"use client";
// app/join/page.tsx
// Meghívó elfogadó oldal – ?invite=<inviteId> vagy ?code=ARCX-XXXXXX
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, type User,
} from "firebase/auth";

type Step = "loading" | "login" | "confirm" | "success" | "error";

interface InviteInfo {
  teamName: string;
  coachName: string;
  group?: string;
  expiresAt: string;
}

export default function JoinPage() {
  const router = useRouter();
  const params = useSearchParams();
  const inviteId = params.get("invite");
  const inviteCode = params.get("code");

  const [step, setStep] = React.useState<Step>("loading");
  const [user, setUser] = React.useState<User | null>(null);
  const [inviteInfo, setInviteInfo] = React.useState<InviteInfo | null>(null);
  const [errMsg, setErrMsg] = React.useState("");

  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [authTab, setAuthTab] = React.useState<"login" | "register">("register");
  const [busy, setBusy] = React.useState(false);
  const [authErr, setAuthErr] = React.useState("");

  // Auth állapot figyelés
  React.useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  // Meghívó adatok betöltése
  React.useEffect(() => {
    if (!inviteId && !inviteCode) {
      setErrMsg("Érvénytelen meghívó link."); setStep("error"); return;
    }
    fetchInviteInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteId, inviteCode]);

  const fetchInviteInfo = async () => {
    try {
      const qs = inviteId ? `?invite=${inviteId}` : `?code=${inviteCode}`;
      const res = await fetch(`/api/coach/invite/info${qs}`);
      const data = await res.json();
      if (!res.ok || !data.invite) {
        setErrMsg(data.error ?? "A meghívó nem található vagy lejárt.");
        setStep("error"); return;
      }
      setInviteInfo({ teamName: data.invite.teamName, coachName: data.invite.coachName,
        group: data.invite.group, expiresAt: data.invite.expiresAt });
      setStep(user ? "confirm" : "login");
    } catch {
      setErrMsg("Nem sikerült betölteni a meghívót."); setStep("error");
    }
  };

  // Ha bejelentkezett, ugorj confirm-re
  React.useEffect(() => {
    if (user && step === "login") setStep("confirm");
  }, [user, step]);

  const doAuth = async () => {
    setAuthErr(""); setBusy(true);
    try {
      const fn = authTab === "login" ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
      await fn(auth, email.trim(), pass);
    } catch (e: unknown) {
      const err = e as { code?: string };
      setAuthErr(err?.code === "auth/invalid-credential" ? "Hibás email vagy jelszó."
        : err?.code === "auth/email-already-in-use" ? "Ez az email már regisztrált."
        : err?.code === "auth/weak-password" ? "Legalább 6 karakteres jelszó szükséges."
        : "Hiba történt.");
    }
    setBusy(false);
  };

  const doGoogle = async () => {
    setBusy(true);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch { /* user closed */ }
    setBusy(false);
  };

  const acceptInvite = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const body: Record<string, string> = {
        displayName: displayName.trim() || user.displayName || user.email?.split("@")[0] || "Tag",
      };
      if (inviteId) body.inviteId = inviteId;
      if (inviteCode) body.inviteCode = inviteCode;

      const res = await fetch("/api/coach/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error ?? "Hiba történt."); setStep("error"); return; }
      setStep("success");
    } catch { setErrMsg("Hálózati hiba."); setStep("error"); }
    setBusy(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-grid h-14 w-14 place-items-center rounded-2xl mb-3"
            style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)", boxShadow: "0 0 28px rgba(34,211,238,0.12)" }}>
            <span className="text-xs font-black tracking-widest" style={{ color: "var(--accent-primary)" }}>ARCX</span>
          </div>
          <p className="text-xs font-semibold tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>PREMIUM COACH PLATFORM</p>
        </div>

        {/* ── LOADING ── */}
        {step === "loading" && (
          <div className="text-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent mx-auto animate-spin mb-3"
              style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Meghívó betöltése...</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === "error" && (
          <div className="rounded-3xl p-6 text-center"
            style={{ background: "var(--bg-surface)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="text-3xl mb-3">⚠️</div>
            <h2 className="font-bold text-base mb-2" style={{ color: "var(--text-primary)" }}>Meghívó nem elérhető</h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{errMsg}</p>
            <button onClick={() => router.push("/")} className="w-full rounded-2xl py-3 text-sm font-semibold pressable"
              style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
              Vissza a főoldalra
            </button>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === "success" && (
          <div className="rounded-3xl p-6 text-center"
            style={{ background: "var(--bg-surface)", border: "1px solid rgba(74,222,128,0.3)" }}>
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>Csatlakoztál!</h2>
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Sikeresen csatlakoztál a</p>
            <p className="font-bold text-base mb-5" style={{ color: "var(--accent-primary)" }}>{inviteInfo?.teamName}</p>
            <button onClick={() => router.push("/workout")} className="w-full rounded-2xl py-3 text-sm font-bold pressable"
              style={{ background: "var(--accent-primary)", color: "#080B0F" }}>
              Nyissa meg az ARCX appot →
            </button>
          </div>
        )}

        {/* ── LOGIN ── */}
        {step === "login" && inviteInfo && (
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl p-5"
              style={{ background: "var(--bg-surface)", border: "1px solid rgba(34,211,238,0.2)" }}>
              <p className="label-xs mb-1">Meghívó</p>
              <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                {inviteInfo.coachName} meghívott a <span style={{ color: "var(--accent-primary)" }}>{inviteInfo.teamName}</span> csapatba
              </h2>
              {inviteInfo.group && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Csoport: {inviteInfo.group}</p>}
            </div>

            <div className="rounded-3xl p-5"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Jelentkezz be az elfogadáshoz</p>

              <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: "var(--surface-1)" }}>
                {(["register","login"] as const).map(t => (
                  <button key={t} onClick={() => setAuthTab(t)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold pressable"
                    style={authTab === t ? { background: "var(--bg-elevated)", color: "var(--text-primary)" } : { color: "var(--text-muted)" }}>
                    {t === "register" ? "Regisztráció" : "Belépés"}
                  </button>
                ))}
              </div>

              <div className="space-y-2 mb-3">
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-mid)", color: "var(--text-primary)" }} />
                <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Jelszó (min. 6 karakter)" type="password"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-mid)", color: "var(--text-primary)" }} />
              </div>
              {authErr && <p className="text-xs mb-3 px-2" style={{ color: "#fca5a5" }}>{authErr}</p>}
              <button onClick={doAuth} disabled={busy || !email.trim() || pass.length < 6}
                className="w-full rounded-2xl py-3 text-sm font-bold pressable mb-3"
                style={{ background: "var(--accent-primary)", color: "#080B0F", opacity: busy || !email.trim() || pass.length < 6 ? 0.5 : 1 }}>
                {busy ? "..." : authTab === "register" ? "Fiók létrehozása" : "Belépés"}
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
                <span className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>VAGY</span>
                <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
              </div>
              <button onClick={doGoogle} disabled={busy}
                className="w-full rounded-2xl py-3 text-sm font-semibold pressable flex items-center justify-center gap-2"
                style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-mid)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google-lel
              </button>
            </div>
          </div>
        )}

        {/* ── CONFIRM ── */}
        {step === "confirm" && inviteInfo && (
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl p-5"
              style={{ background: "var(--bg-surface)", border: "1px solid rgba(34,211,238,0.2)" }}>
              <p className="label-xs mb-1">Meghívó részletei</p>
              <h2 className="font-bold text-lg mt-1" style={{ color: "var(--text-primary)" }}>
                {inviteInfo.coachName} csapatához
              </h2>
              <p className="text-base mt-0.5" style={{ color: "var(--accent-primary)" }}>{inviteInfo.teamName}</p>
              {inviteInfo.group && <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>Csoport: {inviteInfo.group}</p>}
            </div>

            <div className="rounded-3xl p-5"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <label className="label-xs mb-1.5 block">Neved (ahogy az edző látja)</label>
              <input value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={user?.displayName || user?.email?.split("@")[0] || "Teljes neved"}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none mb-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-mid)", color: "var(--text-primary)" }} />
              <button onClick={acceptInvite} disabled={busy}
                className="w-full rounded-2xl py-3.5 text-sm font-bold pressable"
                style={{ background: "linear-gradient(135deg,#22d3ee,#4ade80)", color: "#080B0F", opacity: busy ? 0.6 : 1 }}>
                {busy ? "Csatlakozás..." : "✅ Meghívó elfogadása"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
