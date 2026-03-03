import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/types/api.types';
import { ScanService } from '@/services/scan.service';

/**
 * GET /api/passes/verify?code=VMS:<passId>:<checksum>
 * Verify a QR code and return pass details if valid.
 * Auth: SECURITY only
 */
export const GET = withAuth(
    withRole(['SECURITY', 'ADMIN'], async (req) => {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json(
                errorResponse('VALIDATION_ERROR', 'Missing required query parameter: code'),
                { status: 400 }
            );
        }

        try {
            const pass = await ScanService.verifyAndGetPass(code);
            return NextResponse.json(successResponse(pass), { status: 200 });
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'QR verification failed';

            // Determine appropriate status code
            let status = 400;
            if (message.includes('not found')) status = 404;
            else if (message.includes('not active')) status = 409;
            else if (message.includes('expired')) status = 410;
            else if (message.includes('tampered') || message.includes('Invalid')) status = 422;

            return NextResponse.json(
                errorResponse('QR_VERIFY_ERROR', message),
                { status }
            );
        }
    })
);
