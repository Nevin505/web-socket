import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button, Input } from "../components/ui";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-gray-500">
            Sign in to continue to your account
          </p>
        </div>

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-800">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              endIcon={
                isPasswordVisible ? (
                  <FaEyeSlash
                    onClick={() => setIsPasswordVisible(false)}
                    className="cursor-pointer"
                  />
                ) : (
                  <FaEye
                    onClick={() => setIsPasswordVisible(true)}
                    className="cursor-pointer"
                  />
                )
              }
              id="password"
              type={isPasswordVisible ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-blue-600 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Home;
