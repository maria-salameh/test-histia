import { authClient } from "@/lib/auth-client";
import { AuthError, toAuthError } from "@/lib/auth-errors";

type ApiResult<T> = { data: T | null; error: { status?: number; code?: string } | null };
type FetchOptions = { onError: (context: { response: Response }) => void };

/**
 * Runs one Better Auth client call and turns every failure into an `AuthError`:
 * API errors (with the `X-Retry-After` header kept on a 429) and network failures alike.
 */
async function run<T>(call: (fetchOptions: FetchOptions) => Promise<ApiResult<T>>): Promise<T> {
  const headers = { retryAfter: null as string | null };
  let result: ApiResult<T>;

  try {
    result = await call({
      onError: ({ response }) => {
        headers.retryAfter = response.headers.get("X-Retry-After");
      },
    });
  } catch {
    throw new AuthError("network");
  }

  if (result.error || result.data === null) throw toAuthError(result.error, headers.retryAfter);
  return result.data;
}

export const authApi = {
  signIn: (email: string, password: string) =>
    run((fetchOptions) => authClient.signIn.email({ email, password }, fetchOptions)),

  signUp: (email: string, password: string) =>
    // The design has no name field: the part before the @ is a sensible display name.
    run((fetchOptions) =>
      authClient.signUp.email({ name: email.split("@")[0] || email, email, password }, fetchOptions),
    ),

  verifyTotp: (code: string) => run((fetchOptions) => authClient.twoFactor.verifyTotp({ code }, fetchOptions)),
  verifyOtp: (code: string) => run((fetchOptions) => authClient.twoFactor.verifyOtp({ code }, fetchOptions)),
  verifyBackupCode: (code: string) =>
    run((fetchOptions) => authClient.twoFactor.verifyBackupCode({ code }, fetchOptions)),
  sendOtp: () => run((fetchOptions) => authClient.twoFactor.sendOtp({}, fetchOptions)),

  requestPasswordReset: (email: string, redirectTo: string) =>
    run((fetchOptions) => authClient.requestPasswordReset({ email, redirectTo }, fetchOptions)),
  resetPassword: (newPassword: string, token: string) =>
    run((fetchOptions) => authClient.resetPassword({ newPassword, token }, fetchOptions)),

  signOut: () => run((fetchOptions) => authClient.signOut({}, fetchOptions)),
};
