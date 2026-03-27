import { NextResponse } from 'next/server';
import { withAuth, withValidation } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/types/api.types';
import { PassService } from '@/services/pass.service';
import type { Role } from '@prisma/client';
import { z } from 'zod/v4';

// Schema for PATCH body — all fields optional
const updatePassSchema = z.object({
    visitorName: z.string().min(2).optional(),
    visitorSex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    purpose: z.string().min(1).optional(),
    visitFrom: z.iso.datetime().optional(),
    visitTo: z.iso.datetime().optional(),
    visitorRelation: z.string().optional(),
    visitorAge: z.number().int().positive().optional(),
    visitorMobile: z.string().regex(/^\d{10}$/).optional(),
    pointOfContact: z.string().optional(),
    hostelName: z.string().optional(),
});

// Helper to extract id from context
async function getParamId(context?: any): Promise<string> {
    if (!context?.params) return '';
    const resolvedParams = await Promise.resolve(context.params);
    return resolvedParams?.id ?? '';
}

/**
 * GET /api/passes/:id
 * Get pass detail. Accessible by owner, SECURITY, or ADMIN.
 */
export const GET = withAuth(async (req, context) => {
    try {
        const id = await getParamId(context);
        const userId = req.auth.user.id;
        const role = req.auth.user.role as Role;

        const pass = await PassService.getPassById(id);

        if (!pass) {
            return NextResponse.json(
                errorResponse('NOT_FOUND', 'Pass not found'),
                { status: 404 }
            );
        }

        // Access control: owner, SECURITY, or ADMIN
        const isOwner = pass.createdById === userId;
        const isWardenAccess = role === 'ASSISTANT_WARDEN' && 
            ['STUDENT_GUEST', 'STUDENT_EXIT'].includes(pass.passType);
            
        const canAccess =
            isOwner || role === 'SECURITY' || role === 'ADMIN' || isWardenAccess;

        if (!canAccess) {
            return NextResponse.json(
                errorResponse('FORBIDDEN', 'You do not have access to this pass'),
                { status: 403 }
            );
        }

        return NextResponse.json(successResponse(pass), { status: 200 });
    } catch (err) {
        console.error('[GET /api/passes/:id]', err);
        return NextResponse.json(
            errorResponse('GET_PASS_ERROR', 'Failed to fetch pass'),
            { status: 500 }
        );
    }
});

/**
 * PATCH /api/passes/:id
 * Update a pass. Only owner (or ADMIN) can update, and only when DRAFT or ACTIVE.
 */
export const PATCH = withAuth(
    withValidation(updatePassSchema, async (req, validatedData, context) => {
        try {
            const id = await getParamId(context);
            const userId = req.auth.user.id;
            const role = req.auth.user.role as Role;
            const ipAddress =
                req.headers.get('x-forwarded-for') || undefined;

            const pass = await PassService.updatePass(
                id,
                validatedData,
                userId,
                role,
                ipAddress
            );

            return NextResponse.json(successResponse(pass), { status: 200 });
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Failed to update pass';
            const status = message.includes('not found')
                ? 404
                : message.includes('permission')
                    ? 403
                    : 400;
            return NextResponse.json(
                errorResponse('UPDATE_PASS_ERROR', message),
                { status }
            );
        }
    })
);

/**
 * DELETE /api/passes/:id
 * Cancel (soft-delete) a pass. Owner or ADMIN only.
 */
export const DELETE = withAuth(async (req, context) => {
    try {
        const id = await getParamId(context);
        const userId = req.auth.user.id;
        const role = req.auth.user.role as Role;
        const ipAddress = req.headers.get('x-forwarded-for') || undefined;

        const cancelled = await PassService.cancelPass(id, userId, role, ipAddress);

        return NextResponse.json(successResponse(cancelled), { status: 200 });
    } catch (err) {
        const message =
            err instanceof Error ? err.message : 'Failed to cancel pass';
        const status = message.includes('not found')
            ? 404
            : message.includes('permission')
                ? 403
                : 400;
        return NextResponse.json(
            errorResponse('CANCEL_PASS_ERROR', message),
            { status }
        );
    }
});
