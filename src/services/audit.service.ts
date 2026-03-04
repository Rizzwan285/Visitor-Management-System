import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export type AuditAction =
    | 'PASS_CREATED'
    | 'PASS_UPDATED'
    | 'PASS_CANCELLED'
    | 'PASS_APPROVED'
    | 'PASS_REJECTED'
    | 'SCAN_ENTRY'
    | 'SCAN_EXIT'
    | 'USER_LOGIN';

interface LogParams {
    userId?: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    changes?: Record<string, unknown>;
    ipAddress?: string;
}

/**
 * AuditService — writes immutable audit trail records.
 * Never throws: all errors are caught and swallowed so audit failures
 * never break the primary business operation.
 */
export const AuditService = {
    async log(params: LogParams): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: params.userId ?? null,
                    action: params.action,
                    entityType: params.entityType,
                    entityId: params.entityId,
                    // Cast to Prisma's InputJsonValue to satisfy the Json field type
                    changes: params.changes
                        ? (params.changes as Prisma.InputJsonValue)
                        : undefined,
                    ipAddress: params.ipAddress ?? null,
                },
            });
        } catch (err) {
            // Non-blocking — log to console but never propagate
            console.error('[AuditService] Failed to write audit log:', err);
        }
    },
};
