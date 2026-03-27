import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, withValidation } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/types/api.types';
import { PassService } from '@/services/pass.service';
import { createPassSchema, passFiltersSchema } from '@/schemas/pass.schema';
import type { Role } from '@prisma/client';

/**
 * POST /api/passes
 * Create a new visitor pass.
 * Auth: ALL roles except ASSISTANT_WARDEN
 */
export const POST = withAuth(
    withRole(['EMPLOYEE', 'STUDENT', 'OFFICIAL', 'SECURITY', 'ADMIN', 'OIC_STUDENT_SECTION'],
        withValidation(createPassSchema, async (req, validatedData) => {
        try {
            const userId = req.auth.user.id;
            const ipAddress =
                req.headers.get('x-forwarded-for') ||
                req.headers.get('x-real-ip') ||
                undefined;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pass = await PassService.createPass(validatedData as any, userId, ipAddress);

            return NextResponse.json(successResponse(pass), { status: 201 });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create pass';
            console.error('[POST /api/passes]', err);
            return NextResponse.json(
                errorResponse('CREATE_PASS_ERROR', message),
                { status: 400 }
            );
        }
    })
  )
);

/**
 * GET /api/passes
 * List passes — role-scoped and paginated.
 * Auth: ALL roles
 */
export const GET = withAuth(async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const rawFilters = Object.fromEntries(searchParams.entries());

        const filtersResult = passFiltersSchema.safeParse(rawFilters);
        if (!filtersResult.success) {
            const fieldErrors = filtersResult.error.issues.map((issue) => ({
                field: issue.path.map(String).join('.') || 'root',
                message: issue.message,
            }));
            return NextResponse.json(
                errorResponse('VALIDATION_ERROR', 'Invalid query parameters', fieldErrors),
                { status: 400 }
            );
        }

        const filters = filtersResult.data;
        const userId = req.auth.user.id;
        const role = req.auth.user.role as Role;
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;

        const result = await PassService.listPasses(filters, userId, role, page, limit);

        return NextResponse.json(
            successResponse(result.data, result.meta),
            { status: 200 }
        );
    } catch (err) {
        console.error('[GET /api/passes]', err);
        return NextResponse.json(
            errorResponse('LIST_PASSES_ERROR', 'Failed to list passes'),
            { status: 500 }
        );
    }
});
