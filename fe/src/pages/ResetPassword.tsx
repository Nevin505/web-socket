import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Input } from "../components/ui";
import { verifyResetToken, resetPassword } from "../api/auth";
import { FaEye, FaEyeSlash, FaLock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import BrandHeader from "../components/BrandHeader";
import axios from "axios";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const params = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();

  // Support both /reset-password/:token and /reset-password?token=...
  const initialToken = params.token || searchParams.get("token") || "";

  const [token, setToken] = useState(initialToken);
  const [manualTokenInput, setManualTokenInput] = useState("");
  const [verifying, setVerifying] = useState(!!initialToken);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<{ email?: string; name?: string } | null>(null);
  const [verifyError, setVerifyError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(null);
      return;
    }

    let isMounted = true;
    setVerifying(true);
    setVerifyError("");

    verifyResetToken(token)
      .then((res) => {
        if (!isMounted) return;
        if (res.valid) {
          setTokenValid(true);
          setUserInfo({ email: res.email, name: res.name });
        } else {
          setTokenValid(false);
          setVerifyError(res.message || "Reset link is invalid or has expired.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setTokenValid(false);
        if (axios.isAxiosError(err)) {
          setVerifyError(
            err.response?.data?.message ||
              "This reset link is invalid or has expired."
          );
        } else {
          setVerifyError("Unable to verify reset link. Please try again.");
        }
      })
      .finally(() => {
        if (isMounted) setVerifying(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualTokenInput.trim()) {
      setToken(manualTokenInput.trim());
    }
  };

  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword({
        token,
        password,
      });

      setResetSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setFormError(
          err.response?.data?.message ||
            "Failed to reset password. Please try again."
        );
      } else {
        setFormError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pulse-bg relative flex min-h-screen items-center justify-center p-4">
      {/* Top Header */}
      <BrandHeader />

      {/* Main Card */}
      <div className="pulse-glass-card relative z-10 w-full max-w-[440px] rounded-3xl p-8 sm:p-10 my-16 shadow-2xl">
        {/* State 1: Reset Success */}
        {resetSuccess ? (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-3xl text-emerald-400 border border-emerald-500/30">
              <FaCheckCircle />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Password reset complete!
            </h1>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Your password has been updated securely. You can now sign in with your new credentials.
            </p>

            <div className="mt-8">
              <Button
                onClick={() =>
                  navigate("/", {
                    state: {
                      email: userInfo?.email || "",
                      successMessage:
                        "Password reset successful! Please sign in with your new password.",
                    },
                  })
                }
                className="py-3.5"
              >
                Proceed to Sign in →
              </Button>
            </div>
          </div>
        ) : verifying ? (
          /* State 2: Verifying token */
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <h2 className="text-base font-semibold text-white">
              Verifying reset link...
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Validating your security token
            </p>
          </div>
        ) : tokenValid === false ? (
          /* State 3: Invalid token */
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-2xl text-red-400 border border-red-500/30">
              <FaExclamationTriangle />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Invalid or Expired Link
            </h1>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              {verifyError ||
                "This password reset link is invalid or has already expired."}
            </p>

            <div className="mt-7 flex flex-col gap-3">
              <Link to="/forgot-password">
                <Button className="py-3.5">Request a new reset link</Button>
              </Link>
              <Link
                to="/"
                className="text-xs font-semibold text-slate-400 transition-colors hover:text-white"
              >
                ← Back to sign in
              </Link>
            </div>
          </div>
        ) : !token ? (
          /* State 4: Manual token entry */
          <div>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary pulse-icon-halo text-white">
              <FaLock className="text-xl" />
            </div>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Reset Password
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Please enter the reset token received in your email.
              </p>
            </div>

            <form onSubmit={handleManualTokenSubmit} className="space-y-4">
              <Input
                id="manual-token"
                label="Reset Token"
                type="text"
                placeholder="Paste token here"
                required
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
              />
              <Button type="submit" className="py-3.5">Verify Token</Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary transition-colors hover:text-primary-400 hover:underline"
              >
                Need a new reset link? Click here
              </Link>
            </div>
          </div>
        ) : (
          /* State 5: Token valid -> New password form */
          <div>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary pulse-icon-halo text-white">
              <FaLock className="text-xl" />
            </div>

            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Create new password
              </h1>
              <p className="mt-1.5 text-xs text-slate-400">
                {userInfo?.email ? (
                  <>
                    Resetting password for{" "}
                    <span className="font-semibold text-slate-200">
                      {userInfo.email}
                    </span>
                  </>
                ) : (
                  "Choose a strong password of at least 8 characters."
                )}
              </p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <Input
                  id="new-password"
                  label="New password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  startIcon={<FaLock className="text-xs text-slate-400" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  endIcon={
                    showPassword ? (
                      <FaEyeSlash
                        onClick={() => setShowPassword(false)}
                        className="cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
                      />
                    ) : (
                      <FaEye
                        onClick={() => setShowPassword(true)}
                        className="cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
                      />
                    )
                  }
                />
              </div>

              <div>
                <Input
                  id="confirm-new-password"
                  label="Confirm new password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  startIcon={<FaLock className="text-xs text-slate-400" />}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  endIcon={
                    showConfirmPassword ? (
                      <FaEyeSlash
                        onClick={() => setShowConfirmPassword(false)}
                        className="cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
                      />
                    ) : (
                      <FaEye
                        onClick={() => setShowConfirmPassword(true)}
                        className="cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
                      />
                    )
                  }
                />
              </div>

              {/* Password checks helper */}
              <div className="rounded-xl border border-dark-input-border bg-dark-input/60 p-3 text-xs text-slate-400 space-y-1">
                <div
                  className={`flex items-center gap-1.5 ${
                    password.length >= 8 ? "text-emerald-400 font-medium" : "text-slate-500"
                  }`}
                >
                  <span>{password.length >= 8 ? "✓" : "○"}</span>
                  <span>Minimum 8 characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    confirmPassword && password === confirmPassword
                      ? "text-emerald-400 font-medium"
                      : "text-slate-500"
                  }`}
                >
                  <span>
                    {confirmPassword && password === confirmPassword ? "✓" : "○"}
                  </span>
                  <span>Passwords match</span>
                </div>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-950/30 p-2.5 text-center text-xs text-red-400"
                >
                  {formError}
                </div>
              )}

              <Button type="submit" disabled={submitting} className="mt-2 py-3.5">
                {submitting ? "Resetting password..." : "Reset Password →"}
              </Button>
            </form>

            <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
              <Link
                to="/"
                className="text-xs font-semibold text-slate-400 transition-colors hover:text-white"
              >
                ← Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
