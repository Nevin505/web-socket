import { useState, useEffect, type FormEvent } from "react";
import axios from "axios";
import {
  Modal,
  Button,
  Input,
  UserPlusIcon,
  CloseIcon,
  LinkIcon,
  MailIcon,
  CheckIcon,
  CopyIcon,
} from "./ui";
import { generateInviteApi, type GeneratedInviteResponse } from "../api/invite";
import type { Group } from "../types/group";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
  availableGroups?: Group[];
  onSelectGroup?: (group: Group) => void;
}

export const InviteModal = ({
  isOpen,
  onClose,
  group,
  availableGroups = [],
  onSelectGroup,
}: InviteModalProps) => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(group);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [invitation, setInvitation] = useState<GeneratedInviteResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"link" | "email">("link");

  useEffect(() => {
    setSelectedGroup(group);
    setInvitation(null);
    setError("");
    setEmail("");
    setCopiedLink(false);
    setCopiedToken(false);
  }, [group, isOpen]);

  const currentGroup = selectedGroup || (availableGroups.length > 0 ? availableGroups[0] : null);

  const handleGenerateLink = async (targetEmail = "guest@invite.link", sendEmail = false) => {
    if (!currentGroup) {
      setError("Please select a group first");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const invite = await generateInviteApi({
        groupId: currentGroup.id,
        email: targetEmail,
        sendEmail,
      });
      setInvitation(invite);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Failed to create invitation");
      } else {
        setError(err.message || "Failed to create invitation");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter a valid email address");
      return;
    }
    await handleGenerateLink(trimmed, true);
  };

  const copyToClipboard = async (text: string, type: "link" | "token") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } else {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2500);
      }
    } catch {
      setError("Failed to copy automatically. Please select and copy manually.");
    }
  };

  const shareText = invitation
    ? `Hey! Join our group "${currentGroup?.name || "chat"}" using this invite link: ${invitation.link}`
    : "";

  const customHeader = (
    <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-inner">
            <UserPlusIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Invite to Group</h2>
            <p className="text-xs text-primary-100">
              {currentGroup ? currentGroup.name : "Select a group to create an invite"}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus:outline-none cursor-pointer"
          aria-label="Close dialog"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      {availableGroups.length > 1 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-black/25 p-2 text-xs border border-white/10">
          <span className="font-medium text-white/80">Target Group:</span>
          <select
            value={currentGroup?.id ?? ""}
            onChange={(e) => {
              const grp = availableGroups.find((g) => g.id === e.target.value) || null;
              setSelectedGroup(grp);
              if (onSelectGroup && grp) onSelectGroup(grp);
              setInvitation(null);
            }}
            className="rounded-lg bg-black/40 px-2 py-1 text-xs font-semibold text-white outline-none focus:ring-1 focus:ring-primary-400 border border-white/10"
          >
            {availableGroups.map((g) => (
              <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      headerCustom={customHeader}
    >
      {/* Tab Switcher */}
      <div className="-mx-6 -mt-6 flex border-b border-dark-card-border bg-[#0f1524] px-6 pt-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("link")}
          className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "link"
              ? "border-primary text-primary-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <LinkIcon className="h-4 w-4" />
          Shareable Link
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("email")}
          className={`ml-6 flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "email"
              ? "border-primary text-primary-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <MailIcon className="h-4 w-4" />
          Invite via Email
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {activeTab === "link" ? (
        /* Share Link View */
        <div className="space-y-5">
          {!invitation ? (
            <div className="rounded-2xl border border-dashed border-dark-card-border bg-dark-input/40 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary mb-3">
                <LinkIcon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Generate an Instant Invite Link
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                Anyone with this link can accept the invitation and instantly join{" "}
                <span className="font-medium text-slate-200">
                  {currentGroup?.name || "your group"}
                </span>
                .
              </p>
              <button
                type="button"
                disabled={loading || !currentGroup}
                onClick={() => handleGenerateLink()}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-primary/25 transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Generating Link..." : "Generate Invite Link"}
              </button>
            </div>
          ) : (
            /* Generated Link Card */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Shareable URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={invitation.link}
                    className="w-full truncate rounded-xl border border-dark-input-border bg-dark-input px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(invitation.link, "link")}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer ${
                      copiedLink
                        ? "bg-emerald-600 shadow-emerald-900/40"
                        : "bg-primary hover:brightness-110"
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Raw Invite Code box */}
              <div className="rounded-xl border border-dark-card-border bg-dark-input/60 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-300">Invite Code</p>
                  <p className="font-mono text-xs text-slate-400 truncate max-w-[220px]">
                    {invitation.token}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(invitation.token, "token")}
                  className="text-xs font-medium text-primary-400 hover:text-primary-300 cursor-pointer"
                >
                  {copiedToken ? "✓ Copied" : "Copy Code"}
                </button>
              </div>

              {/* Expiry badge */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Valid for 7 days
                </span>
                <button
                  type="button"
                  onClick={() => handleGenerateLink()}
                  className="font-medium text-primary-400 hover:underline cursor-pointer"
                >
                  Regenerate
                </button>
              </div>

              {/* Quick Share Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-dark-input-border bg-dark-input py-2 text-xs font-semibold text-slate-200 hover:bg-dark-input-hover hover:text-white shadow-sm"
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    `Invite to join ${currentGroup?.name || "group"}`
                  )}&body=${encodeURIComponent(shareText)}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-dark-input-border bg-dark-input py-2 text-xs font-semibold text-slate-200 hover:bg-dark-input-hover hover:text-white shadow-sm"
                >
                  ✉️ Email
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Email Invite View */
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="invite-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Invitee Email Address
            </label>
            <Input
              id="invite-email"
              type="email"
              required
              placeholder="collaborator@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400">
              An invitation token will be generated specifically for this email.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || !email.trim() || !currentGroup}
            loading={loading}
            className="w-full py-3"
          >
            Create & Send Invitation
          </Button>

          {invitation && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4 text-emerald-400" />
                  {invitation.emailSent
                    ? `Invitation email sent to ${invitation.email}!`
                    : `Invite created for ${invitation.email}`}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(invitation.link, "link")}
                  className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
                >
                  {copiedLink ? "✓ Copied!" : "Copy Link"}
                </button>
              </div>

              {invitation.emailPreviewUrl && (
                <div className="rounded-lg border border-blue-500/30 bg-blue-950/30 p-2.5 text-xs text-blue-300 flex items-center justify-between">
                  <span>✉️ Dev Preview:</span>
                  <a
                    href={invitation.emailPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-400 underline hover:text-blue-300"
                  >
                    Open Sent Email ↗
                  </a>
                </div>
              )}

              <input
                type="text"
                readOnly
                value={invitation.link}
                className="w-full rounded-lg border border-dark-input-border bg-dark-input px-3 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>
          )}
        </form>
      )}

      {/* Footer action */}
      <div className="mt-6 flex justify-end border-t border-dark-card-border pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
        >
          Done
        </Button>
      </div>
    </Modal>
  );
};

export default InviteModal;
