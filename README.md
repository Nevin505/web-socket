# Real-Time Chat & Group Collaboration Platform

A full-stack, real-time group chat and collaboration web application built with **React 19**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express 5**, **Prisma ORM**, **PostgreSQL**, and **WebSockets**.

---

## 🌟 Key Features

- **Real-Time Messaging**: Instant message broadcast across group members using WebSockets, with automatic room management and disconnection cleanup.
- **Message Persistence & History**: Real-time messages are stored in PostgreSQL and retrieved automatically via REST API when switching conversations.
- **Deduplication & Idempotency**: Client-generated message IDs (`clientMsgId`) prevent duplicate message rendering and storage.
- **Group Management**:
  - Create and customize groups with member capacity limits.
  - Role-based membership system (`OWNER`, `ADMIN`, `MEMBER`).
- **Secure Group Invitations**:
  - Invite users via shareable links or automated email notifications (via Nodemailer / SMTP).
  - Cryptographically hashed invitation tokens with expiration and status tracking (`PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`).
- **User Authentication**: Secure JWT-based authentication with bcrypt-hashed passwords.
- **Unified Port Architecture**: Express HTTP REST API and WebSocket server run on the same shared port via Node's `http.createServer`.

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
│   │   └── main.ts           # Express app & shared WebSocket server
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

---

### 1. Backend Configuration (`be/`)

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
   *The server runs Express REST APIs and the WebSocket server concurrently on `http://localhost:8080` and `ws://localhost:8080`.*

---

### 2. Frontend Configuration (`fe/`)

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

---

### WebSocket Protocol (`ws://localhost:8080`)

#### 1. Join a Room
Client sends:
```json
{
  "type": "join",
  "groupId": "group-or-conversation-id",
  "sentBy": "user-id"
}
```

#### 2. Send / Broadcast a Message
Client sends:
```json
{
  "type": "broadcast",
  "content": "Hello team!",
  "groupId": "group-or-conversation-id",
  "sentBy": "user-id",
  "id": "uuid-v4-client-msg-id"
}
```

Server persists message to PostgreSQL and broadcasts to all room members:
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

#### 3. Leave a Room
Client sends:
```json
{
  "type": "leave",
  "groupId": "group-or-conversation-id",
  "sentBy": "user-id"
}
```

---

## 🔒 Security Best Practices
- Passwords hashed with `bcryptjs` (salt rounds = 10).
- Group invite tokens are cryptographically generated and hashed via SHA-256 before database storage.
- Protected REST endpoints require valid `Bearer <JWT>` tokens.
- Automatic disconnection cleanup prevents zombie WebSocket memory leaks.
