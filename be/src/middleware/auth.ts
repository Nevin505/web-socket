import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export const auth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("JWT_SECRET is not configured");
        return res.status(500).json({ message: "Internal server error" });
    }

    try {
        const decoded = jwt.verify(token, secret) as JwtPayload | string;

        if (!decoded || typeof decoded === "string") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Token can have `id` or `sub` depending on the sign payload
        const userId = (decoded as JwtPayload).id || (decoded as JwtPayload).sub;
        if (!userId || typeof userId !== "string") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = { id: userId };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};