import { z } from "zod";

/** The README: "Password: 8 characters minimum". */
export const PASSWORD_MIN_LENGTH = 8;
export const OTP_LENGTH = 6;

// Messages are keys into the `validation` dictionary (src/content/validation.content.ts), translated where they
// are displayed: the schemas stay language-free and are built once, not rebuilt on every language change.
// `satisfies ValidationKey` below makes the compiler reject a key that has no translation.
export type ValidationKey =
  | "emailRequired"
  | "emailInvalid"
  | "passwordRequired"
  | "passwordTooShort"
  | "confirmRequired"
  | "passwordMismatch"
  | "recoveryCodeRequired";

// trim() first, so an address of only spaces counts as empty; then `pipe` runs the format check only on a
// non-empty string, giving "required" for empty and "invalid" for malformed (never both at once).
const email = z
  .string()
  .trim()
  .min(1, "emailRequired" satisfies ValidationKey)
  .pipe(z.email("emailInvalid" satisfies ValidationKey));

// Used when *choosing* a password (sign-up, reset). At login the password is only required: the server judges it.
const newPassword = z
  .string()
  .min(1, "passwordRequired" satisfies ValidationKey)
  .min(PASSWORD_MIN_LENGTH, "passwordTooShort" satisfies ValidationKey);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "passwordRequired" satisfies ValidationKey),
});

export const signupSchema = z
  .object({
    email,
    password: newPassword,
    confirmPassword: z.string().min(1, "confirmRequired" satisfies ValidationKey),
  })
  // A refine on the whole object, because it compares two fields; `path` attaches the error to the confirmation field.
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    error: "passwordMismatch" satisfies ValidationKey,
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string().min(1, "confirmRequired" satisfies ValidationKey),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    error: "passwordMismatch" satisfies ValidationKey,
  });

export const recoveryCodeSchema = z.object({
  code: z.string().trim().min(1, "recoveryCodeRequired" satisfies ValidationKey),
});

// The form types come from the schemas, so validation and TypeScript can never disagree.
export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type RecoveryCodeValues = z.infer<typeof recoveryCodeSchema>;
