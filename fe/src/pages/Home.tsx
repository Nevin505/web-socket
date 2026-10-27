import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button, Input } from "../components/ui";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import BrandHeader from "../components/BrandHeader";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { email?: string; successMessage?: string } | null;
  const { login } = useAuth();

  const [email, setEmail] = useState(locationState?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(locationState?.successMessage || "");
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/chat"); // redirect after login
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Login failed. Try again.");
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
      <div className="pulse-glass-card relative z-10 w-full max-w-[420px] rounded-3xl p-8 sm:p-10 my-16 shadow-2xl">
        {/* Floating Glowing Badge */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary pulse-icon-halo text-white">
          <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6.83L6 14.83V4h12v10z" />
          </svg>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Sign in to continue to Pulse
          </p>
        </div>

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email or Username"
            type="email"
            placeholder="alex@pulse.chat"
            autoComplete="email"
            required
            startIcon={<span className="text-sm font-semibold text-slate-400">@</span>}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-medium text-slate-300"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-slate-400 transition-colors hover:text-primary"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type={isPasswordVisible ? "text" : "password"}
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
              startIcon={<FaLock className="text-xs text-slate-400" />}
              endIcon={
                isPasswordVisible ? (
                  <FaEyeSlash
                    onClick={() => setIsPasswordVisible(false)}
                    className="cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
                  />
                ) : (
                  <FaEye
                    onClick={() => setIsPasswordVisible(true)}
                    className="cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
                  />
                )
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-2.5 text-center text-xs text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-2 py-3.5">
            {loading ? "Signing in..." : "Sign in →"}
          </Button>
        </form>

        {/* Sign up link */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-primary transition-colors hover:text-primary-400 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Home;
