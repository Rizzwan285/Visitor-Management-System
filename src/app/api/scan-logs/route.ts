import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/types/api.types';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/scan-logs
 * Returns paginated scan history.
 * Supports filters: passId, dateFrom, dateTo
 * Auth: SECURITY, ADMIN
 */
export const GET = withAuth(
    withRole(['SECURITY', 'ADMIN'], async (req) => {
        try {
            const { searchParams } = new URL(req.url);

            const passId = searchParams.get('passId') || undefined;
            const dateFrom = searchParams.get('dateFrom') || undefined;
            const dateTo = searchParams.get('dateTo') || undefined;
            const page = Math.max(
                1,
                parseInt(searchParams.get('page') || '1', 10)
            );
            const limit = Math.min(
                100,
                Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const where: Record<string, any> = {};

            if (passId) where.passId = passId;

            if (dateFrom || dateTo) {
                where.scannedAt = {};
                if (dateFrom) where.scannedAt.gte = new Date(dateFrom);
                if (dateTo) where.scannedAt.lte = new Date(dateTo);
            }

            const skip = (page - 1) * limit;

            const [scanLogs, total] = await Promise.all([
                prisma.scanLog.findMany({
                    where,
                    include: {
                        scannedBy: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true,
                            },
                        },
                        pass: {
                            select: {
                                id: true,
                                passNumber: true,
                                passType: true,
                                status: true,
                                visitorName: true,
                                visitFrom: true,
                                visitTo: true,
                            },
                        },
                    },
                    orderBy: { scannedAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.scanLog.count({ where }),
            ]);

            return NextResponse.json(
                successResponse(scanLogs, {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }),
                { status: 200 }
            );
        } catch (err) {
            console.error('[GET /api/scan-logs]', err);
            return NextResponse.json(
                errorResponse('SCAN_LOGS_ERROR', 'Failed to fetch scan logs'),
                { status: 500 }
            );
        }
    })
);
