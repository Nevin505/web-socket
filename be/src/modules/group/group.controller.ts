import { Request, Response } from "express";
import { createGroup, getGroupById, getUserGroups } from "./group.service";

export const createGroupHandler = async (req: Request, res: Response) => {
    try {
        const { name, maxMembers } = req.body;
        if (!name || typeof name !== "string") {
            return res.status(400).json({ message: "Group name is required" });
        }

        const result = await createGroup(name, req.user.id, maxMembers);
        return res.status(201).json({
            message: result.message,
            group: result.group,
        });
    } catch (error: any) {
        return res.status(400).json({ message: error.message || "Failed to create group" });
    }
};

export const getUserGroupsHandler = async (req: Request, res: Response) => {
    try {
        const groups = await getUserGroups(req.user.id);
        return res.status(200).json({ success: true, groups });
    } catch (error: any) {
        return res.status(400).json({ message: error.message || "Failed to fetch groups" });
    }
};

export const getGroupDetailsHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const group = await getGroupById(id, req.user.id);
        return res.status(200).json({ success: true, group });
    } catch (error: any) {
        return res.status(404).json({ message: error.message || "Group not found" });
    }
};
