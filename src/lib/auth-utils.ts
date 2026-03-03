import { auth } from '@/lib/auth';

interface SessionUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
    uniqueId?: string | null;
    rollNumber?: string | null;
}

/**
 * Get the current user from the session (server-side).
 * Returns null if no session.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
    const session = await auth();

    if (!session?.user) {
        return null;
    }

    return session.user as SessionUser;
}

/**
 * Require authentication — throws if no session.
 * Use in Server Components and Server Actions.
 */
export async function requireAuth(): Promise<SessionUser> {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error('Authentication required');
    }

    return user;
}

/**
 * Require specific roles — throws if user role is not in allowed list.
 * Use in Server Components and Server Actions.
 */
export async function requireRole(roles: string[]): Promise<SessionUser> {
    const user = await requireAuth();

    if (!roles.includes(user.role)) {
        throw new Error(
            `Access denied. Required roles: ${roles.join(', ')}`
        );
    }

    return user;
}
