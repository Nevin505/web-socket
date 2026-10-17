import type { AuthUser } from "./auth";

export interface Profile extends AuthUser {
    bio: string;
    phone: string;
    username: string | null;
}

export type ProfileUpdate = Partial<Pick<Profile, "name" | "phone" | "bio" | "username">>

