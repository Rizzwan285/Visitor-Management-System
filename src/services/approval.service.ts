import { prisma } from '@/lib/prisma';
import { AuditService } from '@/services/audit.service';
import { EmailService } from '@/services/email.service';
import type {
    ApprovalRequest,
    User,
    VisitorPass,
    ScanLog,
} from '@/generated/prisma/client';

export type ApprovalRequestWithRelations = ApprovalRequest & {
    pass: VisitorPass & {
        createdBy: User;
        hostProfessor: User | null;
        approvalRequest: (ApprovalRequest & {
            approver: User | null;
            requestedBy: User;
        }) | null;
        scanLogs: (ScanLog & { scannedBy: User })[];
    };
    requestedBy: User;
    approver: User | null;
};

export const ApprovalService = {
    /**
     * Returns all pending approval requests visible to a given approver.
     * ADMIN sees all pending requests (approverId can be null or any).
     * Faculty/approver sees only those assigned to them.
     */
    async getPendingApprovals(
        approverId: string,
        isAdmin = false
    ): Promise<ApprovalRequestWithRelations[]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = { status: 'PENDING' };

        if (!isAdmin) {
            where.approverId = approverId;
        }

        return prisma.approvalRequest.findMany({
            where,
            include: {
                pass: {
                    include: {
                        createdBy: true,
                        hostProfessor: true,
                        approvalRequest: {
                            include: { approver: true, requestedBy: true },
                        },
                        scanLogs: { include: { scannedBy: true } },
                    },
                },
                requestedBy: true,
                approver: true,
            },
            orderBy: { createdAt: 'asc' },
        }) as Promise<ApprovalRequestWithRelations[]>;
    },

    /**
     * Approves a student guest pass.
     * Transaction: updates ApprovalRequest (APPROVED) + VisitorPass (ACTIVE).
     * Non-blocking: sends approval email + audit log.
     */
    async approvePass(
        passId: string,
        approverId: string,
        remarks?: string,
        ipAddress?: string
    ): Promise<ApprovalRequestWithRelations> {
        const request = await prisma.approvalRequest.findUnique({
            where: { passId },
            include: { pass: true },
        });

        if (!request) {
            throw new Error('Approval request not found');
        }

        if (request.status !== 'PENDING') {
            throw new Error(
                `Cannot approve a request with status ${request.status}`
            );
        }

        // Transactional update
        await prisma.$transaction([
            prisma.approvalRequest.update({
                where: { passId },
                data: {
                    status: 'APPROVED',
                    approverId,
                    decidedAt: new Date(),
                    remarks: remarks ?? null,
                },
            }),
            prisma.visitorPass.update({
                where: { id: passId },
                data: { status: 'ACTIVE' },
            }),
        ]);

        // Fetch updated request with full relations for email
        const updated = (await prisma.approvalRequest.findUniqueOrThrow({
            where: { passId },
            include: {
                pass: {
                    include: {
                        createdBy: true,
                        hostProfessor: true,
                        approvalRequest: {
                            include: { approver: true, requestedBy: true },
                        },
                        scanLogs: { include: { scannedBy: true } },
                    },
                },
                requestedBy: true,
                approver: true,
            },
        })) as ApprovalRequestWithRelations;

        // Non-blocking: email the student that pass is approved + audit
        void EmailService.sendPassEmail(updated.pass);
        void AuditService.log({
            userId: approverId,
            action: 'PASS_APPROVED',
            entityType: 'VisitorPass',
            entityId: passId,
            changes: { remarks, approverId },
            ipAddress,
        });

        return updated;
    },

    /**
     * Rejects a student guest pass.
     * Transaction: updates ApprovalRequest (REJECTED) + VisitorPass (REJECTED).
     * Non-blocking: audit log.
     */
    async rejectPass(
        passId: string,
        approverId: string,
        remarks: string,
        ipAddress?: string
    ): Promise<ApprovalRequestWithRelations> {
        if (!remarks || remarks.trim().length === 0) {
            throw new Error('Remarks are required when rejecting a pass');
        }

        const request = await prisma.approvalRequest.findUnique({
            where: { passId },
            include: { pass: true },
        });

        if (!request) {
            throw new Error('Approval request not found');
        }

        if (request.status !== 'PENDING') {
            throw new Error(
                `Cannot reject a request with status ${request.status}`
            );
        }

        // Transactional update
        await prisma.$transaction([
            prisma.approvalRequest.update({
                where: { passId },
                data: {
                    status: 'REJECTED',
                    approverId,
                    decidedAt: new Date(),
                    remarks,
                },
            }),
            prisma.visitorPass.update({
                where: { id: passId },
                data: { status: 'REJECTED' },
            }),
        ]);

        const updated = (await prisma.approvalRequest.findUniqueOrThrow({
            where: { passId },
            include: {
                pass: {
                    include: {
                        createdBy: true,
                        hostProfessor: true,
                        approvalRequest: {
                            include: { approver: true, requestedBy: true },
                        },
                        scanLogs: { include: { scannedBy: true } },
                    },
                },
                requestedBy: true,
                approver: true,
            },
        })) as ApprovalRequestWithRelations;

        void AuditService.log({
            userId: approverId,
            action: 'PASS_REJECTED',
            entityType: 'VisitorPass',
            entityId: passId,
            changes: { remarks, approverId },
            ipAddress,
        });

        return updated;
    },
};
