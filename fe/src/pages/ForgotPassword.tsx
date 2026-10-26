import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input } from "../components/ui";
import { forgotPassword } from "../api/auth";
import axios from "axios";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await forgotPassword({ email });
      setSubmitted(true);
      if (response.resetLink) {
        setDevResetLink(response.resetLink);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Unable to process your request. Please try again later."
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await forgotPassword({ email });
      if (response.resetLink) {
        setDevResetLink(response.resetLink);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to resend email.");
      } else {
        setError("Failed to resend email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        {/* Header Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600 shadow-inner">
          {submitted ? "📬" : "🔑"}
        </div>

        {!submitted ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Forgot password?
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Enter your registered email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="forgot-email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                >
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? "Sending reset link..." : "Send reset link"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Check your email
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              We've sent a password reset link to:
              <br />
              <span className="font-semibold text-gray-900">{email}</span>
            </p>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-left text-xs text-blue-900 leading-relaxed">
              <p className="font-semibold text-blue-950">Next steps:</p>
              <ul className="mt-1.5 list-inside list-disc space-y-1 text-blue-800">
                <li>Click the reset link in your email inbox.</li>
                <li>The link is active for 60 minutes.</li>
                <li>Check your spam folder if you can't find it.</li>
              </ul>
            </div>

            {/* Development helper banner when resetLink is returned */}
            {devResetLink && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-left text-xs text-amber-900">
                <p className="font-semibold text-amber-950">
                  ⚡ Development Mode Shortcut:
                </p>
                <p className="mt-1 break-all text-amber-800">
                  {devResetLink}
                </p>
                <div className="mt-2.5">
                  <a
                    href={devResetLink}
                    className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-amber-700"
                  >
                    Open Reset Link Directly →
                  </a>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
              >
                {loading ? "Resending..." : "Didn't receive an email? Click to resend"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setDevResetLink(null);
                }}
                className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
              >
                Use a different email address
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-gray-100 pt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
