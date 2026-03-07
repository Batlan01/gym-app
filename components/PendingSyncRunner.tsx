"use client";

import * as React from "react";
import { auth } from "@/lib/firebase";
import { flushPending, pendingCount } from "@/lib/pendingSync";

export function PendingSyncRunner() {
  const [uid, setUid] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  const doFlush = React.useCallback(async () => {
    if (!uid) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    if (pendingCount(uid) === 0) return;

    try {
      await flushPending(uid, { max: 25, onlyDue: true, timeoutMs: 7000 });
    } catch {
      // csendben: queue megmarad
    }
  }, [uid]);

  React.useEffect(() => {
    if (!uid) return;

    // induláskor
    doFlush();

    // online event
    const onOnline = () => doFlush();
    window.addEventListener("online", onOnline);

    // periodikus retry
    const t = window.setInterval(() => doFlush(), 30_000);

    // tab vissza foregroundba
    const onVis = () => {
      if (document.visibilityState === "visible") doFlush();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(t);
    };
  }, [uid, doFlush]);

  return null;
}
