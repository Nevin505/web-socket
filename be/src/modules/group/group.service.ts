import { GroupRole, ConversationType } from "@prisma/client";
import prisma from "../../config/prisma";

export async function createGroup(name: string, userId: string, maxMembers = 4) {
    if (!name || name.trim().length === 0) {
        throw new Error("Group name is required");
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 50) {
        throw new Error("Group name must be 50 characters or less");
    }

    const memberLimit = Math.min(Math.max(Number(maxMembers) || 4, 2), 100);

    return prisma.$transaction(async (tx) => {
        // 1. Create the backing Conversation
        const conversation = await tx.conversation.create({
            data: {
                type: ConversationType.GROUP,
                name: trimmedName,
                members: {
                    create: {
                        userId,
                        role: GroupRole.OWNER,
                    },
                },
            },
        });

        // 2. Create the Group linked to this Conversation
        const group = await tx.group.create({
            data: {
                name: trimmedName,
                maxMembers: memberLimit,
                createdById: userId,
                conversationId: conversation.id,
            },
            include: {
                conversation: {
                    include: {
                        members: true,
                    },
                },
            },
        });

        return {
            message: "Group is being created",
            group: {
                ...group,
                currentUserRole: GroupRole.OWNER,
                memberCount: 1,
            },
        };
    });
}

export async function getUserGroups(userId: string) {
    const memberships = await prisma.conversationMember.findMany({
        where: {
            userId,
            conversation: {
                type: ConversationType.GROUP,
            },
        },
        include: {
            conversation: {
                include: {
                    group: {
                        include: {
                            createdBy: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    username: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            members: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            joinedAt: "desc",
        },
    });

    return memberships.map((m) => {
        const group = m.conversation.group;
        return {
            id: group?.id || m.conversationId,
            conversationId: m.conversationId,
            name: group?.name || m.conversation.name || "Unnamed Group",
            maxMembers: group?.maxMembers || 4,
            createdById: group?.createdById || "",
            createdAt: group?.createdAt || m.conversation.createdAt,
            updatedAt: group?.updatedAt || m.conversation.updatedAt,
            currentUserRole: m.role,
            memberCount: m.conversation._count.members,
            members: m.conversation.members.map((cm) => ({
                id: cm.id,
                userId: cm.userId,
                role: cm.role,
                joinedAt: cm.joinedAt,
                users: cm.user,
            })),
            createdBy: group?.createdBy,
        };
    });
}

export async function getGroupById(groupId: string, userId: string) {
    const group = await prisma.group.findFirst({
        where: {
            OR: [
                { id: groupId },
                { conversationId: groupId },
            ],
        },
        include: {
            conversation: {
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    username: true,
                                },
                            },
                        },
                    },
                },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            invitations: {
                where: {
                    status: "PENDING",
                    expiresAt: { gt: new Date() },
                },
                select: {
                    id: true,
                    email: true,
                    expiresAt: true,
                    createdAt: true,
                    status: true,
                },
            },
        },
    });

    if (!group) {
        throw new Error("Group not found");
    }

    const membership = group.conversation.members.find((m) => m.userId === userId);
    if (!membership) {
        throw new Error("You are not a member of this group");
    }

    return {
        ...group,
        currentUserRole: membership.role,
        memberCount: group.conversation.members.length,
        members: group.conversation.members.map((cm) => ({
            id: cm.id,
            userId: cm.userId,
            role: cm.role,
            joinedAt: cm.joinedAt,
            users: cm.user,
        })),
    };
}
