import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/SideBar";
import ChatWindow from "../components/ChatWindow";
import CreateGroupModal from "../components/CreateGroupModal";
import InviteModal from "../components/InviteModal";
import JoinGroupModal from "../components/JoinGroupModal";
import { getMyGroupsApi } from "../api/group";
import type { Conversation, Message } from "../types/chat";
import type { Group } from "../types/group";

// Initial mock direct conversations
const INITIAL_DIRECT_CONVERSATIONS: Conversation[] = [
  { id: "d1", name: "Aarav Sharma", lastMessage: "See you tomorrow!", time: "10:24", unread: 2 },
  { id: "d2", name: "Priya Nair", lastMessage: "Sent the files", time: "Yesterday", unread: 0 },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  d1: [
    { id: "m1", senderId: "other", text: "Hey! Are we still meeting?", createdAt: new Date().toISOString() },
    { id: "m2", senderId: "me", text: "Yes, 5 pm works for me.", createdAt: new Date().toISOString() },
    { id: "m3", senderId: "other", text: "See you tomorrow!", createdAt: new Date().toISOString() },
  ],
  d2: [],
};

const ChatPage = () => {
  const { user } = useAuth();
  const currentUserId = user?.id || "me";
  const currentUserName = user?.name || "Me";

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [groups, setGroups] = useState<Group[]>([]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<Group | null>(null);

  // Fetch groups from backend
  const fetchGroups = useCallback(async () => {
    try {
      const fetched = await getMyGroupsApi();
      setGroups(fetched);
    } catch {
      // If token not yet present or offline, keep groups empty
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Transform groups into conversations
  const groupConversations: Conversation[] = useMemo(() => {
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      lastMessage: "Group created. Start messaging!",
      time: new Date(g.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }),
      unread: 0,
      isGroup: true,
      memberCount: g.memberCount || g.members?.length || 1,
      maxMembers: g.maxMembers,
      currentUserRole: g.currentUserRole,
      createdById: g.createdById,
    }));
  }, [groups]);

  // Combine direct conversations and groups
  const allConversations = useMemo(() => {
    return [...groupConversations, ...INITIAL_DIRECT_CONVERSATIONS];
  }, [groupConversations]);

  const activeConversation = allConversations.find((c) => c.id === activeId) ?? null;

  const handleSend = (text: string) => {
    if (!activeId) return;
    const newMessage: Message = {
      id: crypto.randomUUID(),
      senderId: currentUserId,
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), newMessage] }));
  };

  const handleGroupCreated = (newGroup: Group, shouldOpenInvite?: boolean) => {
    setGroups((prev) => [newGroup, ...prev.filter((g) => g.id !== newGroup.id)]);
    setActiveId(newGroup.id);
    if (shouldOpenInvite) {
      setSelectedGroupForInvite(newGroup);
      setIsInviteOpen(true);
    }
  };

  const handleOpenInvite = () => {
    // If active conversation is a group, use it
    if (activeConversation?.isGroup) {
      const foundGroup = groups.find((g) => g.id === activeConversation.id) || {
        id: activeConversation.id,
        name: activeConversation.name,
        maxMembers: activeConversation.maxMembers || 4,
        createdById: activeConversation.createdById || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSelectedGroupForInvite(foundGroup);
    } else if (groups.length > 0) {
      setSelectedGroupForInvite(groups[0]);
    } else {
      setSelectedGroupForInvite(null);
    }
    setIsInviteOpen(true);
  };

  const handleGroupJoined = async (groupId: string) => {
    await fetchGroups();
    setActiveId(groupId);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar with Group Actions */}
      <Sidebar
        conversations={allConversations}
        activeId={activeId}
        onSelect={setActiveId}
        userName={currentUserName}
        onCreateGroup={() => setIsCreateOpen(true)}
        onJoinGroup={() => setIsJoinOpen(true)}
        className={activeId ? "hidden md:flex" : "flex"}
      />

      {/* Main Chat Area */}
      <ChatWindow
        conversation={activeConversation}
        messages={activeId ? messages[activeId] ?? [] : []}
        currentUserId={currentUserId}
        onSend={handleSend}
        onBack={() => setActiveId(null)}
        onInvite={handleOpenInvite}
        className={activeId ? "flex" : "hidden md:flex"}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        group={selectedGroupForInvite}
        availableGroups={groups}
        onSelectGroup={setSelectedGroupForInvite}
      />

      {/* Join Group Modal */}
      <JoinGroupModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoined={handleGroupJoined}
      />
    </div>
  );
};

export default ChatPage;