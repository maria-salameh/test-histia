"use client";

import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { AuthError } from "@/lib/auth-errors";
import { useCountdown } from "@/lib/use-countdown";

/**
 * Counts down the delay a 429 asked for (its `X-Retry-After` header), so a form can say how long to wait
 * and stay disabled until then.
 */
export function useRetryWindow() {
  const [until, setUntil] = useState<number | null>(null);
  const seconds = useCountdown(until);
  return { seconds, start: (delaySeconds: number) => setUntil(Date.now() + delaySeconds * 1000) };
}

/**
 * Turns whatever a failed call threw into the sentence shown to the user, in the current language.
 * A rate limit with a known delay reads "Try again in N s" and disappears once the delay is over.
 */
export function useAuthErrorText() {
  const errors = useIntlayer("errors");

  return (error: unknown, waitSeconds = 0): string | null => {
    const key = error instanceof AuthError ? error.key : "generic";
    if (key === "tooManyRequests" && error instanceof AuthError && error.retryAfter) {
      return waitSeconds > 0 ? `${errors.tooManyRequestsIn} ${waitSeconds} ${errors.seconds}.` : null;
    }
    return `${errors[key]}`;
  };
}
