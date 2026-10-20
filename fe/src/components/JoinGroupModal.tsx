import { useState, type FormEvent } from "react";
import axios from "axios";
import { Modal, Button, UserPlusIcon, CloseIcon, CheckIcon } from "./ui";
import { redeemInviteApi } from "../api/invite";

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: (groupId: string) => void;
}

export const JoinGroupModal = ({
  isOpen,
  onClose,
  onJoined,
}: JoinGroupModalProps) => {
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleClose = () => {
    setInputVal("");
    setError("");
    setSuccessMsg("");
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const raw = inputVal.trim();
    if (!raw) {
      setError("Please paste an invite link or enter an invite code");
      return;
    }

    // Extract token if user pasted full URL (e.g. http://localhost:5173/invite/abc or ?token=abc)
    let token = raw;
    if (raw.includes("/invite/")) {
      const parts = raw.split("/invite/");
      token = parts[parts.length - 1].split("?")[0];
    } else if (raw.includes("token=")) {
      const match = raw.match(/token=([^&]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }

    setError("");
    setLoading(true);

    try {
      const result = await redeemInviteApi(token);
      setSuccessMsg(result.message || "Successfully joined group!");
      setTimeout(() => {
        onJoined(result.groupId);
        handleClose();
      }, 1200);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Invalid or expired invitation");
      } else {
        setError(err.message || "Failed to join group");
      }
    } finally {
      setLoading(false);
    }
  };

  const customHeader = (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-inner">
            <UserPlusIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Join a Group</h2>
            <p className="text-xs text-emerald-100">Enter an invitation code or link</p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus:outline-none"
          aria-label="Close dialog"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      headerCustom={customHeader}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="invite-input" className="block text-sm font-semibold text-gray-800 mb-1.5">
            Invite Link or Code
          </label>
          <textarea
            id="invite-input"
            rows={3}
            required
            placeholder="Paste invite link (e.g. http://localhost:5173/invite/...) or code"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full rounded-xl border border-gray-300 p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 font-mono"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !inputVal.trim()}
            loading={loading}
            variant="success"
          >
            Join Group
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default JoinGroupModal;
