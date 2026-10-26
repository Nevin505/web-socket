import nodemailer, { type Transporter } from "nodemailer";
import {
  renderGroupInvitationHtml,
  renderGroupInvitationText,
  renderPasswordResetHtml,
  renderPasswordResetText,
} from "./templates";

export interface GroupInvitationEmailParams {
  to: string;
  inviterName: string;
  groupName: string;
  inviteLink: string;
  token: string;
  expiresAt: Date;
}

export interface PasswordResetEmailParams {
  to: string;
  name: string;
  resetLink: string;
  token: string;
  expiresAt: Date;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let cachedTransporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true";

  if (!host || !user) {
    throw new Error(
      "[Email] Live SMTP credentials (SMTP_HOST, SMTP_USER) must be configured in .env"
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass: pass || "",
    },
  });

  console.log(`[Email] Configured live SMTP with host: ${host}:${port} (${user})`);
  return cachedTransporter;
}

/**
 * Sends a modern, styled group invitation email to the specified recipient using live SMTP.
 */
export async function sendGroupInvitationEmail({
  to,
  inviterName,
  groupName,
  inviteLink,
  token,
  expiresAt,
}: GroupInvitationEmailParams): Promise<SendEmailResult> {
  try {
    const transporter = await getTransporter();
    const fromAddress =
      process.env.EMAIL_FROM || "Chat App <no-reply@chatapp.com>";

    const formattedExpires = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(expiresAt);

    const subject = `You've been invited to join "${groupName}"`;
    const html = renderGroupInvitationHtml({
      inviterName,
      groupName,
      inviteLink,
      token,
      formattedExpires,
    });
    const text = renderGroupInvitationText({
      inviterName,
      groupName,
      inviteLink,
      token,
      formattedExpires,
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email] Live invitation email sent successfully. MessageId: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("[Email] Failed to send invitation email:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

/**
 * Sends a password reset email using live SMTP with secure reset link and manual token.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetLink,
  token,
  expiresAt,
}: PasswordResetEmailParams): Promise<SendEmailResult> {
  try {
    const transporter = await getTransporter();
    const fromAddress =
      process.env.EMAIL_FROM || "Chat App <no-reply@chatapp.com>";

    const formattedExpires = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(expiresAt);

    const subject = "Reset your Chat App password";
    const html = renderPasswordResetHtml({
      name,
      resetLink,
      token,
      formattedExpires,
    });
    const text = renderPasswordResetText({
      name,
      resetLink,
      token,
      formattedExpires,
    });

    console.log(`[Email] Sending live password reset email to ${to}...`);

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email] Live password reset email sent successfully. MessageId: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("[Email] Failed to send password reset email:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}
