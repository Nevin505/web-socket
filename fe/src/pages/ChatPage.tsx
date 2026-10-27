import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/SideBar";
import ChatWindow from "../components/ChatWindow";
import CreateGroupModal from "../components/CreateGroupModal";
import InviteModal from "../components/InviteModal";
import JoinGroupModal from "../components/JoinGroupModal";
import { getMyGroupsApi } from "../api/group";
import { getConversationMessagesApi } from "../api/message";
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

  // Load message history from DB when active conversation changes
  useEffect(() => {
    if (!activeId) return;
    let isMounted = true;
    getConversationMessagesApi(activeId).then((fetchedMessages) => {
      if (!isMounted || !fetchedMessages.length) return;
      setMessages((prev) => {
        const existing = prev[activeId] || [];
        const existingIds = new Set(existing.map((m) => m.id));
        existing.forEach((m) => {
          if (m.clientMsgId) existingIds.add(m.clientMsgId);
        });

        const newFetched = fetchedMessages.filter(
          (m) => !existingIds.has(m.id) && (!m.clientMsgId || !existingIds.has(m.clientMsgId))
        );

        return {
          ...prev,
          [activeId]: [...newFetched, ...existing],
        };
      });
    });
    return () => {
      isMounted = false;
    };
  }, [activeId]);

  // Transform groups into conversations
  const groupConversations: Conversation[] = useMemo(() => {
    return groups.map((g) => {
      const d = new Date(g.createdAt);
      const timeStr = !isNaN(d.getTime())
        ? `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`
        : "26 Oct";

      return {
        id: g.id,
        name: g.name,
        lastMessage: "Group created. Start messaging!",
        time: timeStr,
        unread: 0,
        isGroup: true,
        memberCount: g.memberCount || g.members?.length || 1,
        maxMembers: g.maxMembers,
        currentUserRole: g.currentUserRole || "MEMBER",
        createdById: g.createdById,
      };
    });
  }, [groups]);

  const allConversations = groupConversations;

  const activeConversation = allConversations.find((c) => c.id === activeId) ?? null;

  const handleSend = (text: string) => {
    if (!activeId) return;
    const messageId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const newMessage: Message = {
      id: messageId,
      clientMsgId: messageId,
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
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No auth token found; skipping WebSocket connection");
      return;
    }

    const ws = new WebSocket(`ws://localhost:8080?token=${encodeURIComponent(token)}`);
    setWs(ws);
    ws.onopen = () => {
      console.log("Connected to server");
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'broadcast' && data.groupId && data.content) {
          const clientMsgId = data.clientMsgId;
          const incomingMessage: Message = {
            id: data.id || crypto.randomUUID(),
            clientMsgId: clientMsgId,
            sentBy: data.sentBy,
            content: data.content,
            createdAt: data.createdAt || new Date().toISOString(),
          };
          setMessages((prev) => {
            const currentMsgs = prev[data.groupId] || [];

            // Check if this message was already added (optimistically or previously)
            const existingIndex = currentMsgs.findIndex(
              (m) =>
                (incomingMessage.id && m.id === incomingMessage.id) ||
                (clientMsgId && (m.id === clientMsgId || m.clientMsgId === clientMsgId))
            );

            if (existingIndex !== -1) {
              // Replace optimistic message with the confirmed server message
              const updated = [...currentMsgs];
              updated[existingIndex] = incomingMessage;
              return {
                ...prev,
                [data.groupId]: updated,
              };
            }

            return {
              ...prev,
              [data.groupId]: [...currentMsgs, incomingMessage],
            };
          });
        } else if (data.type === 'confirmation' && data.groupId) {
          // Sender confirmation: reconcile optimistic message with database ID & timestamp
          setMessages((prev) => {
            const currentMsgs = prev[data.groupId] || [];
            const targetId = data.clientMsgId || data.id;
            const updated = currentMsgs.map((m) => {
              if (m.clientMsgId === targetId || m.id === targetId) {
                return {
                  ...m,
                  id: data.id,
                  createdAt: data.createdAt || m.createdAt,
                };
              }
              return m;
            });
            return {
              ...prev,
              [data.groupId]: updated,
            };
          });
        }
      } catch (err) {
        console.error("Failed to parse incoming WS message", err);
      }
    };
    ws.onclose = (event) => {
      console.log("Disconnected from server", event.code, event.reason);
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
      clientMsgId: messageId,
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
    <div className="flex h-screen w-full items-center justify-center bg-[#070b13] p-0 md:p-3 lg:p-4 text-slate-100">
      <div className="flex h-full w-full overflow-hidden rounded-none md:rounded-2xl border-0 md:border md:border-indigo-500/40 shadow-[0_0_50px_rgba(124,58,237,0.18)] bg-[#090d16]">
        {/* Sidebar with Group Actions */}
        <Sidebar
          conversations={allConversations}
          activeId={activeId}
          onSelect={joinGroup}
          userName={currentUserName}
          userEmail={user?.email}
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
          onCreateGroup={() => setIsCreateOpen(true)}
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
    </div>
  );
};

export default ChatPage;