import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/types/api.types';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(
    withRole(['SECURITY', 'ADMIN'], async () => {
        try {
            // Find ACTIVE passes where the visitTo time is in the past
            // and the latest scan log is NOT a FINAL_EXIT
            const overstayingPasses = await prisma.visitorPass.findMany({
                where: {
                    status: 'ACTIVE',
                    visitTo: {
                        lt: new Date(),
                    },
                    deletedAt: null,
                    // Check if final exit doesn't exist
                    scanLogs: {
                        none: {
                            scanType: 'FINAL_EXIT'
                        }
                    }
                },
                select: {
                    id: true,
                    passNumber: true,
                    visitorName: true,
                    passType: true,
                    visitorMobile: true,
                    pocMobile: true,
                    pointOfContact: true,
                    visitTo: true,
                },
                orderBy: {
                    visitTo: 'asc' // Most overstayed first
                }
            });

            return NextResponse.json(successResponse(overstayingPasses), { status: 200 });
        } catch (err) {
            console.error('[GET /api/dashboard/overstaying]', err);
            return NextResponse.json(
                errorResponse('OVERSTAYING_FETCH_ERROR', 'Failed to fetch overstaying visitors'),
                { status: 500 }
            );
        }
    })
); 
