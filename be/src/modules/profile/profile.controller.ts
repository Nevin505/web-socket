import { Request, Response } from "express";
import { ProfileService, updateProfileService } from "./profile.service";
import { updateProfileSchema } from "./profile.schema";
import { Prisma } from "@prisma/client";

export const authMe = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const id = req.user.id;

    try {
        const user = await ProfileService(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error in authMe:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    try {
        const user = await updateProfileService(req.user.id, parsed.data);
        return res.status(200).json(user);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return res.status(409).json({
                    message: "Validation failed",
                    errors: { username: ["Username already taken"] },
                });
            }
            if (error.code === "P2025") {
                return res.status(404).json({ message: "User not found" });
            }
        }
        console.error("Error in updateProfile:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};