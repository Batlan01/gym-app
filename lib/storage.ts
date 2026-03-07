// lib/storage.ts
"use client";

export function uid() {
  // elég jó lokális id (offline-first)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const LS_EVENT = "gym:ls";

export function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function lsSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (quota, privacy, stb.)
  }

  // ✅ same-tab sync – DEFER, hogy ne legyen “setState while rendering”
  queueMicrotask(() => {
    try {
      window.dispatchEvent(new CustomEvent(LS_EVENT, { detail: { key } }));
    } catch {
      // ignore
    }
  });
}

export function lsRemove(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}

  queueMicrotask(() => {
    try {
      window.dispatchEvent(new CustomEvent(LS_EVENT, { detail: { key } }));
    } catch {}
  });
}

export function lsSubscribe(handler: (key: string | null) => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    // más tab
    handler(e.key ?? null);
  };

  const onCustom = (e: Event) => {
    // same tab
    const ce = e as CustomEvent<{ key?: string }>;
    handler(ce.detail?.key ?? null);
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(LS_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LS_EVENT, onCustom);
  };
}
