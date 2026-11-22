import { z } from "zod";

/** The README: "Password: 8 characters minimum". */
export const PASSWORD_MIN_LENGTH = 8;
export const OTP_LENGTH = 6;

// Messages are keys into the `validation` dictionary, translated where they are displayed:
// the schemas stay language-free and are built once.
export type ValidationKey =
  | "emailRequired"
  | "emailInvalid"
  | "passwordRequired"
  | "passwordTooShort"
  | "confirmRequired"
  | "passwordMismatch"
  | "recoveryCodeRequired";

const email = z
  .string()
  .trim()
  .min(1, "emailRequired" satisfies ValidationKey)
  .pipe(z.email("emailInvalid" satisfies ValidationKey));

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

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type RecoveryCodeValues = z.infer<typeof recoveryCodeSchema>;
