import { useState, type FormEvent } from "react";
import axios from "axios";
import {
  Modal,
  Button,
  Input,
  Avatar,
  UserGroupIcon,
  CloseIcon,
  CheckCircleIcon,
  LinkIcon,
  PlusIcon,
} from "./ui";
import { createGroupApi } from "../api/group";
import type { Group } from "../types/group";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: Group, shouldOpenInvite?: boolean) => void;
}

const PRESET_LIMITS = [4, 8, 16, 32];

export const CreateGroupModal = ({
  isOpen,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) => {
  const [name, setName] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [customLimit, setCustomLimit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);

  const handleReset = () => {
    setName("");
    setMaxMembers(4);
    setCustomLimit(false);
    setError("");
    setCreatedGroup(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a group name");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await createGroupApi({
        name: trimmed,
        maxMembers,
      });
      const groupData: Group = res.group || {
        id: crypto.randomUUID(),
        name: trimmed,
        maxMembers,
        createdById: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCreatedGroup(groupData);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Failed to create group");
      } else {
        setError(err.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAndInvite = () => {
    if (createdGroup) {
      onGroupCreated(createdGroup, true);
      handleClose();
    }
  };

  const handleCompleteAndChat = () => {
    if (createdGroup) {
      onGroupCreated(createdGroup, false);
      handleClose();
    }
  };

  const customHeader = (
    <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-inner">
            <UserGroupIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {createdGroup ? "Group Created!" : "Create New Group"}
            </h2>
            <p className="text-xs text-primary-100">
              {createdGroup
                ? "Your group is ready for conversation"
                : "Connect with friends and collaborators"}
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus:outline-none cursor-pointer"
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
      {createdGroup ? (
        /* Success State */
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircleIcon className="h-8 w-8 text-emerald-400" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{createdGroup.name}</h3>
            <p className="mt-1 text-xs text-slate-400">
              You are the owner of this group. Up to {createdGroup.maxMembers} members can join.
            </p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary p-1.5 text-white shadow-sm">
                <LinkIcon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Invite Members</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Generate a shareable link or invite colleagues directly by email right now.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="button"
              onClick={handleCompleteAndInvite}
              className="w-full"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Invite Members Now
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCompleteAndChat}
              className="w-full"
            >
              Go to Chat
            </Button>
          </div>
        </div>
      ) : (
        /* Creation Form */
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Group Avatar Preview */}
          <div className="flex items-center gap-4 rounded-xl border border-dark-card-border bg-dark-input/60 p-3.5">
            <Avatar name={name.trim() || "Group"} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Group Preview
              </p>
              <p className="truncate text-base font-semibold text-white">
                {name.trim() || "Untitled Group"}
              </p>
              <p className="text-xs text-slate-400">
                Max capacity: {maxMembers} {maxMembers === 1 ? "member" : "members"}
              </p>
            </div>
          </div>

          {/* Group Name Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="group-name" className="text-xs font-semibold text-slate-300">
                Group Name <span className="text-red-400">*</span>
              </label>
              <span className="text-xs text-slate-500">{name.length}/50</span>
            </div>
            <Input
              id="group-name"
              type="text"
              maxLength={50}
              required
              placeholder="e.g., Design Team, Weekend Trip, Family"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Member Limit Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Member Limit
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_LIMITS.map((limit) => {
                const isSelected = !customLimit && maxMembers === limit;
                return (
                  <button
                    key={limit}
                    type="button"
                    onClick={() => {
                      setCustomLimit(false);
                      setMaxMembers(limit);
                    }}
                    className={`rounded-xl border py-2 text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-dark-input-border bg-dark-input text-slate-300 hover:bg-dark-input-hover"
                    }`}
                  >
                    {limit}
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setCustomLimit(!customLimit)}
                className="font-medium text-primary hover:text-primary-400 hover:underline cursor-pointer"
              >
                {customLimit ? "Use preset limits" : "Custom limit..."}
              </button>
              <span>Min: 2 • Max: 100</span>
            </div>

            {customLimit && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Math.max(2, Math.min(100, Number(e.target.value) || 2)))}
                  className="w-28 rounded-xl border border-dark-input-border bg-dark-input px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <span className="text-xs text-slate-400">members allowed</span>
              </div>
            )}
          </div>

          {/* Role Info Box */}
          <div className="rounded-xl border border-dark-card-border bg-dark-input/60 p-3 text-xs text-slate-300">
            <span className="font-semibold text-white">🔒 Security:</span> You will be the group{" "}
            <span className="font-semibold text-primary">Owner</span>. You can invite or manage members at any time.
          </div>

          {/* Error banner */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-2.5 text-xs text-red-400">
              {error}
            </div>
          )}


          {/* Action Buttons */}
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
              disabled={loading || !name.trim()}
              loading={loading}
            >
              Create Group
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default CreateGroupModal;
