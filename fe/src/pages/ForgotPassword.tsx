import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input } from "../components/ui";
import { forgotPassword } from "../api/auth";
import axios from "axios";
import { FaEnvelope, FaKey, FaPaperPlane } from "react-icons/fa";
import BrandHeader from "../components/BrandHeader";

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
    <div className="pulse-bg relative flex min-h-screen items-center justify-center p-4">
      {/* Top Header */}
      <BrandHeader />

      {/* Main Card */}
      <div className="pulse-glass-card relative z-10 w-full max-w-[420px] rounded-3xl p-8 sm:p-10 my-16 shadow-2xl">
        {/* Floating Glowing Badge */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary pulse-icon-halo text-white">
          {submitted ? <FaPaperPlane className="text-xl" /> : <FaKey className="text-xl" />}
        </div>

        {!submitted ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Forgot password?
              </h1>
              <p className="mt-1.5 text-xs text-slate-400">
                Enter your registered email address and we'll send you instructions to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="forgot-email"
                label="Email address"
                type="email"
                placeholder="alex@pulse.chat"
                autoComplete="email"
                required
                startIcon={<FaEnvelope className="text-xs text-slate-400" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-950/30 p-2.5 text-center text-xs text-red-400"
                >
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="mt-2 py-3.5">
                {loading ? "Sending reset link..." : "Send Reset Link →"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">
              Check your email
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              We've sent a password reset link to:
              <br />
              <span className="font-semibold text-slate-200">{email}</span>
            </p>

            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-left text-xs leading-relaxed text-slate-300">
              <p className="font-semibold text-white">Next steps:</p>
              <ul className="mt-1.5 list-inside list-disc space-y-1 text-slate-300">
                <li>Click the reset link in your email inbox.</li>
                <li>The link is active for 60 minutes.</li>
                <li>Check your spam folder if you can't find it.</li>
              </ul>
            </div>

            {/* Development helper banner when resetLink is returned */}
            {devResetLink && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-left text-xs text-amber-200">
                <p className="font-semibold text-amber-300">
                  ⚡ Development Shortcut:
                </p>
                <div className="mt-2">
                  <a
                    href={devResetLink}
                    className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-500"
                  >
                    Open Reset Link Directly →
                  </a>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 p-2.5 text-center text-xs text-red-400"
              >
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-xs font-semibold text-primary transition-colors hover:text-primary-400 hover:underline disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Resending..." : "Didn't receive an email? Click to resend"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setDevResetLink(null);
                }}
                className="text-xs text-slate-500 transition-colors hover:text-slate-300 hover:underline cursor-pointer"
              >
                Use a different email address
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-slate-800/80 pt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-xs font-semibold text-slate-400 transition-colors hover:text-white"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
