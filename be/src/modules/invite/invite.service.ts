

import { GroupRole } from "@prisma/client";
import prisma from "../../config/prisma";
import { createInvitationToken, hashInvitationToken } from "../../utils/invitation-token";
import { sendGroupInvitationEmail } from "../email/email.service";

export async function acceptInvitation(
    rawToken: string,
    userId: string,
) {
    if (!rawToken || rawToken.length > 200) {
        throw new Error("Invalid invitation token");
    }

    const tokenHash = hashInvitationToken(rawToken);

    const [user, invitation] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
            },
        }),

        prisma.groupInvitation.findUnique({
            where: { token: tokenHash },
        }),
    ]);

    if (!user) {
        throw new Error("User not found");
    }

    if (!invitation || invitation.status !== "PENDING") {
        throw new Error("Invitation is invalid or already used");
    }

    if (invitation.expiresAt <= new Date()) {
        await prisma.groupInvitation.updateMany({
            where: {
                id: invitation.id,
                status: "PENDING",
            },
            data: { status: "EXPIRED" },
        });

        throw new Error("Invitation has expired");
    }

    if (
        user.email.toLowerCase() !== invitation.email.toLowerCase()
    ) {
        throw new Error(
            "Log in or sign up using the invited email address",
        );
    }


    // Both operations succeed together or neither is committed.
    return prisma.$transaction(async (tx) => {
        const claimed = await tx.groupInvitation.updateMany({
            where: {
                id: invitation.id,
                status: "PENDING",
                expiresAt: { gt: new Date() },
            },
            data: {
                status: "ACCEPTED",
            },
        });

        if (claimed.count !== 1) {
            throw new Error("Invitation expired or has already been used");
        }

        await tx.groupMember.upsert({
            where: {
                groupId_userId: {
                    groupId: invitation.groupId,
                    userId,
                },
            },
            create: {
                groupId: invitation.groupId,
                userId,
                role: "MEMBER",
            },
            update: {},
        });

        return {
            groupId: invitation.groupId,
            message: "You have joined the group",
        };
    });
}


export async function inviteToGroup(
    groupId: string,
    inviterId: string,
    emailInput: string,
    sendEmail?: boolean
) {
    const email = emailInput.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email address");
    }

    // Only group owners and admins can invite.
    const membership = await prisma.groupMember.findUnique({
        where: {
            groupId_userId: {
                groupId,
                userId: inviterId,
            },
        },
    });

    if (
        !membership ||
        ![GroupRole.OWNER, GroupRole.ADMIN].some(
            (role) => role === membership.role
        )
    ) {
        throw new Error("You cannot invite members to this group");
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (existingUser) {
        const existingMembership = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: existingUser.id,
                },
            },
        });

        if (existingMembership) {
            throw new Error("This user is already a group member");
        }
    }

    const { token, tokenHash } = createInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Replace any previous pending invitation for this email/group.
    await prisma.groupInvitation.updateMany({
        where: {
            groupId,
            email,
            status: "PENDING",
        },
        data: { status: "REVOKED" },
    });

    const [invitation, inviter] = await Promise.all([
        prisma.groupInvitation.create({
            data: {
                groupId,
                email,
                token: tokenHash,
                userId: inviterId,
                invitedById: inviterId,
                expiresAt,
            },
            include: {
                group: { select: { name: true } },
            },
        }),
        prisma.user.findUnique({
            where: { id: inviterId },
            select: { name: true, email: true },
        }),
    ]);

    const frontendBase =
        process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";
    const link = `${frontendBase}/invite/${encodeURIComponent(token)}`;
    const inviterName = inviter?.name || inviter?.email || "A team member";

    const shouldSendEmail =
        sendEmail !== false &&
        !email.endsWith("@invite.link") &&
        !email.endsWith("@placeholder.internal");

    let emailSent = false;
    let emailPreviewUrl: string | undefined = undefined;

    if (shouldSendEmail) {
        const emailResult = await sendGroupInvitationEmail({
            to: invitation.email,
            inviterName,
            groupName: invitation.group.name,
            inviteLink: link,
            token,
            expiresAt: invitation.expiresAt,
        });
        emailSent = emailResult.success;
        emailPreviewUrl = (emailResult.previewUrl as string) || undefined;
    }

    return {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
        token,
        link,
        groupName: invitation.group.name,
        emailSent,
        emailPreviewUrl,
    };
}
