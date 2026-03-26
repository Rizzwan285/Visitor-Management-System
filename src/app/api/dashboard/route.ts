import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/types/api.types';
import { prisma } from '@/lib/prisma';
import { ScanService } from '@/services/scan.service';
import type { Role } from '@prisma/client';

/**
 * GET /api/dashboard
 * Returns role-scoped statistics for the dashboard.
 * Auth: ALL roles
 */
export const GET = withAuth(async (req) => {
    try {
        const userId = req.auth.user.id;
        const role = req.auth.user.role as Role;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (role === 'SECURITY') {
            // Security dashboard: today's scan counts + recent scans
            const [todayEntries, todayExits, activePasses, recentScans] =
                await Promise.all([
                    prisma.scanLog.count({
                        where: {
                            scanType: 'ENTRY',
                            scannedAt: { gte: today, lt: tomorrow },
                        },
                    }),
                    prisma.scanLog.count({
                        where: {
                            scanType: { in: ['INTERMEDIATE_EXIT', 'FINAL_EXIT'] },
                            scannedAt: { gte: today, lt: tomorrow },
                        },
                    }),
                    prisma.visitorPass.count({
                        where: { status: 'ACTIVE', deletedAt: null },
                    }),
                    ScanService.getRecentScans(10),
                ]);

            return NextResponse.json(
                successResponse({
                    todayEntries,
                    todayExits,
                    activePasses,
                    recentScans,
                }),
                { status: 200 }
            );
        }

        if (role === 'ADMIN') {
            // Admin dashboard: system-wide stats
            const [total, active, pendingApproval, todayScans, recentPasses] =
                await Promise.all([
                    prisma.visitorPass.count({ where: { deletedAt: null } }),
                    prisma.visitorPass.count({
                        where: { status: 'ACTIVE', deletedAt: null },
                    }),
                    prisma.visitorPass.count({
                        where: {
                            status: 'PENDING_APPROVAL',
                            deletedAt: null,
                        },
                    }),
                    prisma.scanLog.count({
                        where: { scannedAt: { gte: today, lt: tomorrow } },
                    }),
                    prisma.visitorPass.findMany({
                        where: { deletedAt: null },
                        include: {
                            createdBy: {
                                select: { id: true, name: true, email: true },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    }),
                ]);

            return NextResponse.json(
                successResponse({
                    total,
                    active,
                    pendingApproval,
                    todayScans,
                    recentPasses,
                }),
                { status: 200 }
            );
        }

        // Employee / Student / Official: personal stats
        const [total, active, pending, recent] = await Promise.all([
            prisma.visitorPass.count({
                where: { createdById: userId, deletedAt: null },
            }),
            prisma.visitorPass.count({
                where: {
                    createdById: userId,
                    status: 'ACTIVE',
                    deletedAt: null,
                },
            }),
            prisma.visitorPass.count({
                where: {
                    createdById: userId,
                    status: 'PENDING_APPROVAL',
                    deletedAt: null,
                },
            }),
            prisma.visitorPass.findMany({
                where: { createdById: userId, deletedAt: null },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    approvalRequest: {
                        select: { status: true, decidedAt: true },
                    },
                },
            }),
        ]);

        return NextResponse.json(
            successResponse({ total, active, pending, recent }),
            { status: 200 }
        );
    } catch (err) {
        console.error('[GET /api/dashboard]', err);
        return NextResponse.json(
            errorResponse('DASHBOARD_ERROR', 'Failed to fetch dashboard stats'),
            { status: 500 }
        );
    }
});
