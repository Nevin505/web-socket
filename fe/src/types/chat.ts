export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string; // ISO string
}