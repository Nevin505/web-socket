import type { GroupRole } from "./group";

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  isGroup?: boolean;
  memberCount?: number;
  maxMembers?: number;
  currentUserRole?: GroupRole;
  createdById?: string;
}

export interface Message {
  id: string;
  clientMsgId?: string;
  sentBy: string;
  content: string;
  createdAt: string; // ISO string
}