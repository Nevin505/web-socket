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
import { createClient } from "redis";
import { randomUUID } from "crypto";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  socketId?: string;   // add this
}

const pub = createClient({
  url: process.env.REDIS_URL
})
const sub = pub.duplicate()

pub.on("error", (err) => console.error("Redis pub error:", err));
sub.on("error", (err) => console.error("Redis sub error:", err));
const app = express();

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

const rooms = new Map<string, Set<AuthenticatedWebSocket>>();   // groupId -> sockets
const userSockets = new Map<string, AuthenticatedWebSocket>(); // socket -> user info


const webSocketServer = new WebSocketServer({ server: httpServer });

const channelFor = (groupId: string) => `group:${groupId}`;

const joinRoom = async (ws: AuthenticatedWebSocket, groupId: string) => {
  let set = rooms.get(groupId);
  if (set) {
    set.add(ws)
  } else {
    const newWs = new Set<AuthenticatedWebSocket>();
    newWs.add(ws);
    rooms.set(groupId, newWs);
    await sub.subscribe(channelFor(groupId), (message: string) => {
      const { excludeSocketId, ...payload } = JSON.parse(message) as {
        excludeSocketId?: string;
        [key: string]: any;
      };
      const webServers = rooms.get(groupId);
      if (webServers) {
        for (const singleSocket of webServers) {
          if (singleSocket.socketId !== excludeSocketId && singleSocket.readyState === WebSocket.OPEN) {
            singleSocket.send(JSON.stringify({ ...payload }));
          }
        }
      }
    });
  }
  console.log("the ws", rooms.get(groupId)?.size)
}
const leaveRoom = async (groupId: string, ws: AuthenticatedWebSocket) => {
  const webServers = rooms.get(groupId);
  if (!webServers) return;
  webServers.delete(ws);
  if (webServers.size === 0) {
    rooms.delete(groupId);
    await sub.unsubscribe(channelFor(groupId));
  }
}
const broadcast = async (groupId: string, payload: any, excludeWs?: AuthenticatedWebSocket) => {
  // const ws = rooms.get(groupId);
  // console.log("groupId", ws)
  // if (ws) {
  //   for (const singleSocket of ws) {
  //     if (singleSocket !== excludeWs && singleSocket.readyState === WebSocket.OPEN) {
  //       console.log("sending", payload)
  //       singleSocket.send(JSON.stringify({ ...payload }));
  //     }
  //   }

  // }
  await pub.publish(channelFor(groupId), JSON.stringify({ ...payload, excludeSocketId: excludeWs?.socketId }))
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
  console.log("calledd")
  ws.socketId = randomUUID();
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
        if (!data.content || !senderId) {
          return;
        }
        try {
          const savedMessage = await saveMessage({
            content: data.content,
            conversationId: data.groupId,
            sentById: senderId,
            clientMsgId: data.id || data.clientMsgId,
          });

          // Broadcast to everyone in group EXCEPT the sender
          await broadcast(data.groupId, {
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
          await broadcast(data.groupId, { ...data, sentBy: senderId }, ws);
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
        await joinRoom(ws, data.groupId);
      } else if (data.type === 'leave') {
        await leaveRoom(data.groupId, ws);
      }
    } catch (parseErr) {
      console.error("Failed to parse websocket message:", parseErr);
    }
  });

  ws.on('close', async() => {
    console.log(`User disconnected: ${ws.userId || "unknown"}`);
    if (ws.userId && userSockets.get(ws.userId) === ws) {
      userSockets.delete(ws.userId);
    }
    for (const groupId of [...rooms.keys()]) {
      await leaveRoom(groupId, ws);
    }
  });
});


async function start() {
  await Promise.all([pub.connect(), sub.connect()]);
  console.log("Redis connected");

  httpServer.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});


export default app;

