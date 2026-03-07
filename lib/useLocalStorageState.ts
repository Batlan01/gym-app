"use client";

import * as React from "react";
import { lsGet, lsSet, lsSubscribe } from "@/lib/storage";

type Setter<T> = (next: T | ((prev: T) => T)) => void;

/**
 * returns: [value, setValue, hydrated]
 * - SSR-safe: initial értéket ad első renderben
 * - hydration után beolvassa LS-t
 * - sync: más tab + same-tab custom event
 */
export function useLocalStorageState<T>(key: string, initial: T) {
  const initialRef = React.useRef(initial);

  const [value, setValue] = React.useState<T>(initialRef.current);
  const [hydrated, setHydrated] = React.useState(false);

  const read = React.useCallback(() => {
    const next = lsGet<T>(key, initialRef.current);
    setValue(next);
    setHydrated(true);
  }, [key]);

  React.useEffect(() => {
    read();
  }, [read]);

  React.useEffect(() => {
    const unsub = lsSubscribe((changedKey) => {
      if (changedKey === key) read();
    });
    return () => unsub();
  }, [key, read]);

  const set: Setter<T> = React.useCallback(
    (next) => {
      setValue((prev) => {
        const computed = typeof next === "function" ? (next as any)(prev) : next;
        lsSet(key, computed);
        return computed;
      });
    },
    [key]
  );

  return [value, set, hydrated] as const;
}
