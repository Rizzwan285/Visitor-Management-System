import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/types/api.types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Unauthorized'), { status: 401 });
        }

        // Only explicitly allow Assistant Wardens
        if ((session.user as any).role !== 'ASSISTANT_WARDEN') {
            return NextResponse.json(errorResponse('FORBIDDEN', 'Forbidden: Warden access only'), { status: 403 });
        }

        // Fetch exclusively Student Guests and Student Exits for Monitoring
        const passes = await prisma.visitorPass.findMany({
            where: {
                passType: {
                    in: ['STUDENT_GUEST', 'STUDENT_EXIT'],
                },
            },
            include: {
                createdBy: {
                    select: { name: true, email: true },
                },
                hostProfessor: {
                    select: { name: true, email: true, department: true },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(successResponse({ passes }));
    } catch (error) {
        console.error('[WardenPasses API] GET Error:', error);
        return NextResponse.json(errorResponse('INTERNAL_ERROR', 'Internal server error'), { status: 500 });
    }
}
