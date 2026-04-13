import { prisma } from '@/lib/prisma';
import { verifyQRPayload } from '@/lib/qr';
import { AuditService } from '@/services/audit.service';
import type {
    ScanLog,
    User,
    VisitorPass,
    ApprovalRequest,
    ScanType,
} from '@prisma/client';
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
        scanType: ScanType | 'STUDENT_EXIT_AUTO',
        gateLocation?: string,
        notes?: string,
        ipAddress?: string
    ): Promise<ScanLogWithRelations> {
        // ENFORCE STATE MACHINE: Backend must independently validate before any action
        const pass = await prisma.visitorPass.findUnique({
            where: { id: passId },
            include: { scanLogs: { orderBy: { scannedAt: 'desc' }, take: 1 } }
        });

        if (!pass) throw new Error('Pass not found');

        if (pass.status !== 'ACTIVE') {
            throw new Error(`Cannot log scan. Pass is already ${pass.status}.`);
        }

        const now = new Date();
        if (now > pass.visitTo) {
            // Auto-expire dynamically right before scanning if time exceeded
            await prisma.visitorPass.update({
                where: { id: passId },
                data: { status: 'EXPIRED' }
            });
            throw new Error('Pass validity period has expired and the pass was automatically closed.');
        }

        if (now < pass.visitFrom) {
            throw new Error('Pass visit window has not started yet.');
        }

        const lastLog = pass.scanLogs[0];
        if (lastLog) {
            // Debounce: 60 seconds
            if (now.getTime() - lastLog.scannedAt.getTime() < 60000) {
                throw new Error('Scan cooldown active. Please wait 60 seconds before scanning again.');
            }
        }

        let finalScanType = scanType;

        if (scanType === 'STUDENT_EXIT_AUTO') {
            if (lastLog?.scanType === 'STUDENT_EXIT_OUT') {
                finalScanType = 'STUDENT_EXIT_RETURN';
            } else {
                finalScanType = 'STUDENT_EXIT_OUT';
            }
        }

        const scanLog = (await prisma.scanLog.create({
            data: {
                passId,
                scannedById: securityId,
                scanType: finalScanType as ScanType,
                gateLocation: gateLocation ?? null,
                notes: notes ?? null,
            },
            include: {
                scannedBy: true,
                pass: true,
            },
        })) as ScanLogWithRelations;

        const typeStr = finalScanType as string;
        if (typeStr === 'FINAL_EXIT') {
            await prisma.visitorPass.update({
                where: { id: passId },
                data: { status: 'EXPIRED' }
            });
            // Also update the in-memory returned pass object so UI reflects it immediately
            scanLog.pass.status = 'EXPIRED';
        } else if (typeStr === 'STUDENT_EXIT_RETURN' || typeStr === 'STUDENT_EXIT_OUT') {
            // Explicitly notify Assistant Wardens of student flow natively triggered from the backend interceptor
            const { EmailService } = require('@/services/email.service');
            void EmailService.sendStudentScanNotification(scanLog.pass, typeStr);
        }

        void AuditService.log({
            userId: securityId,
            action: `SCAN_${finalScanType}`,
            entityType: 'ScanLog',
            entityId: scanLog.id,
            changes: { passId, scanType: finalScanType, gateLocation },
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
