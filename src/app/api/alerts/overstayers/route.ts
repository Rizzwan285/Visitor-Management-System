import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/alerts/overstayers
 * Returns a list of visitors who are currently on campus but their visit time has expired.
 * 1. Find all passes where visitTo < now and status is still ACTIVE.
 * 2. Filter for those whose last scan was 'ENTRY'.
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || ((session.user as any).role !== 'SECURITY' && (session.user as any).role !== 'ADMIN')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const now = new Date();

        // Find passes that are technically active but conceptually expired
        const overstayingPasses = await prisma.visitorPass.findMany({
            where: {
                status: 'ACTIVE',
                visitTo: {
                    lt: now
                },
                deletedAt: null
            },
            include: {
                createdBy: {
                    select: { name: true, email: true }
                },
                scanLogs: {
                    orderBy: { scannedAt: 'desc' },
                    take: 1
                }
            }
        });

        // Further filter for those who haven't performed a final EXIT yet
        // If the last scan was ENTRY or INTERMEDIATE_EXIT, they are "inside" or "out temporarily" 
        // but if it was ENTRY they are definitely inside.
        // Let's refine: if last scan is ENTRY, they are on campus.
        const filtered = overstayingPasses.filter(pass => {
            const lastScan = pass.scanLogs[0];
            return lastScan && lastScan.scanType === 'ENTRY';
        });

        return NextResponse.json(filtered);
    } catch (error) {
        console.error('[Overstayer Alert API Error]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
