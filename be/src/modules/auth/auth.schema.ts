
import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email").transform((value) =>
    value.toLowerCase()
  ),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const signinSchema = z.object({
  email: z.string().trim().email("Invalid email").transform((value) =>
    value.toLowerCase()
  ),
  password: z.string().min(1, "Password is required").max(72),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address").transform((value) =>
    value.toLowerCase()
  ),
});

export const verifyResetTokenSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetTokenInput = z.infer<typeof verifyResetTokenSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
