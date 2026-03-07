// app/login/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { lsGet, lsSet } from "@/lib/storage";

import { ProfileMetaCard } from "@/components/ProfileMetaCard";
import { ProfileGate } from "@/components/ProfileGate";

import {
  LS_ACTIVE_PROFILE,
  LS_PROFILES,
  type Profile,
  fbProfileId,
  onboardedKey,
} from "@/lib/profiles";

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

function ensureFirebaseProfileInList(prev: Profile[], u: User): Profile[] {
  const id = fbProfileId(u.uid);
  if (prev.some((p) => p.id === id)) return prev;

  const name = u.displayName || u.email || "Account";
  const p: Profile = { id, name, createdAt: new Date().toISOString() };
  return [p, ...prev];
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

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setFbUser(u));
    return () => unsub();
  }, []);

  const markOnboardingIfMissing = React.useCallback((profileId: string) => {
    const existing = lsGet<boolean | null>(onboardedKey(profileId), null);
    if (existing === null) lsSet(onboardedKey(profileId), false);
  }, []);

  const activateFirebaseUser = React.useCallback(
    (u: User) => {
      const id = fbProfileId(u.uid);
      setAuthMode("firebase");
      setProfiles((prev) => ensureFirebaseProfileInList(prev, u));

      markOnboardingIfMissing(id);

      setActiveProfileId(id);
      router.replace("/workout");
    },
    [setAuthMode, setProfiles, setActiveProfileId, router, markOnboardingIfMissing]
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

  const doSignOut = React.useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      await signOut(auth);

      // fontos: ne maradjon aktív fb:* profil
      setActiveProfileId(null);
      setAuthMode("local");
    } catch (e: any) {
      setErr(e?.message ?? "Hiba kijelentkezésnél.");
    } finally {
      setBusy(false);
    }
  }, [setActiveProfileId, setAuthMode]);

  return (
    <div className="min-h-dvh">
      <ProfileGate
        forceOpen={openLocalGate}
        onClosed={() => setOpenLocalGate(false)}
        onlyLocal
        onPicked={() => {
          setOpenLocalGate(false);
          router.replace("/workout");
        }}
      >
        <main className="mx-auto max-w-md px-4 pt-10 pb-10">
          <div className="text-xs tracking-widest text-white/50">GYM APP</div>
          <h1 className="mt-1 text-3xl font-bold text-white">Belépés</h1>
          <p className="mt-2 text-sm text-white/60">
            Válassz: <b>Local profil</b> (offline) vagy <b>Fiók</b> (később cloud sync).
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-3xl border border-white/10 bg-white/5 p-2">
            <button
              type="button"
              onClick={() => setAuthMode("local")}
              className={`rounded-2xl px-4 py-3 text-sm ${
                authMode === "local" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              Local
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("firebase")}
              className={`rounded-2xl px-4 py-3 text-sm ${
                authMode === "firebase" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
              }`}
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
                <div className="mt-3 text-xs text-white/45">Tip: törlés a profilválasztóban az X-szel.</div>
              ) : null}
            </section>
          ) : null}

          {authMode === "firebase" ? (
            <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Fiók (Firebase Auth)</div>
                  <div className="mt-1 text-sm text-white/55">Email + jelszó kötelező, Google opcionális.</div>
                </div>

                {fbUser ? (
                  <button
                    type="button"
                    onClick={doSignOut}
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
                    <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                      {err}
                    </div>
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

                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-px flex-1 bg-white/10" />
                    <div className="text-[11px] tracking-widest text-white/35">OPTIONAL</div>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <button
                    type="button"
                    onClick={doGoogle}
                    disabled={busy}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
                  >
                    Google belépés (opcionális)
                  </button>
                </>
              )}
            </section>
          ) : null}

          {/* opcionális: itt a loginon is megmutathatod a meta kártyát, de nem kötelező */}
          {/* <div className="mt-6"><ProfileMetaCard /></div> */}
        </main>
      </ProfileGate>
    </div>
  );
}
