
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../config/prisma";
import { sendPasswordResetEmail } from "../email/email.service";
import type {
  SignupInput,
  SigninInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./auth.schema";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export async function signupUser(input: SignupInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error("EMAIL_EXISTS");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
}

export async function signinUser(input: SigninInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = jwt.sign(
    { sub: user.id },
    getJwtSecret(),
    { expiresIn: "1h", algorithm: "HS256" }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

export async function requestPasswordReset(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  // To prevent account enumeration attacks, always respond with a generic success message
  if (!user) {
    console.log(`[Auth] Password reset requested for non-existent email: ${input.email}`);
    return {
      message: "If an account exists with this email, instructions to reset your password have been sent.",
    };
  }

  // Invalidate any active previous tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  // Generate secure token (64 hex characters)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const resetLink = `${clientUrl}/reset-password?token=${token}`;

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetLink,
    token,
    expiresAt,
  });

  return {
    message: "If an account exists with this email, instructions to reset your password have been sent.",
    // We can also return token/preview info in dev environment if needed
    ...(process.env.NODE_ENV !== "production" ? { resetLink, token } : {}),
  };
}

export async function verifyResetToken(token: string) {
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!tokenRecord) {
    return {
      valid: false,
      message: "This password reset link is invalid or has expired.",
    };
  }

  if (tokenRecord.usedAt !== null) {
    return {
      valid: false,
      message: "This password reset link has already been used.",
    };
  }

  if (tokenRecord.expiresAt < new Date()) {
    return {
      valid: false,
      message: "This password reset link has expired.",
    };
  }

  return {
    valid: true,
    email: tokenRecord.user.email,
    name: tokenRecord.user.name,
  };
}

export async function resetPassword(input: ResetPasswordInput) {
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token: input.token },
  });

  if (
    !tokenRecord ||
    tokenRecord.usedAt !== null ||
    tokenRecord.expiresAt < new Date()
  ) {
    throw new Error("INVALID_OR_EXPIRED_TOKEN");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return {
    message: "Password has been successfully reset. You can now log in with your new password.",
  };
}
