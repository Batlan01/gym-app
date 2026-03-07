"use client";

import * as React from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { flushPending } from "@/lib/pendingSync";

export function CloudSyncManager() {
  React.useEffect(() => {
    let uid: string | null = null;
    let interval: any = null;

    const doFlush = async () => {
      if (!uid) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;

      try {
        // ✅ a mi pendingSync.ts-ben: { max, timeoutMs }
        await flushPending(uid, { limit: 25, onlyDue: true });

      } catch {
        // csendben – queue megmarad
      }
    };

    const unsub = onAuthStateChanged(auth, (u) => {
      uid = u?.uid ?? null;

      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      if (uid) {
        doFlush(); // azonnal
        interval = setInterval(doFlush, 20_000); // 20s
      }
    });

    const onOnline = () => doFlush();
    window.addEventListener("online", onOnline);

    const onVis = () => {
      if (document.visibilityState === "visible") doFlush();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      unsub();
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVis);
      if (interval) clearInterval(interval);
    };
  }, []);

  return null;
}
