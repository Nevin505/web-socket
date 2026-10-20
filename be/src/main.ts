import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import profileRouter from "./modules/profile/profile.route";
import groupRouter from "./modules/group/group.route";
import inviteRouter from "./modules/invite/invite.route";
import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'
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
const broadcast = (groupId: string, payload: JSON) => {
  const ws = rooms.get(groupId);
  console.log("groupId", ws)
  if (ws) {
    for (const singleSocket of ws) {
      if (singleSocket.readyState === WebSocket.OPEN) {
        console.log("sending", payload)
        singleSocket.send(JSON.stringify({...payload}));
      }
    }

  }
}
webSocketServer.on("connection", (ws: WebSocket) => {
  console.log("User connected");
  ws.on("message", (message: { type: 'join' | 'broadcast' | 'leave', groupId: string, sentBy: string, message: string }) => {
    console.log("Received message:", message);
    const data = JSON.parse(message.toString());
    console.log("the messafge recived", data)
    const userId = data.userId;
    if (data.type === "broadcast") {
      broadcast(data.groupId, data);
    } else if (data.type === 'join') {
      joinRoom(ws, data.groupId);
    } else if (data.type === 'leave') {
      leaveRoom(data.groupId, ws);
    }
  });
  ws.on('close', () => {
    console.log("User disconnected");
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
// [1] the messafge recived {
// [1]   type: 'broadcast',
// [1]   content: 'sdafsdaf',
// [1]   groupId: 'cmvghqt1o000079btnrdkg0bt',
// [1]   sentBy: 'cmvg1rbqd0000ofbtnvis8qpq'
// [1] }