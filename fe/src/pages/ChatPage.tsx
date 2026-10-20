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

const ChatPage = () => {


  const { user } = useAuth();
  const currentUserId = user?.id || "me";
  const currentUserName = user?.name || "Me";

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [groups, setGroups] = useState<Group[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

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

  const allConversations = groupConversations;

  const activeConversation = allConversations.find((c) => c.id === activeId) ?? null;

  const handleSend = (text: string) => {
    if (!activeId) return;
    const messageId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const newMessage: Message = {
      id: messageId,
      sentBy: currentUserId,
      content: text,
      createdAt,
    };
    setMessages((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), newMessage] }));
    sendWebSocketEvents({
      type: 'broadcast',
      message: text,
      groupId: activeId,
      sentBy: currentUserId,
      id: messageId,
      createdAt,
    });
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

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    setWs(ws);
    ws.onopen = () => {
      console.log("Connected to server");
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'broadcast' && data.groupId && data.content) {
          const incomingMessage: Message = {
            id: data.id || crypto.randomUUID(),
            sentBy: data.sentBy,
            content: data.content,
            createdAt: data.createdAt || new Date().toISOString(),
          };
          setMessages((prev) => {
            const currentMsgs = prev[data.groupId] || [];
            if (incomingMessage.id && currentMsgs.some((m) => m.id === incomingMessage.id)) {
              return prev;
            }
            return {
              ...prev,
              [data.groupId]: [...currentMsgs, incomingMessage],
            };
          });
        }
      } catch (err) {
        console.error("Failed to parse incoming WS message", err);
      }
    };
    ws.onclose = () => {
      console.log("Disconnected from server");
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendWebSocketEvents = ({
    type,
    groupId,
    sentBy,
    message,
    id,
    createdAt,
  }: {
    type: 'join' | 'broadcast' | 'leave';
    message?: string;
    groupId: string;
    sentBy: string;
    id?: string;
    createdAt?: string;
  }) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    let data = {};
    if (type === 'join') {
      data = { type, groupId, sentBy };
    } else if (type === 'leave') {
      data = { type, groupId, sentBy };
    } else {
      data = {
        type: 'broadcast',
        id: id || crypto.randomUUID(),
        content: message,
        groupId,
        sentBy,
        createdAt: createdAt || new Date().toISOString(),
      };
    }
    ws.send(JSON.stringify(data));
  };

  const sendMessage = ({
    message,
    groupId,
    sentBy,
  }: {
    type?: string;
    message: string;
    groupId: string;
    sentBy: string;
  }) => {
    if (!groupId) return;
    const messageId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const newMessage: Message = {
      id: messageId,
      sentBy,
      content: message,
      createdAt,
    };
    setMessages((prev) => ({ ...prev, [groupId]: [...(prev[groupId] ?? []), newMessage] }));
    sendWebSocketEvents({
      type: 'broadcast',
      message,
      groupId,
      sentBy,
      id: messageId,
      createdAt,
    });
  };

  const joinGroup = (id: string) => {
    if (activeId && activeId !== id) {
      sendWebSocketEvents({ type: 'leave', groupId: activeId, sentBy: currentUserId });
    }
    setActiveId(id);
    sendWebSocketEvents({ type: 'join', groupId: id, sentBy: currentUserId });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar with Group Actions */}
      <Sidebar
        conversations={allConversations}
        activeId={activeId}
        onSelect={joinGroup}
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
        onSendMessage={sendMessage}
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