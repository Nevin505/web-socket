export type GroupRole = "ADMIN" | "MEMBER" | "OWNER";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export interface GroupMemberUser {
  id: string;
  name: string;
  email: string;
  username?: string | null;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  users?: GroupMemberUser;
}

export interface GroupInvitation {
  id: string;
  token: string;
  groupId: string;
  userId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  status: InvitationStatus;
}

export interface Group {
  id: string;
  name: string;
  maxMembers: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  currentUserRole?: GroupRole;
  memberCount?: number;
  members?: GroupMember[];
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  invitations?: GroupInvitation[];
}
