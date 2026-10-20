import prisma from "../../config/prisma";
import { isUndefined } from "../../utils/check";

export const ProfileService = async (id: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                bio: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    } catch (error) {
        console.error("Error in ProfileService:", error);
        throw error;
    }
};

export interface UpdateProfileData {
    name?: string;
    username?: string | null;
    bio?: string;
    phone?: string;
}

export const updateProfileService = async (id: string, data: UpdateProfileData) => {
    try {
        const updateData: {
            name?: string;
            bio?: string;
            phone?: string;
            username?: string | null;
        } = {};

        if (isUndefined(data, "name", data.name)) {
            updateData.name = data.name;
        }
        if (isUndefined(data, "bio", data.bio)) {
            updateData.bio = data.bio;
        }
        if (isUndefined(data, "phone", data.phone)) {
            updateData.phone = data.phone;
        }
        if (isUndefined(data, "username", data.username)) {
            updateData.username = data.username && data.username.trim() !== "" ? data.username : null;
        }


        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                bio: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    } catch (error) {
        console.error("Error in updateProfileService:", error);
        throw error;
    }
};