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
        ipAddress?: string,
        deviationReason?: string
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
        let isOutOfTime = false;
        let timeDeviationType: string | null = null;
        
        if (now > pass.visitTo) {
            isOutOfTime = true;
            timeDeviationType = 'LATE';
        } else if (now < pass.visitFrom) {
            isOutOfTime = true;
            timeDeviationType = 'EARLY';
        }

        const lastLog = pass.scanLogs[0];
        if (lastLog) {
            // Debounce: 1 second
            if (now.getTime() - lastLog.scannedAt.getTime() < 1000) {
                throw new Error('Scan debounce active. Please wait 1 second before scanning again.');
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

        // STRICT SEQUENCE VALIDATION FOR EXITS
        if (finalScanType === 'ENTRY') {
            if (lastLog && lastLog.scanType !== 'FINAL_EXIT') {
                throw new Error('Visitor is already inside. Cannot log another entry.');
            }
        } else if (finalScanType === 'STUDENT_EXIT_OUT') {
            if (lastLog?.scanType === 'STUDENT_EXIT_OUT') {
                throw new Error('Cannot exit. Student has not returned from previous exit.');
            }
        } else if (finalScanType === 'STUDENT_EXIT_RETURN') {
            if (lastLog?.scanType !== 'STUDENT_EXIT_OUT') {
                 throw new Error('Cannot return. Student has not logged an exit.');
            }
        } else if (finalScanType === 'INTERMEDIATE_ENTRY') {
            if (lastLog?.scanType !== 'INTERMEDIATE_EXIT') {
                throw new Error('Cannot log intermediate entry. Visitor has not logged an intermediate exit.');
            }
        } else if (finalScanType === 'INTERMEDIATE_EXIT') {
            if (lastLog?.scanType === 'INTERMEDIATE_EXIT') {
                throw new Error('Cannot log intermediate exit. Visitor is already checked out.');
            }
        } else if (finalScanType === 'FINAL_EXIT') {
            if (lastLog?.scanType === 'INTERMEDIATE_EXIT') {
                throw new Error('Cannot log final exit. Visitor must return from intermediate exit first.');
            }
        }

        const scanLog = (await prisma.scanLog.create({
            data: {
                passId,
                scannedById: securityId,
                scanType: finalScanType as ScanType,
                gateLocation: gateLocation ?? null,
                notes: notes ?? null,
                isOutOfTime,
                timeDeviationType,
                deviationReason: deviationReason ?? null
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
