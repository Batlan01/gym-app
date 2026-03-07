"use client";

import * as React from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { flushPending, pendingCount, clearPending } from "@/lib/pendingSync";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";

function cloudUidFromProfileId(profileId: string | null | undefined): string | null {
  if (!profileId) return null;
  if (!profileId.startsWith("fb:")) return null;
  const uid = profileId.slice(3).trim();
  return uid.length ? uid : null;
}

function dotClass(ok: boolean) {
  return ok ? "bg-emerald-400/80" : "bg-rose-400/80";
}

export function SyncStatusCard() {
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  const [user, setUser] = React.useState<User | null>(null);
  const [online, setOnline] = React.useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine !== false : true
  );
  const [pendingN, setPendingN] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<null | { tone: "ok" | "warn"; text: string }>(null);

  const cloudUid = React.useMemo(() => cloudUidFromProfileId(activeProfileId), [activeProfileId]);
  const cloudActive = !!cloudUid && user?.uid === cloudUid;

  // auth
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return () => unsub();
  }, []);

  // online/offline
  React.useEffect(() => {
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => {
      window.removeEventListener("online", onOn);
      window.removeEventListener("offline", onOff);
    };
  }, []);

  // pending count refresh
  React.useEffect(() => {
    if (!cloudActive || !user) {
      setPendingN(0);
      return;
    }

    const refresh = () => setPendingN(pendingCount(user.uid));
    refresh();

    const t = window.setInterval(refresh, 1500);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [cloudActive, user]);

  // message auto-hide
  React.useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [msg]);

  const doFlush = React.useCallback(async () => {
    if (!user || !cloudActive) return;
    if (!online) {
      setMsg({ tone: "warn", text: "Offline vagy – most nem tudok szinkronizálni." });
      return;
    }
    if (pendingCount(user.uid) === 0) {
      setMsg({ tone: "ok", text: "Nincs pending tétel." });
      return;
    }

    try {
      setBusy(true);
      await flushPending(user.uid, { limit: 50, onlyDue: true });
      setMsg({ tone: "ok", text: "Szinkron lefutott." });
    } catch {
      setMsg({ tone: "warn", text: "Szinkron hiba – a queue megmaradt, később újrapróbálja." });
    } finally {
      setBusy(false);
    }
  }, [user, cloudActive, online]);

  const doClear = React.useCallback(() => {
    if (!user || !cloudActive) return;
    const ok = window.confirm("Biztos törlöd a pending queue-t? Ez eldobja a fel nem töltött edzéseket.");
    if (!ok) return;
    clearPending(user.uid);
    setMsg({ tone: "ok", text: "Pending queue törölve." });
    setPendingN(0);
  }, [user, cloudActive]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Felhő szinkron</div>
          <div className="mt-1 text-xs text-white/55">
            Profil:{" "}
            <span className="text-white/70">{activeProfileId ?? "guest"}</span>
          </div>
          <div className="mt-1 text-xs text-white/55">
            Bejelentkezve:{" "}
            <span className="text-white/70">
              {user ? (user.email ?? user.uid) : "nem"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span className={`h-2 w-2 rounded-full ${dotClass(online)}`} />
            {online ? "Online" : "Offline"}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span className={`h-2 w-2 rounded-full ${dotClass(cloudActive)}`} />
            {cloudActive ? "Cloud profil aktív" : "Lokál / vendég"}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] text-white/50">Pending</div>
          <div className="mt-1 text-lg font-semibold text-white">{cloudActive ? pendingN : 0}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] text-white/50">Állapot</div>
          <div className="mt-1 text-sm font-semibold text-white">
            {cloudActive ? (pendingN > 0 ? "Szinkron vár" : "Rendben") : "Lokál"}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] text-white/50">Net</div>
          <div className="mt-1 text-sm font-semibold text-white">{online ? "OK" : "Nincs"}</div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={doFlush}
          disabled={!cloudActive || !user || busy}
          className={`flex-1 rounded-2xl px-3 py-2 text-sm ${
            cloudActive && user
              ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
              : "border border-white/10 bg-white/5 text-white/30"
          }`}
        >
          {busy ? "Sync..." : "Sync most"}
        </button>

        <button
          onClick={doClear}
          disabled={!cloudActive || !user || pendingN === 0}
          className={`rounded-2xl px-3 py-2 text-sm ${
            cloudActive && user && pendingN > 0
              ? "border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
              : "border border-white/10 bg-white/5 text-white/30"
          }`}
        >
          Clear
        </button>
      </div>

      {msg ? (
        <div
          className={`mt-3 rounded-2xl border p-3 text-xs ${
            msg.tone === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
              : "border-amber-500/30 bg-amber-500/10 text-amber-100"
          }`}
        >
          {msg.text}
        </div>
      ) : null}
    </div>
  );
}
