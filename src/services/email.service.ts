import { prisma } from '@/lib/prisma';
import { resend, isEmailConfigured } from '@/lib/email';
import { emailConfig } from '@/config/email-config';
import { renderEmployeeGuestEmail } from '@/lib/email-templates/employee-guest';
import { renderOfficialPassEmail } from '@/lib/email-templates/official-pass';
import { renderStudentGuestEmail } from '@/lib/email-templates/student-guest';
import { renderStudentExitEmail } from '@/lib/email-templates/student-exit';
import { renderApprovalRequestEmail } from '@/lib/email-templates/approval-request';
import type {
    VisitorPass,
    ApprovalRequest,
    User,
    PassType,
    PassStatus,
} from '@prisma/client';

// Full pass with relations needed for email sending
type PassWithRelations = VisitorPass & {
    createdBy: User;
    hostProfessor?: User | null;
    approvalRequest?: (ApprovalRequest & { approver?: User | null }) | null;
};

type ApprovalRequestWithRelations = ApprovalRequest & {
    pass: VisitorPass;
    requestedBy: User;
    approver?: User | null;
};

interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Sends an email and logs the attempt in EmailLog.
 * Never throws — failures are swallowed and logged.
 */
async function sendAndLog(params: {
    passId: string;
    to: string;
    cc?: string[];
    subject: string;
    html: string;
}): Promise<void> {
    let status = 'SENT';
    let errorMessage: string | undefined;
    let result: SendResult = { success: false };

    try {
        if (!isEmailConfigured) {
            // Dev stub — log but don't actually send
            console.log(`[EmailService][STUB] Would send to: ${params.to}, subject: ${params.subject}`);
            result = { success: true, messageId: 'stub' };
        } else {
            // DEV OVERRIDE: Send to verified admin email instead of unverified student email for Resend free tier compatibility
            const devFallbackEmail = 'student.iitpkd01@gmail.com';
            console.log(`[EmailService] DEV MODE: Rerouting email intended for ${params.to} -> ${devFallbackEmail}`);

            const response = await resend.emails.send({
                from: emailConfig.from,
                to: devFallbackEmail,
                cc: params.cc?.length ? [devFallbackEmail] : undefined, // Also overwrite CC to prevent Sandbox rejections on CC array
                subject: params.subject,
                html: params.html,
            });

            if (response.error) {
                status = 'FAILED';
                errorMessage = response.error.message;
                result = { success: false, error: response.error.message };
            } else {
                result = { success: true, messageId: response.data?.id };
            }
        }
    } catch (err) {
        status = 'FAILED';
        errorMessage = err instanceof Error ? err.message : String(err);
        result = { success: false, error: errorMessage };
    }

    // Log attempt — non-blocking
    try {
        await prisma.emailLog.create({
            data: {
                passId: params.passId,
                toAddress: params.to,
                ccAddresses: params.cc ?? [],
                subject: params.subject,
                status,
                errorMessage: errorMessage ?? null,
            },
        });
    } catch (logErr) {
        console.error('[EmailService] Failed to write EmailLog:', logErr);
    }

    if (!result.success) {
        console.error(`[EmailService] Failed to send email to ${params.to}:`, errorMessage);
    }
}

/**
 * EmailService — determines recipients by pass type and sends emails.
 * All operations are non-blocking for the caller.
 */
export const EmailService = {
    /**
     * Sends the appropriate email for a pass after creation or approval.
     * WALKIN passes have no email (physical process).
     */
    async sendPassEmail(pass: PassWithRelations): Promise<void> {
        const type: PassType = pass.passType;
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

        try {
            switch (type) {
                case 'EMPLOYEE_GUEST': {
                    const html = renderEmployeeGuestEmail({
                        pasNumber: pass.passNumber,
                        visitorName: pass.visitorName,
                        visitorSex: pass.visitorSex,
                        purpose: pass.purpose,
                        visitFrom: new Date(pass.visitFrom).toLocaleString(),
                        visitTo: new Date(pass.visitTo).toLocaleString(),
                        hostName: pass.createdBy.name || pass.createdBy.email,
                        qrCodeUrl: pass.qrCodeUrl ?? undefined,
                    });

                    await sendAndLog({
                        passId: pass.id,
                        to: pass.createdBy.email,
                        subject: `Visitor Pass Issued — ${pass.passNumber}`,
                        html,
                    });
                    break;
                }

                case 'OFFICIAL': {
                    const html = renderOfficialPassEmail({
                        passNumber: pass.passNumber,
                        visitorName: pass.visitorName,
                        visitorSex: pass.visitorSex,
                        purpose: pass.purpose,
                        visitFrom: new Date(pass.visitFrom).toLocaleString(),
                        visitTo: new Date(pass.visitTo).toLocaleString(),
                        hostName: pass.createdBy.name || pass.createdBy.email,
                        qrCodeUrl: pass.qrCodeUrl ?? undefined,
                        ccDeptHeads: emailConfig.deptHeadEmails,
                    });

                    await sendAndLog({
                        passId: pass.id,
                        to: pass.createdBy.email,
                        cc: emailConfig.deptHeadEmails.filter(Boolean),
                        subject: `Official Visitor Pass — ${pass.passNumber}`,
                        html,
                    });
                    break;
                }

                case 'STUDENT_GUEST': {
                    const status = pass.status as PassStatus;
                    const html = renderStudentGuestEmail({
                        passNumber: pass.passNumber,
                        studentName: pass.createdBy.name || pass.createdBy.email,
                        visitorName: pass.visitorName,
                        visitorSex: pass.visitorSex,
                        visitorRelation: pass.visitorRelation || '',
                        purpose: pass.purpose,
                        visitFrom: new Date(pass.visitFrom).toLocaleString(),
                        visitTo: new Date(pass.visitTo).toLocaleString(),
                        status: status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'ACTIVE',
                        qrCodeUrl: pass.qrCodeUrl ?? undefined,
                    });

                    const cc: string[] = [];
                    if (emailConfig.assistantWardenEmail) {
                        cc.push(emailConfig.assistantWardenEmail);
                    }

                    await sendAndLog({
                        passId: pass.id,
                        to: pass.createdBy.email,
                        cc,
                        subject: `Student Guest Pass — ${pass.passNumber} [${status === 'PENDING_APPROVAL' ? 'Pending Approval' : 'Approved'}]`,
                        html,
                    });
                    break;
                }

                case 'WALKIN': {
                    // No email for walk-in — physical process handled at gate
                    console.log(`[EmailService] WALKIN pass ${pass.passNumber} — no email sent`);
                    break;
                }

                case 'STUDENT_EXIT': {
                    const html = renderStudentExitEmail({
                        passNumber: pass.passNumber,
                        studentName: pass.createdBy.name || pass.createdBy.email,
                        hostelName: pass.hostelName || '',
                        purpose: pass.purpose,
                        exitDate: new Date(pass.visitFrom).toLocaleString(),
                        returnDate: new Date(pass.visitTo).toLocaleString(),
                        qrCodeUrl: pass.qrCodeUrl ?? undefined,
                    });

                    const cc: string[] = [];
                    if (emailConfig.assistantWardenEmail) {
                        cc.push(emailConfig.assistantWardenEmail);
                    }

                    await sendAndLog({
                        passId: pass.id,
                        to: pass.createdBy.email,
                        cc,
                        subject: `Student Exit Pass — ${pass.passNumber}`,
                        html,
                    });
                    break;
                }

                default:
                    console.warn(`[EmailService] Unknown pass type: ${type}`);
            }
        } catch (err) {
            console.error('[EmailService] sendPassEmail failed:', err);
        }
    },

    /**
     * Sends an approval request notification to the designated approver.
     */
    async sendApprovalRequestEmail(
        request: ApprovalRequestWithRelations
    ): Promise<void> {
        try {
            if (!request.approver) {
                console.warn('[EmailService] Approval request has no approver email');
                return;
            }

            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const approvalUrl = `${baseUrl}/admin/approvals`;

            const html = renderApprovalRequestEmail({
                passNumber: request.pass.passNumber,
                studentName: request.requestedBy.name || request.requestedBy.email,
                visitorName: request.pass.visitorName,
                visitorRelation: request.pass.visitorRelation || '',
                purpose: request.pass.purpose,
                visitFrom: new Date(request.pass.visitFrom).toLocaleString(),
                visitTo: new Date(request.pass.visitTo).toLocaleString(),
                approverName: request.approver.name || request.approver.email,
                approvalUrl,
            });

            await sendAndLog({
                passId: request.passId,
                to: request.approver.email,
                subject: `Approval Required: Student Guest Pass — ${request.pass.passNumber}`,
                html,
            });
        } catch (err) {
            console.error('[EmailService] sendApprovalRequestEmail failed:', err);
        }
    },
};
