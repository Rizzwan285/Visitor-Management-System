import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { isAllowedEmail } from '@/config/domains';
import { authConfig } from '@/lib/auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,

    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        Credentials({
            name: 'Security Login',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const email = credentials?.email as string;
                const password = credentials?.password as string;

                if (!email || !password) return null;

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.passwordHash) return null;

                const isValid = await bcrypt.compare(password, user.passwordHash);
                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                } as { id: string; email: string; name: string | null; role: string };
            },
        }),
    ],

    callbacks: {
        ...authConfig.callbacks,

        async signIn({ user, account }) {
            // Credentials provider — already validated in authorize
            if (account?.provider === 'credentials') return true;

            // Google OAuth — check domain
            if (account?.provider === 'google' && user.email) {
                const result = isAllowedEmail(user.email);
                if (!result.allowed) return false;

                // Upsert user with role derived from email domain
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (!existingUser) {
                    await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name || null,
                            role: result.role as 'EMPLOYEE' | 'STUDENT' | 'OFFICIAL',
                            avatarUrl: user.image || null,
                        },
                    });
                }

                return true;
            }

            return false;
        },

        async jwt({ token, user }) {
            if (user) {
                // First sign-in — look up full user record
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email! },
                });

                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                    token.uniqueId = dbUser.uniqueId;
                    token.rollNumber = dbUser.rollNumber;
                }
            }
            return token;
        },

        // session callback inherited from authConfig
    },
});
