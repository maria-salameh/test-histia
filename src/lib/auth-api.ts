import { authClient } from "@/lib/auth-client";
import { AuthError, toAuthError } from "@/lib/auth-errors";

// What the Better Auth client resolves with: it does not throw on an HTTP error, it returns `{ data, error }`.
type ApiResult<T> = { data: T | null; error: { status?: number; code?: string } | null };
// The only fetch hook we need: it receives the raw response of a failed call, which is where `X-Retry-After` lives.
type FetchOptions = { onError: (context: { response: Response }) => void };

const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Runs one Better Auth client call and turns every failure into an `AuthError`:
 * API errors (with the `X-Retry-After` header kept on a 429) and network failures alike.
 * Components therefore only ever deal with a resolved value or an `AuthError` carrying a translation key.
 */
async function run<T>(call: (fetchOptions: FetchOptions) => Promise<ApiResult<T>>): Promise<T> {
  // An object, not a `let`: it is written from inside the callback below, where TypeScript would not track it.
  const headers = { retryAfter: null as string | null };
  let result: ApiResult<T>;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    // A form must never spin forever: if the server stays silent, the call ends as the "network" error.
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error("timeout")), REQUEST_TIMEOUT_MS);
    });
    result = await Promise.race([
      call({
        onError: ({ response }) => {
          headers.retryAfter = response.headers.get("X-Retry-After");
        },
      }),
      timeout,
    ]);
  } catch {
    // fetch itself failed (offline, server down, timeout): there is no HTTP answer to look at.
    throw new AuthError("network");
  } finally {
    clearTimeout(timer); // a finished call must not leave a pending timer behind
  }

  if (result.error || result.data === null) throw toAuthError(result.error, headers.retryAfter);
  return result.data;
}

/** The only place the UI talks to the auth server. One method per endpoint of the README. */
export const authApi = {
  signIn: (email: string, password: string) =>
    run((fetchOptions) => authClient.signIn.email({ email, password }, fetchOptions)),

  signUp: (email: string, password: string) =>
    // The design has no name field: the part before the @ is a sensible display name.
    run((fetchOptions) =>
      authClient.signUp.email({ name: email.split("@")[0] || email, email, password }, fetchOptions),
    ),

  // Three ways to pass the second step: the authenticator app, a code sent by email, a single-use recovery code.
  verifyTotp: (code: string) => run((fetchOptions) => authClient.twoFactor.verifyTotp({ code }, fetchOptions)),
  verifyOtp: (code: string) => run((fetchOptions) => authClient.twoFactor.verifyOtp({ code }, fetchOptions)),
  verifyBackupCode: (code: string) =>
    run((fetchOptions) => authClient.twoFactor.verifyBackupCode({ code }, fetchOptions)),
  // The server accepts one email code every 30 s, then answers 429.
  sendOtp: () => run((fetchOptions) => authClient.twoFactor.sendOtp({}, fetchOptions)),

  // `redirectTo` is where the reset link lands; the server appends `?token=…` (or `?error=INVALID_TOKEN`).
  requestPasswordReset: (email: string, redirectTo: string) =>
    run((fetchOptions) => authClient.requestPasswordReset({ email, redirectTo }, fetchOptions)),
  resetPassword: (newPassword: string, token: string) =>
    run((fetchOptions) => authClient.resetPassword({ newPassword, token }, fetchOptions)),

  signOut: () => run((fetchOptions) => authClient.signOut({}, fetchOptions)),
};
