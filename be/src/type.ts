export type WsMessage = {
    type: 'join' | 'broadcast' | 'leave' | 'confirmation';
    groupId: string;
    sentBy?: string;
    content?: string;
    clientMsgId?: string;
    createdAt?: string;
    id?: string;
    conversationId?: string;
    senderName?: string;
    status?: 'sent' | 'delivered';
};