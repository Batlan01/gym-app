"use client";

import * as React from "react";
import { lsGet, lsSet } from "./storage";

export function useLocalStorageState<T>(key: string, initial: T) {
  // SSR-safe: első renderben csak az initial
  const [value, setValue] = React.useState<T>(initial);

  // kliensen betöltjük a localStorage értéket
  React.useEffect(() => {
    setValue(lsGet<T>(key, initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // több tab között sync
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(lsGet<T>(key, initial));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, initial]);

  const set = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const computed = typeof next === "function" ? (next as any)(prev) : next;
        lsSet(key, computed);
        return computed;
      });
    },
    [key]
  );

  return [value, set] as const;
}
