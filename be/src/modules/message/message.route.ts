import { Router } from "express";
import { auth } from "../../middleware/auth";
import { getMessagesController, sendMessageController } from "./message.controller";

const router = Router();

// Protect all message routes
router.use(auth);

// Get messages for a group or conversation
router.get("/:conversationId", getMessagesController);

// Post a message via REST
router.post("/:conversationId", sendMessageController);

export default router;
