import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        
        // Ensure only ADMIN can access reports
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        let dateFilter = {};
        if (startDateParam && endDateParam) {
            dateFilter = {
                createdAt: {
                    gte: new Date(startDateParam),
                    lte: new Date(endDateParam),
                }
            };
        }

        const passes = await prisma.visitorPass.findMany({
            where: {
                deletedAt: null,
                ...dateFilter
            },
            include: {
                createdBy: {
                    select: { name: true, email: true, department: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Generate Aggregations
        const summary = {
            total: passes.length,
            byType: {
                STUDENT_GUEST: 0,
                EMPLOYEE_GUEST: 0,
                OFFICIAL: 0,
                STUDENT_EXIT: 0,
                WALKIN: 0,
            },
            byStatus: {
                ACTIVE: 0,
                APPROVED: 0,
                PENDING_APPROVAL: 0,
                EXPIRED: 0,
                CANCELLED: 0,
                REJECTED: 0,
                DRAFT: 0
            }
        };

        passes.forEach(pass => {
            if (pass.passType in summary.byType) {
                summary.byType[pass.passType as keyof typeof summary.byType]++;
            }
            if (pass.status in summary.byStatus) {
                summary.byStatus[pass.status as keyof typeof summary.byStatus]++;
            }
        });

        return NextResponse.json({ summary, passes });

    } catch (error) {
        console.error('[Reports API Error]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
