import prisma from "../../config/prisma";

export interface SaveMessageInput {
    content: string;
    conversationId: string; // can be conversation.id or group.id
    sentById: string;
    clientMsgId?: string;
}

/**
 * Resolves a given ID to its underlying conversationId.
 * Accepts either a conversationId or a groupId.
 */
export async function resolveConversationId(idOrGroupId: string): Promise<string> {
    if (!idOrGroupId) {
        throw new Error("Conversation ID or Group ID is required");
    }

    // 1. Direct check: Is this already a conversation ID?
    const conv = await prisma.conversation.findUnique({
        where: { id: idOrGroupId },
        select: { id: true },
    });
    if (conv) return conv.id;

    // 2. Check: Is this a group ID?
    const group = await prisma.group.findUnique({
        where: { id: idOrGroupId },
        select: { conversationId: true },
    });
    if (group?.conversationId) return group.conversationId;

    // Fallback: If not found, throw descriptive error
    throw new Error(`Conversation not found for ID: ${idOrGroupId}`);
}

/**
 * Saves a message to the database.
 * Handles clientMsgId deduplication and membership verification.
 */
export async function saveMessage(input: SaveMessageInput) {
    const { content, conversationId: rawId, sentById, clientMsgId } = input;

    if (!content || !content.trim()) {
        throw new Error("Message content cannot be empty");
    }

    const trimmedContent = content.trim();
    const conversationId = await resolveConversationId(rawId);

    // Verify sender exists and is a member of the conversation
    const membership = await prisma.conversationMember.findUnique({
        where: {
            conversationId_userId: {
                conversationId,
                userId: sentById,
            },
        },
    });

    if (!membership) {
        // If they are not yet a conversation member, check if user exists before writing
        const userExists = await prisma.user.findUnique({
            where: { id: sentById },
            select: { id: true },
        });
        if (!userExists) {
            throw new Error(`User ${sentById} does not exist`);
        }
    }

    // Deduplication check: if clientMsgId is provided and already exists for this sender
    if (clientMsgId) {
        const existing = await prisma.message.findUnique({
            where: {
                sentById_clientMsgId: {
                    sentById,
                    clientMsgId,
                },
            },
            include: {
                sentByUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (existing) {
            return existing;
        }
    }

    // Create the message in database
    const message = await prisma.message.create({
        data: {
            content: trimmedContent,
            clientMsgId: clientMsgId || null,
            conversationId,
            sentById,
        },
        include: {
            sentByUser: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    // Touch conversation updatedAt timestamp
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
    }).catch(() => {
        // non-blocking
    });

    return message;
}

/**
 * Fetches message history for a conversation.
 */
export async function getConversationMessages(
    rawId: string,
    userId: string,
    limit = 50,
    before?: string
) {
    const conversationId = await resolveConversationId(rawId);

    // Verify requesting user is a member of the conversation
    const isMember = await prisma.conversationMember.findUnique({
        where: {
            conversationId_userId: {
                conversationId,
                userId,
            },
        },
    });

    if (!isMember) {
        throw new Error("You are not a member of this conversation");
    }

    const messages = await prisma.message.findMany({
        where: {
            conversationId,
            ...(before ? { createdAt: { lt: new Date(before) } } : {}),
        },
        orderBy: {
            createdAt: "asc",
        },
        take: Math.min(Math.max(limit, 1), 100),
        include: {
            sentByUser: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return messages.map((m) => ({
        id: m.id,
        clientMsgId: m.clientMsgId,
        content: m.content,
        sentBy: m.sentById,
        senderName: m.sentByUser.name,
        senderEmail: m.sentByUser.email,
        createdAt: m.createdAt.toISOString(),
        conversationId: m.conversationId,
    }));
}
