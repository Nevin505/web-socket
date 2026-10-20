import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { redeemInviteApi } from "../api/invite";
import { UserGroupIcon } from "../components/ui";

export const AcceptInvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided in the link.");
    }
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setError("");
    setLoading(true);

    try {
      await redeemInviteApi(token);
      setSuccess(true);
      setTimeout(() => {
        navigate("/chat");
      }, 1500);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Invalid or expired invitation");
      } else {
        setError(err.message || "Failed to accept invitation");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/20">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/25 mb-6">
            <UserGroupIcon className="h-10 w-10 text-white" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Group Invitation
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited to join a group chat!
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-800">
              🎉 Joined successfully! Redirecting to chat...
            </div>
          )}

          {!authLoading && !user ? (
            <div className="space-y-4">
              <p className="text-xs text-center text-gray-500">
                You need an account to accept this invitation.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  to={`/?redirect=/invite/${token}`}
                  className="w-full text-center rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
                >
                  Sign In to Join
                </Link>
                <Link
                  to={`/signup?redirect=/invite/${token}`}
                  className="w-full text-center rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Create an Account
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Logged in as
                </p>
                <p className="font-medium text-gray-900 text-sm">{user?.name} ({user?.email})</p>
              </div>

              <button
                type="button"
                onClick={handleAccept}
                disabled={loading || success || !token}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:opacity-95 disabled:opacity-50"
              >
                {loading ? "Joining Group..." : "Accept & Join Group"}
              </button>
            </div>
          )}

          <div className="pt-2 text-center">
            <Link to="/chat" className="text-xs font-medium text-gray-500 hover:text-gray-800">
              ← Skip to Chats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;
