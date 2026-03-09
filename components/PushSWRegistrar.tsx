"use client";
// Regisztrálja a sw-custom.js service workert értesítéshez
// Ez a next-pwa sw.js MELLÉ regisztrál egy külön SW-t

import { useEffect } from "react";

export function PushSWRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw-custom.js", { scope: "/" })
      .then((reg) => {
        console.log("[ARCX] sw-custom.js regisztrálva:", reg.scope);
      })
      .catch((err) => {
        console.warn("[ARCX] sw-custom.js regisztráció hiba:", err);
      });
  }, []);

  return null;
}
