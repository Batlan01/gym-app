// lib/useLocalStorageState.ts
"use client";

import * as React from "react";
import { lsGet, lsSet, lsSubscribe } from "@/lib/storage";

export function useLocalStorageState<T>(key: string, initialValue: T) {
  // SSR-safe első render
  const [value, setValue] = React.useState<T>(initialValue);
  const [hydrated, setHydrated] = React.useState(false);

  // első kliens read + hydrated
  React.useEffect(() => {
    setValue(lsGet<T>(key, initialValue));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // ✅ sync: más tab + same-tab custom event
  React.useEffect(() => {
    const read = () => setValue(lsGet<T>(key, initialValue));

    const unsub = lsSubscribe((changedKey) => {
      if (!changedKey || changedKey === key) read();
    });

    return () => unsub();
  }, [key, initialValue]);

  // setter: storage írás DEFER (ne legyen side-effect state-updater közben)
  const set = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const computed = typeof next === "function" ? (next as (p: T) => T)(prev) : next;

        // defer -> nem “render közben” fut
        queueMicrotask(() => lsSet(key, computed));

        return computed;
      });
    },
    [key]
  );

  // ✅ kompatibilis: aki 2 elemet destructure-ol, annak is jó
  return [value, set, hydrated] as const;
}
