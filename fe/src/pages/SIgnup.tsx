import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button, Input } from "../components/ui";
import { signup } from "../api/auth";
import axios from "axios";
import { FaEye, FaEyeSlash, FaLock, FaEnvelope, FaUser } from "react-icons/fa";
import BrandHeader from "../components/BrandHeader";

const Signup = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await signup({ name, email, password });
      navigate("/", {
        state: {
          email,
          successMessage: "Account created successfully! Please sign in.",
        },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Signup failed. Try again.");
      } else {
        setError("An unexpected error occurred.");
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
      <div className="pulse-glass-card relative z-10 w-full max-w-[440px] rounded-3xl p-8 sm:p-10 my-16 shadow-2xl">
        {/* Floating Glowing Badge */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary pulse-icon-halo text-white">
          <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6.83L6 14.83V4h12v10z" />
          </svg>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create your account
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Get started with Pulse for free. Connect without friction.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Full Name"
            type="text"
            placeholder="Alex Vance"
            autoComplete="name"
            required
            startIcon={<FaUser className="text-xs text-slate-400" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            id="signup-email"
            label="Email Address"
            type="email"
            placeholder="alex@acme.io"
            autoComplete="email"
            required
            startIcon={<FaEnvelope className="text-xs text-slate-400" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="signup-password"
                className="text-xs font-medium text-slate-300"
              >
                Password
              </label>
              <span className="text-[11px] text-slate-400">
                Min. 8 characters
              </span>
            </div>
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              autoComplete="new-password"
              minLength={8}
              required
              startIcon={<FaLock className="text-xs text-slate-400" />}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Input
            id="confirm-password"
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••••••"
            autoComplete="new-password"
            minLength={8}
            required
            startIcon={<FaLock className="text-xs text-slate-400" />}
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
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-2.5 text-center text-xs text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-2 py-3.5">
            {loading ? "Creating account..." : "Create Account →"}
          </Button>
        </form>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-500">
          By continuing, you agree to Pulse's{" "}
          <span className="text-slate-400 underline cursor-pointer hover:text-slate-300">Terms of Service</span> and{" "}
          <span className="text-slate-400 underline cursor-pointer hover:text-slate-300">Privacy Policy</span>.
        </p>

        {/* Sign in link */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link
            to="/"
            className="font-semibold text-primary transition-colors hover:text-primary-400 hover:underline"
          >
            Sign in &gt;
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;