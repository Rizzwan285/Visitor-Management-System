import { prisma } from '@/lib/prisma';
import { verifyQRPayload } from '@/lib/qr';
import { AuditService } from '@/services/audit.service';
import type {
    ScanLog,
    User,
    VisitorPass,
    ApprovalRequest,
    ScanType,
} from '@/generated/prisma/client';
import type { PassWithRelations } from '@/services/pass.service';

export type ScanLogWithRelations = ScanLog & {
    scannedBy: User;
    pass: VisitorPass;
};

export const ScanService = {
    /**
     * Verifies a QR code payload and returns the full pass if valid.
     * Throws descriptive errors for:
     * - Invalid/tampered QR checksum
     * - Pass not found
     * - Pass not ACTIVE
     * - Visit window expired or not yet started
     */
    async verifyAndGetPass(qrPayload: string): Promise<PassWithRelations> {
        const { valid, passId } = verifyQRPayload(qrPayload);

        if (!valid || !passId) {
            throw new Error('Invalid or tampered QR code');
        }

        const pass = (await prisma.visitorPass.findFirst({
            where: { id: passId, deletedAt: null },
            include: {
                createdBy: true,
                hostProfessor: true,
                approvalRequest: {
                    include: { approver: true, requestedBy: true },
                },
                scanLogs: {
                    include: { scannedBy: true },
                    orderBy: { scannedAt: 'desc' },
                },
            },
        })) as PassWithRelations | null;

        if (!pass) {
            throw new Error('Pass not found');
        }

        if (pass.status !== 'ACTIVE') {
            throw new Error(
                `Pass is not active (current status: ${pass.status})`
            );
        }

        const now = new Date();
        if (now < pass.visitFrom) {
            throw new Error(
                `Pass visit window has not started yet (valid from: ${pass.visitFrom.toISOString()})`
            );
        }
        if (now > pass.visitTo) {
            throw new Error(
                `Pass has expired (valid until: ${pass.visitTo.toISOString()})`
            );
        }

        return pass;
    },

    /**
     * Logs a gate scan event (ENTRY or EXIT) for a pass.
     */
    async logScan(
        passId: string,
        securityId: string,
        scanType: ScanType,
        gateLocation?: string,
        notes?: string,
        ipAddress?: string
    ): Promise<ScanLogWithRelations> {
        const scanLog = (await prisma.scanLog.create({
            data: {
                passId,
                scannedById: securityId,
                scanType,
                gateLocation: gateLocation ?? null,
                notes: notes ?? null,
            },
            include: {
                scannedBy: true,
                pass: true,
            },
        })) as ScanLogWithRelations;

        void AuditService.log({
            userId: securityId,
            action: scanType === 'ENTRY' ? 'SCAN_ENTRY' : 'SCAN_EXIT',
            entityType: 'ScanLog',
            entityId: scanLog.id,
            changes: { passId, scanType, gateLocation },
            ipAddress,
        });

        return scanLog;
    },

    /**
     * Returns scan history for a specific pass, ordered by most recent first.
     */
    async getScanHistory(passId: string): Promise<ScanLogWithRelations[]> {
        return prisma.scanLog.findMany({
            where: { passId },
            include: { scannedBy: true, pass: true },
            orderBy: { scannedAt: 'desc' },
        }) as Promise<ScanLogWithRelations[]>;
    },

    /**
     * Returns the N most recent scans across all passes.
     * Used for the security dashboard's "Recent Activity" feed.
     */
    async getRecentScans(limit = 20): Promise<ScanLogWithRelations[]> {
        return prisma.scanLog.findMany({
            include: { scannedBy: true, pass: true },
            orderBy: { scannedAt: 'desc' },
            take: limit,
        }) as Promise<ScanLogWithRelations[]>;
    },
};
