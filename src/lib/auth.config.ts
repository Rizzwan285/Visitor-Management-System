import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe auth config (no Prisma imports).
 * Shared between middleware and the full auth.ts config.
 */
export const authConfig = {
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: 'jwt' as const },

    pages: {
        signIn: '/login',
        error: '/login',
    },

    callbacks: {
        // Reads custom claims from the JWT — no DB calls needed.
        session({ session, token }) {
            if (session.user) {
                (session.user as unknown as Record<string, unknown>).id = token.id;
                (session.user as unknown as Record<string, unknown>).role = token.role;
                (session.user as unknown as Record<string, unknown>).uniqueId = token.uniqueId;
                (session.user as unknown as Record<string, unknown>).rollNumber = token.rollNumber;
            }
            return session;
        },
    },

    providers: [], // Actual providers are added in auth.ts
} satisfies NextAuthConfig;
