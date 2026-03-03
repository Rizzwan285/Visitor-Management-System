import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/types/api.types';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/generated/prisma/client';

/**
 * GET /api/users
 * List users. Optionally filter by role via ?role=ADMIN etc.
 * Passwords are never returned.
 * Auth: ALL roles
 */
export const GET = withAuth(async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const roleFilter = searchParams.get('role') as Role | null;
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
        const search = searchParams.get('search') || undefined;

        // Validate role filter if provided
        const validRoles: Role[] = ['EMPLOYEE', 'STUDENT', 'OFFICIAL', 'SECURITY', 'ADMIN'];
        if (roleFilter && !validRoles.includes(roleFilter)) {
            return NextResponse.json(
                errorResponse('VALIDATION_ERROR', `Invalid role: ${roleFilter}`),
                { status: 400 }
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = { deletedAt: null };
        if (roleFilter) where.role = roleFilter;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
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
                    // Explicitly exclude passwordHash
                },
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json(
            successResponse(users, {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error('[GET /api/users]', err);
        return NextResponse.json(
            errorResponse('LIST_USERS_ERROR', 'Failed to list users'),
            { status: 500 }
        );
    }
});
