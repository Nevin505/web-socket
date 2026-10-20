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
  senderId: string;
  text: string;
  createdAt: string; // ISO string
}