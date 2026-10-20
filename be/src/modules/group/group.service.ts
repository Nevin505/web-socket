import { GroupRole } from "@prisma/client";
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
        const group = await tx.group.create({
            data: {
                name: trimmedName,
                maxMembers: memberLimit,
                createdById: userId,
            },
        });

        await tx.groupMember.create({
            data: {
                groupId: group.id,
                userId,
                role: GroupRole.OWNER,
            },
        });

        return {
            message: "Group is being created",
            group,
        };
    });
}

export async function getUserGroups(userId: string) {
    const memberships = await prisma.groupMember.findMany({
        where: { userId },
        include: {
            group: {
                include: {
                    members: {
                        include: {
                            users: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    username: true,
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

    return memberships.map((m) => ({
        ...m.group,
        currentUserRole: m.role,
        memberCount: m.group._count.members,
    }));
}

export async function getGroupById(groupId: string, userId: string) {
    const membership = await prisma.groupMember.findUnique({
        where: {
            groupId_userId: {
                groupId,
                userId,
            },
        },
    });

    if (!membership) {
        throw new Error("You are not a member of this group");
    }

    const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
            members: {
                include: {
                    users: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            username: true,
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

    return {
        ...group,
        currentUserRole: membership.role,
    };
}
