import { Request, Response } from "express";
import { getConversationMessages, saveMessage } from "./message.service";

export async function getMessagesController(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const rawId = String(req.params.conversationId || req.params.groupId || "");
        const limit = Number(req.query.limit) || 50;
        const before = typeof req.query.before === "string" ? req.query.before : undefined;

        const messages = await getConversationMessages(rawId, userId, limit, before);
        return res.json({ success: true, messages });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to fetch messages",
        });
    }
}

export async function sendMessageController(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const rawId = String(
            req.params.conversationId ||
            req.params.groupId ||
            req.body.groupId ||
            req.body.conversationId ||
            ""
        );
        const { content, clientMsgId } = req.body;

        const message = await saveMessage({
            content,
            conversationId: rawId,
            sentById: userId,
            clientMsgId,
        });

        return res.status(201).json({
            success: true,
            message: {
                id: message.id,
                clientMsgId: message.clientMsgId,
                content: message.content,
                sentBy: message.sentById,
                senderName: message.sentByUser.name,
                createdAt: message.createdAt.toISOString(),
                conversationId: message.conversationId,
            },
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to send message",
        });
    }
}
