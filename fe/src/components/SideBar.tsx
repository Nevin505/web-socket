import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../components/input";
import Avatar from "./Avatar";
import type { Conversation } from "../types/chat";

interface SidebarProps {
    conversations: Conversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    userName: string;
    className?: string;
}

const Sidebar = ({ conversations, activeId, onSelect, userName, className = "" }: SidebarProps) => {
    const [search, setSearch] = useState("");

    const filtered = conversations.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <aside className={`w-full flex-col border-r border-gray-200 bg-white md:w-80 ${className}`}>
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h1 className="text-lg font-semibold text-gray-900">Chats</h1>
                <Link to="/profile" className="flex items-center gap-2" title="My profile">
                    <span className="hidden text-sm text-gray-600 sm:inline">{userName}</span>
                    <Avatar name={userName} size="sm" />
                </Link>
            </div>

            <div className="p-3">
                <Input
                    id="search"
                    type="search"
                    variant="filled"
                    placeholder="Search chats"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <ul className="flex-1 overflow-y-auto">
                {filtered.length === 0 && (
                    <li className="px-4 py-6 text-center text-sm text-gray-400">No chats found</li>
                )}
                {filtered.map((c) => (
                    <li key={c.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(c.id)}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${activeId === c.id ? "bg-blue-50" : ""
                                }`}
                        >
                            <Avatar name={c.name} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate font-medium text-gray-900">{c.name}</span>
                                    <span className="shrink-0 text-xs text-gray-400">{c.time}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-sm text-gray-500">{c.lastMessage}</span>
                                    {c.unread > 0 && (
                                        <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                                            {c.unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default Sidebar;