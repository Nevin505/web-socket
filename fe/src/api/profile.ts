import api from "../lib/axios";
import type { AuthUser } from "./auth";

export interface Profile extends AuthUser {
    bio: string;
    phone: string;
    username: string | null;
}

export type ProfileUpdate = Partial<Pick<Profile, "name" | "phone" | "bio" | "username">>


export async function authMe(): Promise<Profile> {
    const { data } = await api.get<Profile>("/profile/me");
    return data;
}

export async function authUpdate(payload: ProfileUpdate): Promise<Profile> {
    const { data } = await api.patch<Profile>("/profile/me", payload);
    return data;
}

