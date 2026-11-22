"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whole seconds left until `until` (epoch ms), counting down while it runs; `0` when there is nothing to wait for.
 * The target comes from storage or from the server's `X-Retry-After`, so the value is right after a reload.
 *
 * The clock is read when React asks for the value, never kept in state: a countdown restarted after a long
 * idle time shows the right number on its very first render.
 */
export function useCountdown(until: number | null | undefined): number {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!until) return () => {};
      const id = window.setInterval(() => {
        notify();
        if (Date.now() >= until) window.clearInterval(id);
      }, 250);
      return () => window.clearInterval(id);
    },
    [until],
  );

  return useSyncExternalStore(
    subscribe,
    () => (until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0),
    () => 0,
  );
}
