import nodemailer, { type Transporter } from "nodemailer";

interface GroupInvitationEmailParams {
  to: string;
  inviterName: string;
  groupName: string;
  inviteLink: string;
  token: string;
  expiresAt: Date;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  error?: string;
}

let cachedTransporter: Transporter | null = null;
let isEthereal = false;

async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  // If SMTP credentials are provided in .env, use them
  if (host && user) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user,
        pass: pass || "",
      },
    });
    isEthereal = false;
    console.log(`[Email] Configured custom SMTP with host: ${host}`);
    return cachedTransporter;
  }

  // Fallback for development: Use Ethereal test account
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isEthereal = true;
    console.log(
      `[Email] No SMTP credentials configured in .env. Initialized Ethereal dev email account: ${testAccount.user}`
    );
    return cachedTransporter;
  } catch (error) {
    console.warn(
      "[Email] Failed to create Ethereal test account, falling back to JSON stream logger:",
      error
    );
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    isEthereal = false;
    return cachedTransporter;
  }
}

/**
 * Sends a modern, styled group invitation email to the specified recipient.
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

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 36px 30px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; background: rgba(255, 255, 255, 0.2); font-size: 24px; margin-bottom: 12px;">
                👥
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff;">
                Group Chat Invitation
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #dbeafe;">
                Connect and collaborate seamlessly
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
                Hello,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #374151;">
                <strong style="color: #111827;">${inviterName}</strong> has invited you to join the group 
                <strong style="color: #2563eb;">${groupName}</strong>.
              </p>

              <!-- Call to Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
                      Accept &amp; Join Group →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Code Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">
                  Manual Join Code
                </p>
                <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #1e293b; word-break: break-all; background: #ffffff; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
                  ${token}
                </div>
                <p style="margin: 10px 0 0; font-size: 11px; color: #64748b;">
                  Or copy and paste this invite link directly in your browser:
                  <br>
                  <a href="${inviteLink}" style="color: #2563eb; word-break: break-all;">${inviteLink}</a>
                </p>
              </div>

              <!-- Expiry Note -->
              <p style="margin: 20px 0 0; font-size: 12px; color: #6b7280; text-align: center;">
                ⏳ This invitation will expire on <strong>${formattedExpires}</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #f3f4f6; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                If you were not expecting this invitation, you can safely disregard this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Group Chat Invitation

${inviterName} has invited you to join "${groupName}".

Accept your invitation by clicking the link below:
${inviteLink}

Manual Join Code:
${token}

This invitation expires on ${formattedExpires}.

If you did not expect this invitation, you can safely ignore this email.
    `.trim();

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    let previewUrl: string | false = false;
    if (isEthereal) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[Email] Invitation email sent! Ethereal Preview URL: ${previewUrl}`);
      }
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error: any) {
    console.error("[Email] Failed to send invitation email:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

export interface PasswordResetEmailParams {
  to: string;
  name: string;
  resetLink: string;
  token: string;
  expiresAt: Date;
}

/**
 * Sends a password reset email with secure reset link and manual token.
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

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 36px 30px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; background: rgba(255, 255, 255, 0.2); font-size: 24px; margin-bottom: 12px;">
                🔐
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff;">
                Password Reset Request
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #dbeafe;">
                Secure access to your Chat App account
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
                Hello <strong style="color: #111827;">${name}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #374151;">
                We received a request to reset your password. You can reset your password now by clicking the button below:
              </p>

              <!-- Call to Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Code Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">
                  Direct Reset Link
                </p>
                <p style="margin: 0 0 10px; font-size: 12px; color: #64748b; word-break: break-all;">
                  <a href="${resetLink}" style="color: #2563eb;">${resetLink}</a>
                </p>
                <p style="margin: 10px 0 6px; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">
                  Reset Token
                </p>
                <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #1e293b; word-break: break-all; background: #ffffff; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
                  ${token}
                </div>
              </div>

              <!-- Expiry Note -->
              <p style="margin: 20px 0 0; font-size: 12px; color: #6b7280; text-align: center;">
                ⏳ This reset link will expire on <strong>${formattedExpires}</strong> (in 1 hour).
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #f3f4f6; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Reset your Chat App password

Hello ${name},

We received a request to reset your password. You can reset it by visiting:
${resetLink}

Reset Token:
${token}

This link expires on ${formattedExpires} (in 1 hour).

If you did not request this, please disregard this email.
    `.trim();

    console.log(`[Email] Sending password reset email to ${to}...`);
    console.log(`[Email] Direct Reset Link: ${resetLink}`);

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    let previewUrl: string | false = false;
    if (isEthereal) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[Email] Password reset preview URL: ${previewUrl}`);
      }
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error: any) {
    console.error("[Email] Failed to send password reset email:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

