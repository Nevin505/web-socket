import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { Conversation } from "../types/chat";
import { PlusIcon, LinkIcon, ChatBubbleIcon } from "./ui";
import { FaCog, FaSearch } from "react-icons/fa";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  userName: string;
  userEmail?: string;
  className?: string;
  onCreateGroup?: () => void;
  onJoinGroup?: () => void;
}

const getAvatarGradient = (name: string) => {
  const charCode = name.charCodeAt(0) || 0;
  const gradients = [
    "from-purple-600 to-indigo-600",
    "from-blue-600 to-cyan-600",
    "from-pink-600 to-rose-600",
    "from-violet-600 to-purple-600",
    "from-indigo-600 to-blue-600",
  ];
  return gradients[charCode % gradients.length];
};

const Sidebar = ({
  conversations,
  activeId,
  onSelect,
  userName,
  userEmail = "nevin@workspace.io",
  className = "",
  onCreateGroup,
  onJoinGroup,
}: SidebarProps) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "groups" | "direct">("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filtered = conversations
    .filter((c) => {
      if (filter === "groups") return c.isGroup;
      if (filter === "direct") return !c.isGroup;
      return true;
    })
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const groupCount = conversations.filter((c) => c.isGroup).length;
  const activeCount = conversations.length;

  const userInitials = (userName || "NZ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className={`w-full flex-col border-r border-slate-800/80 bg-[#0d121f] md:w-84 lg:w-96 flex h-full ${className}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3.5 bg-[#0d121f]">
        <div className="flex items-center gap-2.5">
          {/* Pulse Logo Badge */}
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary text-white shadow-sm shadow-primary/30">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6.83L6 14.83V4h12v10z" />
            </svg>
          </div>

          <h1 className="text-base font-bold tracking-tight text-white">Chats</h1>

          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            {activeCount} active
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Join Group Button */}
          {onJoinGroup && (
            <button
              type="button"
              onClick={onJoinGroup}
              title="Join Group with Code / Link"
              className="rounded-xl border border-dark-input-border bg-dark-input p-2 text-slate-400 transition-colors hover:bg-dark-input-hover hover:text-white cursor-pointer"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Quick Create Group Button */}
          {onCreateGroup && (
            <button
              type="button"
              onClick={onCreateGroup}
              title="Create New Group"
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-primary/25 transition-all hover:brightness-110 cursor-pointer"
            >
              <PlusIcon className="h-3 w-3" />
              <span>New Group</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar with ⌘K badge */}
      <div className="p-3 pb-2">
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 text-slate-500 text-xs">
            <FaSearch />
          </span>
          <input
            ref={searchInputRef}
            id="search"
            type="search"
            placeholder="Search chats or groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-dark-input-border bg-dark-input py-2 pl-8 pr-11 text-xs text-white placeholder:text-slate-500 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
          <kbd className="pointer-events-none absolute right-2.5 rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-medium text-slate-400">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 px-3 pb-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3 py-1 transition-colors cursor-pointer ${
            filter === "all"
              ? "bg-primary text-white font-semibold shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter("groups")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 transition-colors cursor-pointer ${
            filter === "groups"
              ? "bg-primary text-white font-semibold shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>Groups</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              filter === "groups" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
            }`}
          >
            {groupCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("direct")}
          className={`rounded-lg px-3 py-1 transition-colors cursor-pointer ${
            filter === "direct"
              ? "bg-primary text-white font-semibold shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Direct
        </button>
      </div>

      {/* Conversation List */}
      <ul className="flex-1 overflow-y-auto px-2 space-y-1">
        {filtered.length === 0 && (
          <li className="px-4 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-dark-input text-slate-500 mb-2 border border-dark-input-border">
              <ChatBubbleIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No chats found</p>
            {onCreateGroup && (
              <button
                type="button"
                onClick={onCreateGroup}
                className="mt-3 text-xs font-semibold text-primary hover:text-primary-400 hover:underline cursor-pointer"
              >
                + Create your first group
              </button>
            )}
          </li>
        )}

        {filtered.map((c) => {
          const initials = c.name.slice(0, 2).toUpperCase();
          const avatarGradient = getAvatarGradient(c.name);
          const isActive = activeId === c.id;

          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary/15 border-l-2 border-primary text-white"
                    : "border-l-2 border-transparent text-slate-300 hover:bg-white/5"
                }`}
              >
                {/* Circular Avatar with status dot */}
                <div className="relative shrink-0">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr ${avatarGradient} font-bold text-white shadow-sm text-xs`}
                  >
                    {initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0d121f]" />
                </div>

                {/* Text Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span className="truncate font-semibold text-sm text-white">
                        {c.name}
                      </span>
                      {c.isGroup && (
                        <span className="shrink-0 rounded bg-primary/20 px-1.5 py-0.2 text-[10px] font-medium text-primary-300">
                          Group
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-500">
                      {c.time}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="truncate text-xs text-slate-400">
                      {c.lastMessage}
                    </span>
                    {c.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.2 text-[10px] font-bold text-white shadow-sm">
                        {c.unread}
                      </span>
                    )}
                  </div>

                  {c.isGroup && c.memberCount && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold">
                      <span className="text-slate-400">{c.memberCount} members</span>
                      {c.currentUserRole && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-[#38bdf8] font-bold tracking-wider">{c.currentUserRole}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Bottom Profile Bar */}
      <div className="border-t border-slate-800/80 bg-[#0a0e17] p-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 font-bold text-white text-xs border border-white/10">
              {userInitials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#0a0e17]" />
          </div>

          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-white leading-tight">
              {userName || "Nevin Zach"}
            </div>
            <div className="truncate text-[11px] text-slate-400 leading-tight">
              {userEmail}
            </div>
          </div>
        </div>

        <Link
          to="/profile"
          title="Account Settings"
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
        >
          <FaCog className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;