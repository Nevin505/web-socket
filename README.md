# Real-Time Chat & Group Collaboration Platform

A full-stack, real-time group chat and collaboration web application built with **React 19**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express 5**, **Prisma ORM**, **PostgreSQL**, **WebSockets** and **Redis Pub/Sub** for horizontal scaling.

---

## 🌟 Key Features

- **Real-Time Messaging**: Instant message broadcast across group members using WebSockets, with automatic room management and disconnection cleanup.
- **Horizontally Scalable**: Redis Pub/Sub connects multiple backend instances, so a message sent on one server reaches users connected to any other server.
- **Efficient Subscriptions**: Each server subscribes to one Redis channel per group (not per user), keeping Redis load low as users grow.
- **Message Persistence & History**: Messages are saved to PostgreSQL *before* being broadcast, and retrieved via REST API when switching conversations.
- **Delivery Confirmation**: The sender receives a `confirmation` event once the message is saved and published, and does not receive an echo of their own message.
- **Deduplication & Idempotency**: Client-generated message IDs (`clientMsgId`) prevent duplicate message rendering and storage.
- **Group Management**:
  - Create and customize groups with member capacity limits.
  - Role-based membership system (`OWNER`, `ADMIN`, `MEMBER`).
- **Secure Group Invitations**:
  - Invite users via shareable links or automated email notifications (via Nodemailer / SMTP).
  - Cryptographically hashed invitation tokens with expiration and status tracking (`PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`).
- **User Authentication**: JWT-based authentication for both REST APIs and WebSocket connections, with bcrypt-hashed passwords.
- **Unified Port Architecture**: Express HTTP REST API and WebSocket server run on the same shared port via Node's `http.createServer`.

---

## 🏗️ Architecture

Each backend instance keeps its own in-memory map of `groupId -> connected WebSocket clients`. Redis Pub/Sub is the bridge between instances.

```mermaid
flowchart LR
    A[Alice] <-- WebSocket --> S1[Server 1<br/>rooms: group abc -> Alice]
    B[Bob] <-- WebSocket --> S2[Server 2<br/>rooms: group abc -> Bob]
    S1 -- "PUBLISH group:abc" --> R[(Redis)]
    R -- "message" --> S1
    R -- "message" --> S2
    S1 --> DB[(PostgreSQL)]
```

**Message flow**

1. A client connects with `ws://host:port?token=<JWT>`. The token is verified on connection.
2. The client sends `join` for a group. If this is the first local user in that group, the server runs `SUBSCRIBE group:<groupId>` on Redis. Later users on the same server are only added to the local in-memory room.
3. A client sends `broadcast`. The server saves the message to PostgreSQL, then runs `PUBLISH group:<groupId>` with the saved message.
4. Redis delivers the message to every server subscribed to that channel.
5. Each server forwards it to its own local sockets in that room, skipping the sender (using a per-connection `socketId`).
6. The sender gets a `confirmation` event directly.
7. When the last local user leaves a group, the server unsubscribes from that channel.

**Design notes**

- Redis Pub/Sub is fire-and-forget (no storage, no replay). **PostgreSQL is the source of truth**; clients load missed messages from `GET /api/messages/:id`.
- Two Redis connections per server are required: `pub` for publishing and `sub` for subscribing (a subscribed connection can only listen).
- Redis only tracks which *servers* are interested in a channel, not individual users. Per-user routing is handled by each server's local room map.

---

## 🛠️ Tech Stack

### Frontend (`fe/`)
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios (with automatic JWT Authorization interceptor)
- **Real-Time**: Native Browser WebSocket API

### Backend (`be/`)
- **Runtime**: Node.js
- **Server Framework**: Express 5
- **Language**: TypeScript (compiled with `tsc`)
- **Database & ORM**: PostgreSQL with Prisma ORM 7 (`@prisma/client` + `@prisma/adapter-pg`)
- **Real-Time Engine**: `ws` (WebSocket)
- **Message Broker**: Redis Pub/Sub (`redis` / node-redis)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Email Service**: Nodemailer (supporting SMTP & Ethereal email fallback)

---

## 📂 Project Structure

```text
ws/
├── be/                       # Backend service
│   ├── prisma/
│   │   └── schema.prisma     # Prisma data models & migrations
│   ├── src/
│   │   ├── config/           # Database & Prisma client setup
│   │   ├── middleware/       # JWT auth & route protection
│   │   ├── modules/
│   │   │   ├── auth/         # Login, Register, Token generation
│   │   │   ├── email/        # Nodemailer email sender service
│   │   │   ├── group/        # Group creation, retrieval & listing
│   │   │   ├── invite/       # Group invitation creation & acceptance
│   │   │   ├── message/      # Message persistence & chat history API
│   │   │   └── profile/      # User profile viewing and updates
│   │   ├── utils/            # Token generation and hashing utilities
│   │   └── main.ts           # Express app, WebSocket server & Redis Pub/Sub
│   └── package.json
│
├── fe/                       # Frontend application
│   ├── src/
│   │   ├── api/              # Axios API functions (auth, group, invite, message, profile)
│   │   ├── components/       # UI components (ChatWindow, SideBar, Modals, Buttons)
│   │   ├── context/          # AuthContext for user state
│   │   ├── lib/              # Axios instance configuration
│   │   ├── pages/            # Page components (ChatPage, Home, AcceptInvite, Profile)
│   │   └── types/            # TypeScript interfaces (chat, group, user)
│   └── package.json
│
└── README.md
```

---

## 🗄️ Database Schema Overview

```mermaid
erDiagram
    User ||--o{ ConversationMember : "conversationMembers"
    User ||--o{ Group : "groupsCreated"
    User ||--o{ Message : "userMessages"
    User ||--o{ GroupInvitation : "userInvitations"

    Conversation ||--o{ ConversationMember : "members"
    Conversation ||--o{ Message : "messages"
    Conversation ||--o| Group : "group"

    Group ||--o{ GroupInvitation : "invitations"

    User {
        String id PK
        String email UK
        String passwordHash
        String name
        String username UK
        String bio
        String phone
        DateTime createdAt
    }

    Conversation {
        String id PK
        Enum type "GROUP | DIRECT"
        String name
        String dmKey UK
        DateTime createdAt
        DateTime updatedAt
    }

    ConversationMember {
        String id PK
        String conversationId FK
        String userId FK
        Enum role "OWNER | ADMIN | MEMBER"
        DateTime joinedAt
    }

    Group {
        String id PK
        String conversationId FK, UK
        String name
        Int maxMembers
        String createdById FK
        DateTime createdAt
    }

    Message {
        String id PK
        String content
        String clientMsgId
        String conversationId FK
        String sentById FK
        DateTime createdAt
    }

    GroupInvitation {
        String id PK
        String token UK
        String groupId FK
        String email
        String invitedById FK
        DateTime expiresAt
        Enum status "PENDING | ACCEPTED | EXPIRED | REVOKED"
    }
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) database running locally or hosted
- [Docker](https://www.docker.com/) (to run Redis) or a Redis server (v6+)

---

### 1. Start Redis

```bash
docker run --name some-redis -p 6379:6379 -d redis redis-server --save 60 1 --loglevel warning
```

Check it is running:
```bash
docker exec -it some-redis redis-cli ping    # should reply PONG
```

---

### 2. Backend Configuration (`be/`)

1. Navigate to the backend directory:
   ```bash
   cd be
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in `be/`:
   ```env
   PORT=8080
   CLIENT_URL=http://localhost:5173
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chatApp"
   JWT_SECRET="your-super-secret-jwt-key"
   REDIS_URL="redis://localhost:6379"

   # SMTP Email Settings (Optional: falls back to test logger in dev)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   SMTP_SECURE=false
   EMAIL_FROM="Chat App <no-reply@chatapp.com>"
   ```

4. Push the Prisma schema to PostgreSQL and generate the client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server connects to Redis, then runs Express REST APIs and the WebSocket server on `http://localhost:8080` and `ws://localhost:8080`.*

---

### 3. Run Multiple Backend Instances (to test scaling)

Every instance uses the same Redis and the same PostgreSQL, but a different port. Open a second terminal:

```bash
# Linux / macOS
PORT=8081 npm run dev

# Windows PowerShell
$env:PORT=8081; npm run dev
```

Connect one user to `ws://localhost:8080` and another to `ws://localhost:8081`, join the same group, and send a message. Both receive it.

---

### 4. Frontend Configuration (`fe/`)

1. Navigate to the frontend directory:
   ```bash
   cd ../fe
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Vite development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📡 API & WebSocket Protocols

### REST Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `GET` | `/api/profile/me` | Fetch currently logged-in user profile | Yes |
| `GET` | `/api/groups` | Fetch all groups joined by the user | Yes |
| `POST` | `/api/groups` | Create a new group & conversation | Yes |
| `GET` | `/api/groups/:id` | Fetch specific group details | Yes |
| `POST` | `/api/invite` | Send an invitation to a group | Yes |
| `POST` | `/api/invite/accept` | Accept a group invitation token | Yes |
| `GET` | `/api/messages/:id` | Fetch chat message history for group/conversation | Yes |
| `POST` | `/api/messages/:id` | Post a message via REST | Yes |
| `GET` | `/health` | Health check | No |

---

### WebSocket Protocol

#### 0. Connect (authentication)

The JWT is passed as a query parameter. The connection is closed with code `4001` if the token is missing or invalid.

```
ws://localhost:8080?token=<JWT>
```

The sender's identity is taken from the verified token, not from the message body.

#### 1. Join a Room
Client sends:
```json
{
  "type": "join",
  "groupId": "group-or-conversation-id"
}
```

#### 2. Send / Broadcast a Message
Client sends:
```json
{
  "type": "broadcast",
  "content": "Hello team!",
  "groupId": "group-or-conversation-id",
  "id": "uuid-v4-client-msg-id"
}
```

The server persists the message to PostgreSQL, publishes it to Redis, and every other member in the room (on any server instance) receives:
```json
{
  "type": "broadcast",
  "id": "clx...",
  "clientMsgId": "uuid-v4-client-msg-id",
  "content": "Hello team!",
  "groupId": "group-or-conversation-id",
  "conversationId": "conversation-id",
  "sentBy": "user-id",
  "senderName": "Jane Doe",
  "createdAt": "2026-10-20T21:40:00.000Z"
}
```

The sender receives a confirmation instead of an echo:
```json
{
  "type": "confirmation",
  "status": "delivered",
  "id": "clx...",
  "clientMsgId": "uuid-v4-client-msg-id",
  "groupId": "group-or-conversation-id",
  "createdAt": "2026-10-20T21:40:00.000Z"
}
```

#### 3. Leave a Room
Client sends:
```json
{
  "type": "leave",
  "groupId": "group-or-conversation-id"
}
```

---

## 🧪 Testing the Scaling Setup

1. Start Redis and two backend instances (ports `8080` and `8081`).
2. Connect two users with [`wscat`](https://github.com/websockets/wscat):
   ```bash
   wscat -c "ws://localhost:8080?token=JWT_USER_A"
   wscat -c "ws://localhost:8081?token=JWT_USER_B"
   ```
3. Both send `{"type":"join","groupId":"GROUP_ID"}`.
4. User A sends a `broadcast`. User B should receive it, and A should receive only a `confirmation`.
5. Inspect Redis:
   ```bash
   docker exec -it some-redis redis-cli PUBSUB CHANNELS
   docker exec -it some-redis redis-cli PUBSUB NUMSUB group:GROUP_ID   # 2 = one subscription per server
   ```
6. Watch messages pass through Redis live:
   ```bash
   docker exec -it some-redis redis-cli SUBSCRIBE group:GROUP_ID
   ```

---

## 🔒 Security Best Practices
- Passwords hashed with `bcryptjs` (salt rounds = 10).
- Group invite tokens are cryptographically generated and hashed via SHA-256 before database storage.
- Protected REST endpoints require valid `Bearer <JWT>` tokens.
- WebSocket connections are authenticated with a verified JWT, and sender identity comes from the token.
- Automatic disconnection cleanup prevents zombie WebSocket memory leaks and releases Redis subscriptions when a group has no local users.

---

## 🗺️ Roadmap

- [ ] Verify group membership before `join` and `broadcast` over WebSocket
- [ ] Missed-message recovery after reconnect (fetch messages after last received ID)
- [ ] Redis Streams for guaranteed delivery
- [ ] Rate limiting per connection
- [ ] Support multiple tabs per user (track a set of sockets per user)
- [ ] Automated tests and CI