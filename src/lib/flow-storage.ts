"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Small persisted state shared by the auth screens. It exists because the server only tells us things once
 * (the 2FA methods at sign-in, "a code was just sent"), yet the UI must survive a page reload: the 30 second
 * resend countdown and the verification screen both have to come back exactly as they were.
 *
 * Stored in localStorage (shared by tabs, like the server-side rate limit is shared by every request),
 * always behind try/catch: storage can be unavailable or full.
 */

export const RESEND_COOLDOWN_SECONDS = 30;
/** The server drops a sign-in attempt waiting for its second step after 10 minutes. */
export const MFA_ATTEMPT_TTL_MS = 10 * 60_000;
/** An emailed code expires after 3 minutes. */
export const EMAIL_CODE_TTL_MS = 3 * 60_000;
/** A reset link expires after one hour. */
export const RESET_LINK_TTL_MS = 60 * 60_000;

const KEYS = {
  mfa: "stolos:mfa",
  reset: "stolos:reset",
  flash: "stolos:flash",
  cooldown: (kind: CooldownKind) => `stolos:cooldown:${kind}`,
} as const;

export type CooldownKind = "otp" | "reset";
export type MfaMethod = "totp" | "otp";

export type MfaAttempt = {
  methods: MfaMethod[];
  startedAt: number;
  /** When the last email code left, if one did. */
  emailSentAt?: number;
};

export type ResetRequest = { email: string; requestedAt: number };

const CHANGE_EVENT = "stolos:storage";

const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string | null) => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the flow still works, it just won't survive a reload.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

const parse = <T>(raw: string | null | undefined): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

/** A stored record is usable while younger than its time to live. Kept out of the hooks: the clock is impure. */
const isFresh = (timestamp: number, ttl: number) => Date.now() - timestamp < ttl;

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

/**
 * Raw stored string; `undefined` while rendering on the server and during hydration, so screens
 * can tell "not read yet" from "nothing stored" and never flash the wrong state.
 */
function useStoredRaw(key: string): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => undefined,
  );
}

// ---- 2FA attempt -------------------------------------------------------------------------------------------

export const saveMfaAttempt = (methods: MfaMethod[]) =>
  write(KEYS.mfa, JSON.stringify({ methods, startedAt: Date.now() } satisfies MfaAttempt));

export const markEmailCodeSent = () => {
  const attempt = parse<MfaAttempt>(read(KEYS.mfa));
  if (attempt) write(KEYS.mfa, JSON.stringify({ ...attempt, emailSentAt: Date.now() } satisfies MfaAttempt));
};

export const clearMfaAttempt = () => write(KEYS.mfa, null);

/** `undefined`: not read yet. `null`: no attempt in progress (or it expired). */
export function useMfaAttempt(): MfaAttempt | null | undefined {
  const raw = useStoredRaw(KEYS.mfa);
  return useMemo(() => {
    if (raw === undefined) return undefined;
    const attempt = parse<MfaAttempt>(raw);
    if (!attempt?.methods?.length) return null;
    return isFresh(attempt.startedAt, MFA_ATTEMPT_TTL_MS) ? attempt : null;
  }, [raw]);
}

// ---- Resend cooldowns -----------------------------------------------------------------------------------------

export const startCooldown = (kind: CooldownKind, seconds = RESEND_COOLDOWN_SECONDS) =>
  write(KEYS.cooldown(kind), String(Date.now() + seconds * 1000));

/** Epoch ms until which resending is blocked, or `null`. `undefined` while not read yet. */
export function useCooldownUntil(kind: CooldownKind): number | null | undefined {
  const raw = useStoredRaw(KEYS.cooldown(kind));
  return useMemo(() => {
    if (raw === undefined) return undefined;
    const until = Number(raw);
    return Number.isFinite(until) && until > 0 ? until : null;
  }, [raw]);
}

export const getCooldownUntil = (kind: CooldownKind): number | null => {
  const until = Number(read(KEYS.cooldown(kind)));
  return Number.isFinite(until) && until > Date.now() ? until : null;
};

// ---- Password reset request -------------------------------------------------------------------------------------

export const saveResetRequest = (email: string) =>
  write(KEYS.reset, JSON.stringify({ email, requestedAt: Date.now() } satisfies ResetRequest));

export const clearResetRequest = () => write(KEYS.reset, null);

/** `undefined`: not read yet. `null`: no recent request. */
export function useResetRequest(): ResetRequest | null | undefined {
  const raw = useStoredRaw(KEYS.reset);
  return useMemo(() => {
    if (raw === undefined) return undefined;
    const request = parse<ResetRequest>(raw);
    if (!request?.email) return null;
    return isFresh(request.requestedAt, RESET_LINK_TTL_MS) ? request : null;
  }, [raw]);
}

// ---- One-shot message for the next screen -----------------------------------------------------------------------

export type FlashKey = "attemptExpired";

export const setFlash = (key: FlashKey) => write(KEYS.flash, key);

/** Reads the message and forgets it, so it shows once. */
export const consumeFlash = (): FlashKey | null => {
  const key = read(KEYS.flash) as FlashKey | null;
  if (key) write(KEYS.flash, null);
  return key;
};
