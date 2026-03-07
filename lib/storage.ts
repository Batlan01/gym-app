"use client";

export const LS_EVENT = "gym:ls";

export function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function lsSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return;

  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }

  // same-tab notify
  try {
    window.dispatchEvent(new CustomEvent(LS_EVENT, { detail: { key } }));
  } catch {
    // ignore
  }
}

// ✅ Overload: lsSubscribe(cb) OR lsSubscribe(key, cb)
export function lsSubscribe(
  keyOrCb: string | ((changedKey: string) => void),
  maybeCb?: () => void
) {
  const key = typeof keyOrCb === "string" ? keyOrCb : null;
  const cb =
    typeof keyOrCb === "function"
      ? keyOrCb
      : (_changedKey: string) => {
          maybeCb?.();
        };

  const onCustom = (e: Event) => {
    const changedKey = (e as CustomEvent)?.detail?.key as string | undefined;
    if (!changedKey) return;
    if (key && changedKey !== key) return;
    cb(changedKey);
  };

  const onStorage = (e: StorageEvent) => {
    const changedKey = e.key ?? "";
    if (!changedKey) return;
    if (key && changedKey !== key) return;
    cb(changedKey);
  };

  window.addEventListener(LS_EVENT, onCustom as any);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(LS_EVENT, onCustom as any);
    window.removeEventListener("storage", onStorage);
  };
}

export function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
}
