import { useState } from "react";
import { Link } from "react-router-dom";

import type { Conversation } from "../types/chat";
import { Avatar, Input, PlusIcon, LinkIcon, ChatBubbleIcon } from "./ui";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  userName: string;
  className?: string;
  onCreateGroup?: () => void;
  onJoinGroup?: () => void;
}

const Sidebar = ({
  conversations,
  activeId,
  onSelect,
  userName,
  className = "",
  onCreateGroup,
  onJoinGroup,
}: SidebarProps) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "groups" | "direct">("all");

  const filtered = conversations
    .filter((c) => {
      if (filter === "groups") return c.isGroup;
      if (filter === "direct") return !c.isGroup;
      return true;
    })
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const groupCount = conversations.filter((c) => c.isGroup).length;

  return (
    <aside
      className={`w-full flex-col border-r border-gray-200 bg-white md:w-84 lg:w-96 ${className}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 bg-white">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Chats</h1>
          <p className="text-xs text-gray-400">
            {groupCount} {groupCount === 1 ? "group" : "groups"} active
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Create Group Button */}
          {onCreateGroup && (
            <button
              type="button"
              onClick={onCreateGroup}
              title="Create New Group"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>New Group</span>
            </button>
          )}

          {/* Quick Join Group Button */}
          {onJoinGroup && (
            <button
              type="button"
              onClick={onJoinGroup}
              title="Join Group with Code / Link"
              className="rounded-xl border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
          )}

          <Link
            to="/profile"
            className="flex items-center rounded-xl p-1 transition-colors hover:bg-gray-100"
            title="My profile"
          >
            <Avatar name={userName} size="sm" />
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 pb-2">
        <Input
          id="search"
          type="search"
          variant="filled"
          placeholder="Search chats or groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 px-3 pb-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3 py-1 transition-colors ${
            filter === "all"
              ? "bg-gray-900 text-white font-semibold shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter("groups")}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 transition-colors ${
            filter === "groups"
              ? "bg-blue-600 text-white font-semibold shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>Groups</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              filter === "groups" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {groupCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("direct")}
          className={`rounded-lg px-3 py-1 transition-colors ${
            filter === "direct"
              ? "bg-gray-900 text-white font-semibold shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Direct
        </button>
      </div>

      {/* Conversation List */}
      <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {filtered.length === 0 && (
          <li className="px-4 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-2">
              <ChatBubbleIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No chats found</p>
            {filter === "groups" && onCreateGroup && (
              <button
                type="button"
                onClick={onCreateGroup}
                className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
              >
                + Create your first group
              </button>
            )}
          </li>
        )}

        {filtered.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:bg-gray-50/80 ${
                activeId === c.id
                  ? "bg-blue-50/80 border-l-4 border-blue-600 pl-3"
                  : "border-l-4 border-transparent"
              }`}
            >
              {/* Avatar with optional group badge */}
              <div className="relative shrink-0">
                {c.isGroup ? (
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 font-bold text-white shadow-sm text-sm">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                ) : (
                  <Avatar name={c.name} />
                )}
                {c.isGroup && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] text-white ring-2 ring-white">
                    👥
                  </span>
                )}
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className="truncate font-semibold text-gray-900 text-sm">
                      {c.name}
                    </span>
                    {c.isGroup && (
                      <span className="shrink-0 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                        Group
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-[11px] text-gray-400 font-medium">
                    {c.time}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="truncate text-xs text-gray-500">
                    {c.lastMessage}
                  </span>
                  {c.unread > 0 && (
                    <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      {c.unread}
                    </span>
                  )}
                </div>

                {c.isGroup && c.memberCount && (
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                    <span>{c.memberCount} members</span>
                    {c.currentUserRole && (
                      <span className="text-gray-300">• {c.currentUserRole}</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;