import { NextResponse } from 'next/server';
import { withAuth, withRole, withValidation } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/types/api.types';
import { ApprovalService } from '@/services/approval.service';
import { z } from 'zod/v4';

const approveSchema = z.object({
    action: z.enum(['APPROVE', 'REJECT']),
    remarks: z.string().optional(),
});

// Helper to extract id from context
function getParamId(context?: { params: Record<string, string> }): string {
    return context?.params?.id ?? '';
}

/**
 * POST /api/passes/:id/approve
 * Approve or reject a student guest pass.
 * Auth: ADMIN only
 */
export const POST = withAuth(
    withRole(
        ['ADMIN'],
        withValidation(approveSchema, async (req, validatedData, context) => {
            try {
                const passId = getParamId(context);
                const approverId = req.auth.user.id;
                const ipAddress =
                    req.headers.get('x-forwarded-for') || undefined;

                const { action, remarks } = validatedData;

                if (action === 'APPROVE') {
                    const result = await ApprovalService.approvePass(
                        passId,
                        approverId,
                        remarks,
                        ipAddress
                    );
                    return NextResponse.json(successResponse(result), { status: 200 });
                } else {
                    // REJECT requires remarks
                    if (!remarks || remarks.trim().length === 0) {
                        return NextResponse.json(
                            errorResponse(
                                'VALIDATION_ERROR',
                                'Remarks are required when rejecting a pass'
                            ),
                            { status: 400 }
                        );
                    }
                    const result = await ApprovalService.rejectPass(
                        passId,
                        approverId,
                        remarks,
                        ipAddress
                    );
                    return NextResponse.json(successResponse(result), { status: 200 });
                }
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'Failed to process approval';
                const status = message.includes('not found')
                    ? 404
                    : message.includes('status')
                      ? 409
                      : 400;
                console.error('[POST /api/passes/:id/approve]', err);
                return NextResponse.json(
                    errorResponse('APPROVAL_ERROR', message),
                    { status }
                );
            }
        })
    )
);
