"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Small persisted state shared by the auth screens. It exists because the server only tells us things once
 * (the 2FA methods at sign-in, "a code was just sent"), yet the UI must survive a page reload: the 30 second
 * resend countdown and the verification screen both have to come back exactly as they were.
 *
 * Stored in localStorage (shared by tabs, like the server-side rate limit is shared by every request),
 * always behind try/catch: storage can be unavailable or full. Nothing secret is stored here: no password, no
 * token, no code. The session itself lives in an HttpOnly cookie managed by Better Auth.
 */

/** Mirrors the server rule in src/lib/auth.ts (a client file cannot import it). Keep the two in step. */
export const RESEND_COOLDOWN_SECONDS = 30;
/** The server drops a sign-in attempt waiting for its second step after 10 minutes. */
export const MFA_ATTEMPT_TTL_MS = 10 * 60_000;
/** An emailed code expires after 3 minutes. */
export const EMAIL_CODE_TTL_MS = 3 * 60_000;
/** A reset link expires after one hour. */
export const RESET_LINK_TTL_MS = 60 * 60_000;

// Namespaced keys, so they never collide with anything else on localhost.
const KEYS = {
  mfa: "stolos:mfa", // the sign-in attempt waiting for its second step
  reset: "stolos:reset", // the pending "reset link sent" request
  cooldown: (kind: CooldownKind) => `stolos:cooldown:${kind}`, // when the next resend is allowed
} as const;

/** Which "resend" button a deadline belongs to: the email code, or the password-reset link. */
export type CooldownKind = "otp" | "reset";
/** "totp" = authenticator app, "otp" = code sent by email (the names Better Auth uses). */
export type MfaMethod = "totp" | "otp";

export type MfaAttempt = {
  methods: MfaMethod[];
  startedAt: number;
  /** When the last email code left, if one did. */
  emailSentAt?: number;
};

export type ResetRequest = { email: string; requestedAt: number };

// The browser fires the `storage` event in the OTHER tabs only. Writes in this tab announce themselves with this
// custom event, so every component reading the store re-renders in the tab that wrote it too.
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
    return null; // corrupted or hand-edited value: treat it as absent
  }
};

/** A stored record is usable while younger than its time to live. Kept out of the hooks: the clock is impure. */
const isFresh = (timestamp: number, ttl: number) => Date.now() - timestamp < ttl;

// The "subscribe" half of useSyncExternalStore: tell React when the store may have changed.
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
 *
 * It returns the string itself (not a parsed object) on purpose: useSyncExternalStore compares snapshots with
 * Object.is, and a freshly parsed object would differ on every call and loop forever. Parsing happens in the
 * useMemo of each hook below, only when the string changes.
 */
function useStoredRaw(key: string): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => read(key), // client snapshot
    () => undefined, // server snapshot: nothing to read on the server
  );
}

// ---- 2FA attempt -------------------------------------------------------------------------------------------

// Written by the login form as soon as the server says the account has a second step.
export const saveMfaAttempt = (methods: MfaMethod[]) =>
  write(KEYS.mfa, JSON.stringify({ methods, startedAt: Date.now() } satisfies MfaAttempt));

// Remembers that an email code left, so the link reads "Resend" and a typed code may be tried as an email code.
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
    // Same 10 minutes as the server's two_factor cookie: past that, the stored attempt is worthless.
    return isFresh(attempt.startedAt, MFA_ATTEMPT_TTL_MS) ? attempt : null;
  }, [raw]);
}

// ---- Resend cooldowns -----------------------------------------------------------------------------------------

// Stores a deadline (an absolute time), not a remaining count: a deadline stays true across reloads, other tabs
// and a throttled background tab, a count would drift.
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

// Non-hook version, for event handlers and effects: "is a deadline still running right now?".
export const getCooldownUntil = (kind: CooldownKind): number | null => {
  const until = Number(read(KEYS.cooldown(kind)));
  return Number.isFinite(until) && until > Date.now() ? until : null;
};

// ---- Password reset request -------------------------------------------------------------------------------------

// Lets /forgot-password/sent come back after a reload. The address is only used to resend the link.
export const saveResetRequest = (email: string) =>
  write(KEYS.reset, JSON.stringify({ email, requestedAt: Date.now() } satisfies ResetRequest));

// Called once the password is changed: the request is over, and the address should not linger in storage.
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
