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
  // The "subscribe" half of useSyncExternalStore: here the external event is simply the passing of time.
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!until) return () => {}; // no deadline: nothing to tick for
      const id = window.setInterval(() => {
        notify(); // ask React to re-read the value (it only re-renders if the number changed)
        if (Date.now() >= until) window.clearInterval(id); // finished: stop ticking
      }, 250); // four checks a second keeps the displayed second from lagging
      return () => window.clearInterval(id);
    },
    [until],
  );

  return useSyncExternalStore(
    subscribe,
    // ceil: shows 30 first and reaches 0 only when the deadline has really passed.
    () => (until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0),
    () => 0, // server snapshot: no countdown while rendering on the server
  );
}
