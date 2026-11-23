/** Everything the UI can tell the user about a failed call to the auth API. */
export type AuthErrorKey =
  | "invalidCredentials"
  | "userExists"
  | "invalidCode"
  | "invalidBackupCode"
  | "tooManyCodeAttempts"
  | "attemptExpired"
  | "invalidToken"
  | "tooManyRequests"
  | "network"
  | "generic";

/**
 * What `authApi` throws. A class (not a plain object) so components can tell it from any other error with
 * `instanceof`; `key` selects the translated sentence in src/content/errors.content.ts.
 */
export class AuthError extends Error {
  readonly key: AuthErrorKey;
  /** Seconds to wait before retrying: the `X-Retry-After` header of a 429 answer. */
  readonly retryAfter?: number;

  constructor(key: AuthErrorKey, retryAfter?: number) {
    super(key);
    this.name = "AuthError";
    this.key = key;
    this.retryAfter = retryAfter;
  }
}

type ApiError = { status?: number; code?: string } | null | undefined;

// Error codes documented in the README, plus the neighbours Better Auth can return for the same screens.
// Several server codes can share one message (an expired and a wrong email code read the same to the user).
const KEY_BY_CODE: Record<string, AuthErrorKey> = {
  INVALID_EMAIL_OR_PASSWORD: "invalidCredentials",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "userExists",
  USER_ALREADY_EXISTS: "userExists",
  INVALID_CODE: "invalidCode",
  OTP_HAS_EXPIRED: "invalidCode",
  INVALID_BACKUP_CODE: "invalidBackupCode",
  TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: "tooManyCodeAttempts",
  INVALID_TWO_FACTOR_COOKIE: "attemptExpired", // the sign-in attempt waiting for its second step timed out
  INVALID_TOKEN: "invalidToken", // reset link expired, already used, or never valid
};

export function toAuthError(error: ApiError, retryAfterHeader?: string | null): AuthError {
  // A 429 has no error code (see the README), so it is recognised by its status, and carries the delay.
  if (error?.status === 429) {
    const seconds = Number.parseInt(retryAfterHeader ?? "", 10);
    return new AuthError("tooManyRequests", seconds > 0 ? seconds : undefined);
  }
  // Anything unknown still gets a sentence: "generic" rather than a raw server message in the wrong language.
  return new AuthError((error?.code && KEY_BY_CODE[error.code]) || "generic");
}
