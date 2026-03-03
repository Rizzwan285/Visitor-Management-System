import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/types/api.types';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/me
 * Returns the current authenticated user's full profile.
 * Auth: ALL roles
 */
export const GET = withAuth(async (req) => {
    try {
        const userId = req.auth.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                rollNumber: true,
                uniqueId: true,
                department: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
                // passwordHash intentionally excluded
            },
        });

        if (!user) {
            return NextResponse.json(
                errorResponse('NOT_FOUND', 'User not found'),
                { status: 404 }
            );
        }

        return NextResponse.json(successResponse(user), { status: 200 });
    } catch (err) {
        console.error('[GET /api/users/me]', err);
        return NextResponse.json(
            errorResponse('GET_USER_ERROR', 'Failed to fetch user profile'),
            { status: 500 }
        );
    }
});
