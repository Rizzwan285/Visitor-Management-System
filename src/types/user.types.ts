import type { Role } from '@prisma/client';

export interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    rollNumber?: string | null;
    uniqueId?: string | null;
    department?: string | null;
    avatarUrl?: string | null;
    createdAt: Date;
}

export interface SessionUser {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    uniqueId?: string | null;
    rollNumber?: string | null;
}
