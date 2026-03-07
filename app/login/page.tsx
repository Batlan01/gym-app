"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE, LS_PROFILES, type Profile } from "@/lib/profiles";
import { ProfileGate } from "@/components/ProfileGate";

// firebase
import { auth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

const LS_AUTH_MODE = "gym.authMode"; // "local" | "firebase"

function fbProfileId(uid: string) {
  return `fb:${uid}`;
}

function ensureFirebaseProfileInList(prev: Profile[], u: User): Profile[] {
  const id = fbProfileId(u.uid);
  if (prev.some((p) => p.id === id)) return prev;

  const name = u.displayName || u.email || "Account";
  const p: Profile = { id, name, createdAt: new Date().toISOString() };
  return [p, ...prev];
}

export default function LoginPage() {
  const router = useRouter();

  const [activeProfileId, setActiveProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const [profiles, setProfiles] = useLocalStorageState<Profile[]>(LS_PROFILES, []);
  const [authMode, setAuthMode] = useLocalStorageState<string>(LS_AUTH_MODE, "local");

  const [openLocalGate, setOpenLocalGate] = React.useState(false);

  const [fbUser, setFbUser] = React.useState<User | null>(null);
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // ha már van aktív profil -> mehetünk tovább
  React.useEffect(() => {
    if (activeProfileId) router.replace("/workout");
  }, [activeProfileId, router]);

  // firebase auth state
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFbUser(u);

      // ha authMode=firebase és nincs aktív profil, akkor felajánljuk/aktiváljuk
      if (u && !activeProfileId && authMode === "firebase") {
        const id = fbProfileId(u.uid);
        setProfiles((prev) => ensureFirebaseProfileInList(prev, u));
        setActiveProfileId(id);
      }
    });
    return () => unsub();
    // szándékosan egyszer fut
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activateFirebaseUser = React.useCallback(
    (u: User) => {
      const id = fbProfileId(u.uid);
      setAuthMode("firebase");
      setProfiles((prev) => ensureFirebaseProfileInList(prev, u));
      setActiveProfileId(id);
    },
    [setAuthMode, setProfiles, setActiveProfileId]
  );

  const doEmailLogin = React.useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      activateFirebaseUser(cred.user);
    } catch (e: any) {
      setErr(e?.message ?? "Hiba a belépésnél.");
    } finally {
      setBusy(false);
    }
  }, [email, pass, activateFirebaseUser]);

  const doEmailRegister = React.useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      activateFirebaseUser(cred.user);
    } catch (e: any) {
      setErr(e?.message ?? "Hiba a regisztrációnál.");
    } finally {
      setBusy(false);
    }
  }, [email, pass, activateFirebaseUser]);

  const doGoogle = React.useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      activateFirebaseUser(cred.user);
    } catch (e: any) {
      setErr(e?.message ?? "Hiba a Google belépésnél.");
    } finally {
      setBusy(false);
    }
  }, [activateFirebaseUser]);

  const doFbSignOut = React.useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      await signOut(auth);
      // csak auth állapotot dobjuk el, a profil választás marad loginon
      setAuthMode("local");
      setActiveProfileId(null);
    } catch (e: any) {
      setErr(e?.message ?? "Hiba kijelentkezésnél.");
    } finally {
      setBusy(false);
    }
  }, [setAuthMode, setActiveProfileId]);

  return (
    <div className="min-h-dvh bg-black text-white">
      <ProfileGate forceOpen={openLocalGate} onClosed={() => setOpenLocalGate(false)}>
        <main className="mx-auto max-w-md px-4 pt-10 pb-10">
          <div className="text-xs tracking-widest text-white/50">GYM APP</div>
          <h1 className="mt-1 text-3xl font-bold text-white">Belépés</h1>
          <p className="mt-2 text-sm text-white/60">
            Válassz: <b>Local profil</b> (offline) vagy <b>Fiók</b> (cloud később).
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-3xl border border-white/10 bg-white/5 p-2">
            <button
              type="button"
              onClick={() => setAuthMode("local")}
              className={`rounded-2xl px-4 py-3 text-sm ${authMode === "local" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"}`}
            >
              Local
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("firebase")}
              className={`rounded-2xl px-4 py-3 text-sm ${authMode === "firebase" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"}`}
            >
              Fiók
            </button>
          </div>

          {authMode === "local" ? (
            <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">Local profilok</div>
              <div className="mt-1 text-sm text-white/55">Offline mód. Minden a telefonon marad.</div>

              <button
                type="button"
                onClick={() => setOpenLocalGate(true)}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 py-3 text-sm text-white hover:bg-white/15 active:scale-[0.99]"
              >
                Profil választás / létrehozás
              </button>

              {profiles.length > 0 ? (
                <div className="mt-3 text-xs text-white/45">Tip: a profilokat a “Local” belépésnél tudod törölni az X-szel.</div>
              ) : null}
            </section>
          ) : null}

          {authMode === "firebase" ? (
            <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Fiók (Firebase Auth)</div>
                  <div className="mt-1 text-sm text-white/55">Email+jelszó vagy Google.</div>
                </div>

                {fbUser ? (
                  <button
                    type="button"
                    onClick={doFbSignOut}
                    disabled={busy}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
                  >
                    Sign out
                  </button>
                ) : null}
              </div>

              {fbUser ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
                  Bejelentkezve: <span className="text-white">{fbUser.email ?? fbUser.uid}</span>
                  <button
                    type="button"
                    onClick={() => activateFirebaseUser(fbUser)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 py-3 text-sm text-white hover:bg-white/15"
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-2">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
                    />
                    <input
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      placeholder="Jelszó"
                      type="password"
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
                    />
                  </div>

                  {err ? (
                    <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">{err}</div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={doEmailLogin}
                      disabled={busy || !email.trim() || pass.length < 6}
                      className="rounded-2xl border border-white/10 bg-white/10 py-3 text-sm text-white hover:bg-white/15 disabled:opacity-40"
                    >
                      Belépés
                    </button>
                    <button
                      type="button"
                      onClick={doEmailRegister}
                      disabled={busy || !email.trim() || pass.length < 6}
                      className="rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
                    >
                      Regisztráció
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={doGoogle}
                    disabled={busy}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
                  >
                    Google belépés
                  </button>
                </>
              )}
            </section>
          ) : null}
        </main>
      </ProfileGate>
    </div>
  );
}
