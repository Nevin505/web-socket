import { Request, Response } from "express";
import { acceptInvitation, inviteToGroup } from "./invite.service";

export const generateInviteCode = async (req: Request, res: Response) => {
    try {
        const { groupId, email } = req.body;
        if (!groupId || !email) {
            return res.status(400).json({ message: "groupId and email are required" });
        }
        const invitation = await inviteToGroup(groupId, req.user.id, email);
        return res.status(201).json({ success: true, invitation });
    } catch (error: any) {
        return res.status(400).json({ message: error.message || "Failed to generate invite" });
    }
};

export const redemInviteCode = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Invitation token is required" });
        }
        const result = await acceptInvitation(token, req.user.id);
        return res.status(200).json({ success: true, result });
    } catch (error: any) {
        return res.status(400).json({ message: error.message || "Failed to redeem invite" });
    }
};