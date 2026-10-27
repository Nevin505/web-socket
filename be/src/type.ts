export type WsMessage = {
    type: 'join' | 'broadcast' | 'leave';
    groupId: string;
    sentBy: string;
    content: string;
    clientMsgId: string;
    createdAt: string;
    id: string;
    conversationId: string;
    senderName: string;
}