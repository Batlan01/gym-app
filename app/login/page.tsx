"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { ProfileGate } from "@/components/ProfileGate";
import { LS_ACTIVE_PROFILE, LS_PROFILES, type Profile, fbProfileId, onboardedKey } from "@/lib/profiles";
import { auth } from "@/lib/firebase";
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, signInWithRedirect,
  signOut, type User,
} from "firebase/auth";

const LS_AUTH_MODE = "gym.authMode";

function ensureFirebaseProfile(prev: Profile[], u: User): Profile[] {
  const id = fbProfileId(u.uid);
  if (prev.some(p => p.id === id)) return prev;
  return [{ id, name: u.displayName || u.email || "Account", createdAt: new Date().toISOString() }, ...prev];
}

export default function LoginPage() {
  const router = useRouter();
  const [, setActiveProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const [profiles, setProfiles] = useLocalStorageState<Profile[]>(LS_PROFILES, []);
  const [authMode, setAuthMode] = useLocalStorageState<string>(LS_AUTH_MODE, "local");
  const [openLocalGate, setOpenLocalGate] = React.useState(false);
  const [fbUser, setFbUser] = React.useState<User | null>(null);
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<"login"|"register">("login");

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setFbUser(u));
    return () => unsub();
  }, []);

  const activateFirebaseUser = React.useCallback((u: User) => {
    const id = fbProfileId(u.uid);

    // Töröljük az összes régi gym.* kulcsot hogy ne legyen stale adat
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("gym.") && k !== LS_PROFILES && !k.startsWith(`gym.${id}`)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Írjuk be a helyes kulcsokkal
    const existingProfiles: Profile[] = JSON.parse(localStorage.getItem(LS_PROFILES) ?? "[]");
    const updatedProfiles = ensureFirebaseProfile(existingProfiles, u);
    localStorage.setItem(LS_PROFILES, JSON.stringify(updatedProfiles));
    localStorage.setItem(LS_AUTH_MODE, JSON.stringify("firebase"));
    localStorage.setItem(LS_ACTIVE_PROFILE, JSON.stringify(id));
    localStorage.setItem(onboardedKey(id), JSON.stringify(true));

    // Hard navigate — nem router.replace, hanem teljes oldalbetöltés
    // így az AppFrame frissen indul és biztosan látja az auth state-et
    window.location.href = "/workout";
  }, []);

  // A Google redirect result-ot az AppFrame kezeli — itt nem kell

  const doEmail = React.useCallback(async () => {
    setErr(null); setBusy(true);
    try {
      const fn = tab === "login" ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
      const cred = await fn(auth, email.trim(), pass);
      activateFirebaseUser(cred.user);
    } catch (e: any) {
      const msg = e?.code === "auth/invalid-credential" ? "Hibás email vagy jelszó."
        : e?.code === "auth/email-already-in-use" ? "Ez az email már regisztrálva van."
        : e?.code === "auth/weak-password" ? "A jelszó legalább 6 karakter legyen."
        : e?.message ?? "Hiba történt.";
      setErr(msg);
    } finally { setBusy(false); }
  }, [email, pass, tab, activateFirebaseUser]);

  const doGoogle = React.useCallback(async () => {
    setErr(null); setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      // Mindig redirect — popup megbízhatatlan Vercel production-on
      await signInWithRedirect(auth, provider);
      return;
    } catch (e: any) {
      if (e?.code !== "auth/popup-closed-by-user") setErr(e?.message ?? "Google hiba.");
    } finally { setBusy(false); }
  }, [activateFirebaseUser]);

  const doSignOut = React.useCallback(async () => {
    await signOut(auth);
    setActiveProfileId(null);
    setAuthMode("local");
  }, [setActiveProfileId, setAuthMode]);

  return (
    <ProfileGate forceOpen={openLocalGate} onClosed={() => setOpenLocalGate(false)}
      onlyLocal onPicked={() => { setOpenLocalGate(false); router.replace("/workout"); }}>
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-10"
        style={{background:"var(--bg-base)"}}>
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-grid h-16 w-16 place-items-center rounded-2xl mb-4"
              style={{background:"rgba(34,211,238,0.1)",border:"1px solid rgba(34,211,238,0.3)",
                boxShadow:"0 0 32px rgba(34,211,238,0.15)"}}>
              <span className="text-xs font-black tracking-widest" style={{color:"var(--accent-primary)"}}>ARCX</span>
            </div>
            <h1 className="text-2xl font-black" style={{color:"var(--text-primary)"}}>Üdv vissza!</h1>
            <p className="text-sm mt-1" style={{color:"var(--text-muted)"}}>Lépj be vagy használd offline módban</p>
          </div>

          {/* Mode választó */}
          <div className="flex gap-1 p-1 rounded-2xl mb-5"
            style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)"}}>
            {(["local","firebase"] as const).map(m => (
              <button key={m} onClick={() => setAuthMode(m)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold pressable transition-all"
                style={authMode===m
                  ? {background:"var(--bg-elevated)",color:"var(--text-primary)"}
                  : {color:"var(--text-muted)"}}>
                {m === "local" ? "📱 Offline" : "☁️ Fiók"}
              </button>
            ))}
          </div>

          {/* ── OFFLINE MÓD ── */}
          {authMode === "local" && (
            <div className="rounded-3xl p-5"
              style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)"}}>
              <div className="text-sm font-bold mb-1" style={{color:"var(--text-primary)"}}>Offline profil</div>
              <div className="text-xs mb-4" style={{color:"var(--text-muted)"}}>
                Az adatok csak ezen az eszközön tárolódnak. Nincs szükség fiókra.
              </div>
              <button onClick={() => setOpenLocalGate(true)}
                className="w-full rounded-2xl py-3 text-sm font-bold pressable"
                style={{background:"rgba(34,211,238,0.1)",color:"var(--accent-primary)",
                  border:"1px solid rgba(34,211,238,0.3)"}}>
                Profil választás →
              </button>
            </div>
          )}

          {/* ── FIÓK MÓD ── */}
          {authMode === "firebase" && (
            <div className="rounded-3xl p-5"
              style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)"}}>

              {/* Ha már be van lépve */}
              {fbUser ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center font-black text-sm"
                      style={{background:"rgba(34,211,238,0.12)",color:"var(--accent-primary)",
                        border:"1px solid rgba(34,211,238,0.3)"}}>
                      {(fbUser.displayName || fbUser.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{color:"var(--text-primary)"}}>
                        {fbUser.displayName || "Bejelentkezve"}
                      </div>
                      <div className="text-xs" style={{color:"var(--text-muted)"}}>{fbUser.email}</div>
                    </div>
                  </div>
                  <button onClick={() => activateFirebaseUser(fbUser)}
                    className="w-full rounded-2xl py-3 text-sm font-black pressable mb-2"
                    style={{background:"var(--accent-primary)",color:"#000"}}>
                    Tovább →
                  </button>
                  <button onClick={doSignOut}
                    className="w-full rounded-2xl py-2.5 text-xs pressable"
                    style={{color:"var(--text-muted)"}}>
                    Kijelentkezés
                  </button>
                </div>
              ) : (
                <>
                  {/* Tab: Login / Regisztráció */}
                  <div className="flex gap-1 p-1 rounded-xl mb-4"
                    style={{background:"var(--bg-card)"}}>
                    {(["login","register"] as const).map(t => (
                      <button key={t} onClick={() => setTab(t)}
                        className="flex-1 rounded-lg py-2 text-xs font-semibold pressable"
                        style={tab===t
                          ? {background:"var(--bg-elevated)",color:"var(--text-primary)"}
                          : {color:"var(--text-muted)"}}>
                        {t === "login" ? "Belépés" : "Regisztráció"}
                      </button>
                    ))}
                  </div>

                  {/* Email / Jelszó */}
                  <div className="space-y-2 mb-3">
                    <input value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="Email cím" type="email" autoComplete="email"
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{background:"var(--bg-card)",border:"1px solid var(--border-mid)",
                        color:"var(--text-primary)"}} />
                    <input value={pass} onChange={e => setPass(e.target.value)}
                      placeholder="Jelszó (min. 6 karakter)" type="password" autoComplete={tab==="login"?"current-password":"new-password"}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{background:"var(--bg-card)",border:"1px solid var(--border-mid)",
                        color:"var(--text-primary)"}} />
                  </div>

                  {err && (
                    <div className="rounded-2xl px-4 py-3 text-xs mb-3"
                      style={{background:"rgba(239,68,68,0.1)",color:"#fca5a5",
                        border:"1px solid rgba(239,68,68,0.2)"}}>
                      {err}
                    </div>
                  )}

                  <button onClick={doEmail} disabled={busy || !email.trim() || pass.length < 6}
                    className="w-full rounded-2xl py-3 text-sm font-black pressable mb-3"
                    style={{background:"var(--accent-primary)",color:"#000",opacity: busy||!email.trim()||pass.length<6 ? 0.5 : 1}}>
                    {busy ? "..." : tab === "login" ? "Belépés" : "Fiók létrehozása"}
                  </button>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1" style={{background:"var(--border-subtle)"}} />
                    <span className="text-[10px] font-bold tracking-widest" style={{color:"var(--text-muted)"}}>VAGY</span>
                    <div className="h-px flex-1" style={{background:"var(--border-subtle)"}} />
                  </div>

                  <button onClick={doGoogle} disabled={busy}
                    className="w-full rounded-2xl py-3 text-sm font-semibold pressable flex items-center justify-center gap-2"
                    style={{background:"var(--bg-card)",color:"var(--text-primary)",
                      border:"1px solid var(--border-mid)"}}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google belépés
                  </button>
                </>
              )}
            </div>
          )}

          <p className="text-center text-xs mt-6" style={{color:"var(--text-muted)"}}>
            ARCX · offline-first · cloud optional
          </p>
        </div>
      </div>
    </ProfileGate>
  );
}
