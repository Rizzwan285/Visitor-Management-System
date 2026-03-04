import { NextResponse } from 'next/server';
import { withAuth, withRole, withValidation } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/types/api.types';
import { ScanService } from '@/services/scan.service';
import { scanInputSchema } from '@/schemas/scan.schema';
import type { ScanType } from '@prisma/client';

// Helper to extract id from context
function getParamId(context?: { params: Record<string, string> }): string {
    return context?.params?.id ?? '';
}

/**
 * POST /api/passes/:id/scan
 * Log a gate entry or exit scan for a pass.
 * Auth: SECURITY only
 */
export const POST = withAuth(
    withRole(
        ['SECURITY'],
        withValidation(scanInputSchema, async (req, validatedData, context) => {
            try {
                const passId = getParamId(context);
                const securityId = req.auth.user.id;
                const ipAddress =
                    req.headers.get('x-forwarded-for') || undefined;

                const { scanType, gateLocation, notes } = validatedData;

                const scanLog = await ScanService.logScan(
                    passId,
                    securityId,
                    scanType as ScanType,
                    gateLocation,
                    notes,
                    ipAddress
                );

                return NextResponse.json(successResponse(scanLog), { status: 201 });
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'Failed to log scan';
                console.error('[POST /api/passes/:id/scan]', err);
                return NextResponse.json(
                    errorResponse('SCAN_ERROR', message),
                    { status: 400 }
                );
            }
        })
    )
);
