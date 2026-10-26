import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Input } from "../components/ui";
import { verifyResetToken, resetPassword } from "../api/auth";
import { FaEye, FaEyeSlash } from "react-icons/fa";
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
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        {/* State: Password successfully reset */}
        {resetSuccess ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl text-emerald-600">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Password reset complete!
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been updated successfully. You can now sign in with your new credentials.
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
              >
                Proceed to Sign in →
              </Button>
            </div>
          </div>
        ) : verifying ? (
          /* State: Verifying token on initial load */
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <h2 className="text-lg font-semibold text-gray-800">
              Verifying reset link...
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Please wait while we validate your token.
            </p>
          </div>
        ) : tokenValid === false ? (
          /* State: Token is invalid or expired */
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-2xl text-red-600">
              ⚠️
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invalid or Expired Link
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {verifyError ||
                "This password reset link is invalid or has already expired."}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link to="/forgot-password">
                <Button>Request a new reset link</Button>
              </Link>
              <Link
                to="/"
                className="text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                ← Back to sign in
              </Link>
            </div>
          </div>
        ) : !token ? (
          /* State: No token provided in URL - allow manual entry */
          <div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
              🔐
            </div>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Reset Password
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Please enter the reset token received in your email.
              </p>
            </div>

            <form onSubmit={handleManualTokenSubmit} className="space-y-4">
              <Input
                id="manual-token"
                label="Reset Token"
                type="text"
                placeholder="Paste your reset token here"
                required
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
              />
              <Button type="submit">Verify Token</Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Need a new reset link? Click here
              </Link>
            </div>
          </div>
        ) : (
          /* State: Token is valid - show new password form */
          <div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
              🔒
            </div>

            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Create new password
              </h1>
              <p className="mt-1 text-xs text-gray-500">
                {userInfo?.email ? (
                  <>
                    Resetting password for{" "}
                    <span className="font-semibold text-gray-800">
                      {userInfo.email}
                    </span>
                  </>
                ) : (
                  "Your new password must be at least 8 characters long."
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  endIcon={
                    showPassword ? (
                      <FaEyeSlash
                        onClick={() => setShowPassword(false)}
                        className="cursor-pointer text-gray-500 hover:text-gray-700"
                      />
                    ) : (
                      <FaEye
                        onClick={() => setShowPassword(true)}
                        className="cursor-pointer text-gray-500 hover:text-gray-700"
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  endIcon={
                    showConfirmPassword ? (
                      <FaEyeSlash
                        onClick={() => setShowConfirmPassword(false)}
                        className="cursor-pointer text-gray-500 hover:text-gray-700"
                      />
                    ) : (
                      <FaEye
                        onClick={() => setShowConfirmPassword(true)}
                        className="cursor-pointer text-gray-500 hover:text-gray-700"
                      />
                    )
                  }
                />
              </div>

              {/* Password checks helper */}
              <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
                <div
                  className={`flex items-center gap-1.5 ${
                    password.length >= 8 ? "text-emerald-600 font-medium" : "text-gray-500"
                  }`}
                >
                  <span>{password.length >= 8 ? "✓" : "○"}</span>
                  <span>Minimum 8 characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    confirmPassword && password === confirmPassword
                      ? "text-emerald-600 font-medium"
                      : "text-gray-500"
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
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                >
                  {formError}
                </div>
              )}

              <Button type="submit" disabled={submitting}>
                {submitting ? "Resetting password..." : "Reset password"}
              </Button>
            </form>

            <div className="mt-6 border-t border-gray-100 pt-4 text-center">
              <Link
                to="/"
                className="text-xs font-semibold text-gray-500 hover:text-gray-800"
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
