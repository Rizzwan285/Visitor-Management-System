import { prisma } from '@/lib/prisma';
import { generatePassNumber, generateQRPayload, generateQRCodeDataURL } from '@/lib/qr-and-id';
import { createPassSchema } from '@/schemas/pass.schema';
import { AuditService } from '@/services/audit.service';
import { EmailService } from '@/services/email.service';
import { FeatureFlags } from '@/config/feature-flags';
import type {
    VisitorPass,
    Role,
    PassType,
    PassStatus,
    User,
    ApprovalRequest,
    ScanLog,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// ─── Inferred Input Types ───────────────────────────────────────
export type CreatePassInput = {
    passType: PassType;
    visitorName: string;
    visitorSex: 'MALE' | 'FEMALE' | 'OTHER';
    purpose: string;
    visitFrom: string;
    visitTo: string;
    visitorRelation?: string;
    visitorAge?: number;
    visitorMobile?: string;
    visitorIdType?: string;
    visitorIdNumber?: string;
    visitorPhotoUrl?: string;
    pointOfContact?: string;
    pocMobile?: string;
    phoneConfirmedBy?: string;
    hostelName?: string;
    approverId?: string;
};

export type UpdatePassInput = {
    visitorName?: string;
    visitorSex?: 'MALE' | 'FEMALE' | 'OTHER';
    purpose?: string;
    visitFrom?: string;
    visitTo?: string;
    visitorRelation?: string;
    visitorAge?: number;
    visitorMobile?: string;
    pointOfContact?: string;
    hostelName?: string;
};

export type PassFilters = {
    passType?: PassType;
    status?: PassStatus;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
};

// Full pass with all relations
export type PassWithRelations = VisitorPass & {
    createdBy: User;
    hostProfessor: User | null;
    approvalRequest:
        | (ApprovalRequest & {
              approver: User | null;
              requestedBy: User;
          })
        | null;
    scanLogs: (ScanLog & { scannedBy: User })[];
};

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Determines whether a pass type requires approval based on feature flags.
 */
function requiresApproval(passType: PassType): boolean {
    switch (passType) {
        case 'STUDENT_GUEST':
            return FeatureFlags.approvalRequiredStudentGuest;
        case 'EMPLOYEE_GUEST':
            return FeatureFlags.approvalRequiredEmployeeGuest;
        case 'OFFICIAL':
            return FeatureFlags.approvalRequiredOfficial;
        default:
            return false;
    }
}

/**
 * Determines the initial status for a newly created pass.
 */
function initialPassStatus(passType: PassType): PassStatus {
    if (requiresApproval(passType)) return 'PENDING_APPROVAL';

    // STUDENT_GUEST always requires approval per the spec
    if (passType === 'STUDENT_GUEST') return 'PENDING_APPROVAL';

    return 'ACTIVE';
}

// ─── Pass Service ───────────────────────────────────────────────

export const PassService = {
    /**
     * Creates a new visitor pass.
     * For STUDENT_GUEST: wraps VisitorPass + ApprovalRequest in a DB transaction.
     * For all others: creates pass and sets status to ACTIVE.
     * Non-blocking: sends email and writes audit log after creation.
     */
    async createPass(
        data: CreatePassInput,
        userId: string,
        ipAddress?: string
    ): Promise<PassWithRelations> {
        // Validate using Zod schema
        const parsed = createPassSchema.parse(data);

        const passId = uuidv4();
        const passNumber = generatePassNumber();
        const qrPayload = generateQRPayload(passId);
        const qrCodeUrl = await generateQRCodeDataURL(qrPayload);

        const needsApproval =
            parsed.passType === 'STUDENT_GUEST' || requiresApproval(parsed.passType as PassType);

        const status: PassStatus = needsApproval ? 'PENDING_APPROVAL' : 'ACTIVE';

        let pass: PassWithRelations;

        if (parsed.passType === 'STUDENT_GUEST') {
            // Transactional: create pass + approval request atomically
            pass = await prisma.$transaction(async (tx) => {
                const created = await tx.visitorPass.create({
                    data: {
                        id: passId,
                        passNumber,
                        passType: parsed.passType as PassType,
                        status,
                        createdById: userId,
                        visitorName: parsed.visitorName,
                        visitorSex: parsed.visitorSex,
                        purpose: parsed.purpose,
                        visitFrom: new Date(parsed.visitFrom),
                        visitTo: new Date(parsed.visitTo),
                        visitorRelation: (parsed as { visitorRelation?: string }).visitorRelation ?? null,
                        visitorAge: (parsed as { visitorAge?: number }).visitorAge ?? null,
                        approvalRequired: true,
                        hostProfessorId: (parsed as { approverId?: string }).approverId ?? null,
                        qrCodeData: qrPayload,
                        qrCodeUrl,
                    },
                    include: {
                        createdBy: true,
                        hostProfessor: true,
                        approvalRequest: {
                            include: { approver: true, requestedBy: true },
                        },
                        scanLogs: { include: { scannedBy: true } },
                    },
                });

                // Create the approval request
                await tx.approvalRequest.create({
                    data: {
                        passId: created.id,
                        requestedById: userId,
                        approverId: (parsed as { approverId?: string }).approverId ?? null,
                        status: 'PENDING',
                    },
                });

                // Re-fetch with approval request included
                return tx.visitorPass.findUniqueOrThrow({
                    where: { id: created.id },
                    include: {
                        createdBy: true,
                        hostProfessor: true,
                        approvalRequest: {
                            include: { approver: true, requestedBy: true },
                        },
                        scanLogs: { include: { scannedBy: true } },
                    },
                }) as Promise<PassWithRelations>;
            });
        } else {
            // Non-student-guest: simple create
            const walkinData =
                parsed.passType === 'WALKIN'
                    ? {
                          visitorMobile: (parsed as { visitorMobile?: string }).visitorMobile ?? null,
                          visitorAge: (parsed as { visitorAge?: number }).visitorAge ?? null,
                          visitorIdType: (parsed as { visitorIdType?: string }).visitorIdType ?? null,
                          visitorIdNumber: (parsed as { visitorIdNumber?: string }).visitorIdNumber ?? null,
                          visitorPhotoUrl: (parsed as { visitorPhotoUrl?: string }).visitorPhotoUrl ?? null,
                          pointOfContact: (parsed as { pointOfContact?: string }).pointOfContact ?? null,
                          pocMobile: (parsed as { pocMobile?: string }).pocMobile ?? null,
                          phoneConfirmedBy: (parsed as { phoneConfirmedBy?: string }).phoneConfirmedBy ?? null,
                          visitorSignatureUrl: (parsed as { visitorSignatureUrl?: string }).visitorSignatureUrl ?? null,
                          securitySignatureUrl: (parsed as { securitySignatureUrl?: string }).securitySignatureUrl ?? null,
                          hostSignatureUrl: (parsed as { hostSignatureUrl?: string }).hostSignatureUrl ?? null,
                      }
                    : {};

            const exitData =
                parsed.passType === 'STUDENT_EXIT'
                    ? {
                          hostelName: (parsed as { hostelName?: string }).hostelName ?? null,
                      }
                    : {};

            pass = (await prisma.visitorPass.create({
                data: {
                    id: passId,
                    passNumber,
                    passType: parsed.passType as PassType,
                    status,
                    createdById: userId,
                    visitorName: parsed.visitorName,
                    visitorSex: parsed.visitorSex,
                    purpose: parsed.purpose,
                    visitFrom: new Date(parsed.visitFrom),
                    visitTo: new Date(parsed.visitTo),
                    approvalRequired: needsApproval,
                    qrCodeData: qrPayload,
                    qrCodeUrl,
                    ...walkinData,
                    ...exitData,
                },
                include: {
                    createdBy: true,
                    hostProfessor: true,
                    approvalRequest: {
                        include: { approver: true, requestedBy: true },
                    },
                    scanLogs: { include: { scannedBy: true } },
                },
            })) as PassWithRelations;
        }

        // Non-blocking: send email + audit
        void AuditService.log({
            userId,
            action: 'PASS_CREATED',
            entityType: 'VisitorPass',
            entityId: pass.id,
            changes: { passType: pass.passType, status: pass.status },
            ipAddress,
        });

        void EmailService.sendPassEmail(pass);

        // If student guest, also send approval request email
        if (
            pass.passType === 'STUDENT_GUEST' &&
            pass.approvalRequest
        ) {
            const approvalRequest = pass.approvalRequest;
            if (approvalRequest.approver) {
                void EmailService.sendApprovalRequestEmail({
                    ...approvalRequest,
                    pass,
                    requestedBy: pass.createdBy,
                    approver: approvalRequest.approver,
                });
            }
        }

        return pass;
    },

    /**
     * Fetches a pass by ID with all relations.
     */
    async getPassById(id: string): Promise<PassWithRelations | null> {
        return prisma.visitorPass.findFirst({
            where: { id, deletedAt: null },
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
        }) as Promise<PassWithRelations | null>;
    },

    /**
     * Lists passes with role-based scoping and optional filters.
     * Returns paginated results.
     */
    async listPasses(
        filters: PassFilters,
        userId: string,
        role: Role,
        page = 1,
        limit = 20
    ) {
        const { passType, status, search, dateFrom, dateTo } = filters;

        // Build base where clause scoped to role
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const baseWhere: Record<string, any> = { deletedAt: null };

        if (role === 'EMPLOYEE' || role === 'STUDENT' || role === 'OFFICIAL') {
            baseWhere.createdById = userId;
        } else if (role === 'SECURITY') {
            baseWhere.status = 'ACTIVE';
        } else if (role === 'ASSISTANT_WARDEN') {
            baseWhere.passType = { in: ['STUDENT_GUEST', 'STUDENT_EXIT'] };
        }
        // ADMIN: no extra scope — sees all passes

        // Apply filters
        if (passType) baseWhere.passType = passType;
        if (status && role !== 'SECURITY') baseWhere.status = status; // security always sees ACTIVE
        if (search) {
            baseWhere.visitorName = { contains: search, mode: 'insensitive' };
        }
        if (dateFrom || dateTo) {
            baseWhere.visitFrom = {};
            if (dateFrom) baseWhere.visitFrom.gte = new Date(dateFrom);
            if (dateTo) baseWhere.visitFrom.lte = new Date(dateTo);
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.visitorPass.findMany({
                where: baseWhere,
                include: {
                    createdBy: true,
                    hostProfessor: true,
                    approvalRequest: {
                        include: { approver: true, requestedBy: true },
                    },
                    scanLogs: {
                        include: { scannedBy: true },
                        orderBy: { scannedAt: 'desc' },
                        take: 1, // Only last scan in list view
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.visitorPass.count({ where: baseWhere }),
        ]);

        return {
            data: data as PassWithRelations[],
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    /**
     * Updates a pass. Only allowed when status is DRAFT or ACTIVE and caller owns it (or is ADMIN).
     */
    async updatePass(
        id: string,
        data: UpdatePassInput,
        userId: string,
        userRole: Role,
        ipAddress?: string
    ): Promise<PassWithRelations> {
        const existing = await prisma.visitorPass.findFirst({
            where: { id, deletedAt: null },
        });

        if (!existing) {
            throw new Error('Pass not found');
        }

        if (userRole !== 'ADMIN' && existing.createdById !== userId) {
            throw new Error('You do not have permission to update this pass');
        }

        if (!['DRAFT', 'ACTIVE'].includes(existing.status)) {
            throw new Error(
                `Cannot update a pass with status ${existing.status}`
            );
        }

        const updated = (await prisma.visitorPass.update({
            where: { id },
            data: {
                visitorName: data.visitorName,
                visitorSex: data.visitorSex,
                purpose: data.purpose,
                visitFrom: data.visitFrom ? new Date(data.visitFrom) : undefined,
                visitTo: data.visitTo ? new Date(data.visitTo) : undefined,
                visitorRelation: data.visitorRelation,
                visitorAge: data.visitorAge,
                visitorMobile: data.visitorMobile,
                pointOfContact: data.pointOfContact,
                hostelName: data.hostelName,
            },
            include: {
                createdBy: true,
                hostProfessor: true,
                approvalRequest: {
                    include: { approver: true, requestedBy: true },
                },
                scanLogs: { include: { scannedBy: true } },
            },
        })) as PassWithRelations;

        void AuditService.log({
            userId,
            action: 'PASS_UPDATED',
            entityType: 'VisitorPass',
            entityId: id,
            changes: data as Record<string, unknown>,
            ipAddress,
        });

        return updated;
    },

    /**
     * Soft-deletes a pass (sets deletedAt + status = CANCELLED).
     */
    async cancelPass(
        id: string,
        userId: string,
        userRole: Role,
        ipAddress?: string
    ): Promise<VisitorPass> {
        const existing = await prisma.visitorPass.findFirst({
            where: { id, deletedAt: null },
        });

        if (!existing) {
            throw new Error('Pass not found');
        }

        if (userRole !== 'ADMIN' && existing.createdById !== userId) {
            throw new Error('You do not have permission to cancel this pass');
        }

        const cancelled = await prisma.visitorPass.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                deletedAt: new Date(),
            },
        });

        void AuditService.log({
            userId,
            action: 'PASS_CANCELLED',
            entityType: 'VisitorPass',
            entityId: id,
            ipAddress,
        });

        return cancelled;
    },
};
