import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import profileRouter from "./modules/profile/profile.route";
import groupRouter from "./modules/group/group.route";
import inviteRouter from "./modules/invite/invite.route";
import messageRouter from "./modules/message/message.route";
import { saveMessage } from "./modules/message/message.service";
import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'
import jwt, { type JwtPayload } from "jsonwebtoken";
import { WsMessage } from "./type";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
}

const app = express();
const rooms = new Map<string, Set<WebSocket>>();   // groupId -> sockets
const userSockets = new Map<string, WebSocket>(); // socket -> user info
const httpServer = http.createServer(app);
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/profile", profileRouter);
app.use("/api/profile", profileRouter);
app.use("/api/groups", groupRouter);
app.use("/groups", groupRouter);
app.use("/api/invite", inviteRouter);
app.use("/invite", inviteRouter);
app.use("/api/messages", messageRouter);
app.use("/messages", messageRouter);


const webSocketServer = new WebSocketServer({ server: httpServer });
const joinRoom = (ws: WebSocket, groupId: string) => {
  let set = rooms.get(groupId);
  if (set) {
    set.add(ws)
  } else {
    const newWs = new Set<WebSocket>();
    newWs.add(ws);
    rooms.set(groupId, newWs);

  }
  console.log("the ws", rooms.get(groupId)?.size)
}
const leaveRoom = (groupId: string, ws: WebSocket) => {
  const webServers = rooms.get(groupId);
  if (!webServers) return;
  if (webServers) {
    webServers.delete(ws);
  }
  if (webServers.size === 0) rooms.delete(groupId);


}
const broadcast = (groupId: string, payload: any, excludeWs?: WebSocket) => {
  const ws = rooms.get(groupId);
  console.log("groupId", ws)
  if (ws) {
    for (const singleSocket of ws) {
      if (singleSocket !== excludeWs && singleSocket.readyState === WebSocket.OPEN) {
        console.log("sending", payload)
        singleSocket.send(JSON.stringify({ ...payload }));
      }
    }

  }
}
const authenticateWebSocket = (
  ws: AuthenticatedWebSocket,
  req: http.IncomingMessage
): boolean => {
  const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  const token = url.searchParams.get("token");

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET is not configured");
    ws.close(1011, "Internal server error");
    return false;
  }

  if (!token) {
    console.log("WebSocket rejected: No token provided in query params");
    ws.close(4001, "Authentication token required");
    return false;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload | string;
    if (!decoded || typeof decoded === "string") {
      ws.close(4001, "Invalid token");
      return false;
    }

    const userId = (decoded as JwtPayload).id || (decoded as JwtPayload).sub;
    if (!userId || typeof userId !== "string") {
      ws.close(4001, "Invalid token payload");
      return false;
    }

    ws.userId = userId;
    userSockets.set(userId, ws);
    console.log(`User connected via WebSocket: ${userId}`);
    return true;
  } catch (err) {
    console.log("WebSocket authentication failed:", err);
    ws.close(4001, "Authentication failed");
    return false;
  }
};
// {"type":"broadcast","id":"cmvpzlr4x0001iebtmig96cua","clientMsgId":"689f23e5-2e61-45f3-a321-55a74e315a50","content":"rteyhrtyrt","groupId":"cmvpfge5s0005djbtvmhgf5ml","conversationId":"cmvpfge5k0003djbtmlit0ir2","sentBy":"cmvpffuna0002djbtd1dol0gh","senderName":"Mevin Zach","createdAt":"2026-10-27T01:08:38.433Z"}
webSocketServer.on("connection", (ws: AuthenticatedWebSocket, req: http.IncomingMessage) => {
  if (!authenticateWebSocket(ws, req)) {
    return;
  }

  ws.on("message", async (message) => {
    console.log("Received message:", message);
    try {
      const data: WsMessage = JSON.parse(message.toString());
      console.log("the messafge recived", data);
      const senderId = ws.userId || data.sentBy;

      if (data.type === "broadcast") {
        try {
          const savedMessage = await saveMessage({
            content: data.content,
            conversationId: data.groupId,
            sentById: senderId,
            clientMsgId: data.id || data.clientMsgId,
          });

          // Broadcast to everyone in group EXCEPT the sender
          broadcast(data.groupId, {
            type: "broadcast",
            id: savedMessage.id,
            clientMsgId: savedMessage.clientMsgId,
            content: savedMessage.content,
            groupId: data.groupId,
            conversationId: savedMessage.conversationId,
            sentBy: savedMessage.sentById,
            senderName: savedMessage.sentByUser?.name,
            createdAt: savedMessage.createdAt.toISOString(),
          }, ws);

          // Send confirmation directly to the sender
          ws.send(JSON.stringify({
            type: "confirmation",
            status: "delivered",
            id: savedMessage.id,
            clientMsgId: savedMessage.clientMsgId || data.id,
            groupId: data.groupId,
            createdAt: savedMessage.createdAt.toISOString(),
          }));
        } catch (dbErr: any) {
          console.error("Database saveMessage error:", dbErr.message);
          // Fallback to broadcasting in-memory message to others, and confirm to sender
          broadcast(data.groupId, { ...data, sentBy: senderId }, ws);
          ws.send(JSON.stringify({
            type: "confirmation",
            status: "delivered",
            id: data.id || crypto.randomUUID(),
            clientMsgId: data.id || data.clientMsgId,
            groupId: data.groupId,
            createdAt: new Date().toISOString(),
          }));
        }
      } else if (data.type === 'join') {
        joinRoom(ws, data.groupId);
      } else if (data.type === 'leave') {
        leaveRoom(data.groupId, ws);
      }
    } catch (parseErr) {
      console.error("Failed to parse websocket message:", parseErr);
    }
  });

  ws.on('close', () => {
    console.log(`User disconnected: ${ws.userId || "unknown"}`);
    if (ws.userId && userSockets.get(ws.userId) === ws) {
      userSockets.delete(ws.userId);
    }
    for (const [groupId, socketSet] of rooms.entries()) {
      socketSet.delete(ws);
      if (socketSet.size === 0) rooms.delete(groupId);
    }
  });
});
httpServer.listen(process.env.PORT, () => {
  console.log(`Server running on portas ${process.env.PORT}`);
});

export default app;

