
import type { RequestHandler } from "express";
import {
  signupSchema,
  signinSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema";
import {
  signupUser,
  signinUser,
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
} from "./auth.service";

export const signup: RequestHandler = async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const user = await signupUser(parsed.data);

    res.status(201).json({
      message: "Signup successful",
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const signin: RequestHandler = async (req, res) => {
  const parsed = signinSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await signinUser(parsed.data);
    console.log("the resuklt", result)
    res.status(200).json({
      message: "Signin successful",
      ...result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_CREDENTIALS"
    ) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }
    console.error("Signin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword: RequestHandler = async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await requestPasswordReset(parsed.data);
    res.status(200).json(result);
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to process forgot password request" });
  }
};

export const verifyResetTokenController: RequestHandler = async (req, res) => {
  const token = typeof req.params.token === "string" ? req.params.token : (req.query.token as string);

  if (!token) {
    res.status(400).json({ valid: false, message: "Token is required" });
    return;
  }

  try {
    const result = await verifyResetToken(token);
    if (!result.valid) {
      res.status(400).json(result);
      return;
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({ valid: false, message: "Failed to verify token" });
  }
};

export const resetPasswordController: RequestHandler = async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await resetPassword(parsed.data);
    res.status(200).json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_OR_EXPIRED_TOKEN"
    ) {
      res.status(400).json({
        message: "This password reset link is invalid or has expired. Please request a new one.",
      });
      return;
    }
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
