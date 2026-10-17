import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const updateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(20)
    .regex(/^[a-z0-9_]+$/, "Only letters, numbers and underscores"),
  bio: z.string().trim().max(200, "Bio can be at most 200 characters").optional().default(""),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,15}$/, "Invalid phone number")
    .or(z.literal(""))
    .optional()
    .default(""),
});

// Never return the password hash
const profileSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  bio: true,
  phone: true,
} satisfies Prisma.UserSelect;

export const getProfile = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: profileSelect,
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

export const updateProfile = async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: parsed.data,
      select: profileSelect,
    });
    res.json(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 = unique constraint failed
      if (err.code === "P2002") {
        return res.status(409).json({
          message: "Validation failed",
          errors: { username: ["Username already taken"] },
        });
      }
      // P2025 = record not found
      if (err.code === "P2025") {
        return res.status(404).json({ message: "User not found" });
      }
    }
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};