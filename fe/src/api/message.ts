import api from "../lib/axios";
import type { Message } from "../types/chat";

export interface GetMessagesResponse {
  success: boolean;
  messages: Message[];
}

export const getConversationMessagesApi = async (conversationOrGroupId: string): Promise<Message[]> => {
  try {
    const res = await api.get<GetMessagesResponse>(`/api/messages/${conversationOrGroupId}`);
    return res.data.messages || [];
  } catch {
    return [];
  }
};
