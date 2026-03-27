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
            // Sandbox Resend Override (strictly development mode only)
            const isEmailTestingMode = process.env.EMAIL_TESTING_MODE === 'true';
            const devFallbackEmail = 'student.iitpkd01@gmail.com';
            
            const finalTo = !isEmailTestingMode ? params.to : devFallbackEmail;
            const finalCc = !isEmailTestingMode ? params.cc : (params.cc && params.cc.length > 0 ? [devFallbackEmail] : undefined);
            
            let finalHtml = params.html;

            if (isEmailTestingMode) {
                console.log(`[EmailService] SANDBOX MODE: Rerouting email intended for ${params.to} -> ${devFallbackEmail}`);
                
                const intendedTargetsText = `
                <div style="background-color: #ffebee; border: 1px solid #ffcdd2; color: #c62828; padding: 12px; margin-bottom: 20px; border-radius: 4px; font-family: sans-serif;">
                    <strong>⚠️ DEV SANDBOX INTERCEPTION</strong><br/>
                    <strong>Intended To:</strong> ${params.to}<br/>
                    ${params.cc?.length ? `<strong>Intended CC:</strong> ${params.cc.join(', ')}<br/>` : ''}
                </div>`;
                
                // Inject the header right after the opening body tag if present, otherwise prepend
                if (finalHtml.includes('<body')) {
                    finalHtml = finalHtml.replace(/(<body[^>]*>)/i, `$1${intendedTargetsText}`);
                } else {
                    finalHtml = intendedTargetsText + finalHtml;
                }
            }

            const response = await resend.emails.send({
                from: emailConfig.from,
                to: finalTo,
                cc: finalCc,
                subject: (isEmailTestingMode ? '[SANDBOX] ' : '') + params.subject,
                html: finalHtml,
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
                        qrCodeUrl: `${baseUrl}/api/passes/${pass.id}/qr`,
                        photoUrl: pass.visitorPhotoUrl ? `${baseUrl}/api/passes/${pass.id}/photo` : undefined,
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
                        qrCodeUrl: `${baseUrl}/api/passes/${pass.id}/qr`,
                        photoUrl: pass.visitorPhotoUrl ? `${baseUrl}/api/passes/${pass.id}/photo` : undefined,
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
                        qrCodeUrl: `${baseUrl}/api/passes/${pass.id}/qr`,
                        photoUrl: pass.visitorPhotoUrl ? `${baseUrl}/api/passes/${pass.id}/photo` : undefined,
                    });

                    const cc: string[] = [];
                    if (emailConfig.assistantWardenEmails.length > 0) {
                        cc.push(...emailConfig.assistantWardenEmails);
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
                        qrCodeUrl: `${baseUrl}/api/passes/${pass.id}/qr`,
                        photoUrl: pass.visitorPhotoUrl ? `${baseUrl}/api/passes/${pass.id}/photo` : undefined,
                    });

                    const cc: string[] = [];
                    if (emailConfig.assistantWardenEmails.length > 0) {
                        cc.push(...emailConfig.assistantWardenEmails);
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
     * Forwards a copy of the given pass to the explicitly specified target email.
     */
    async forwardPassEmail(pass: PassWithRelations, targetEmail: string): Promise<void> {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        try {
            if (pass.passType === 'STUDENT_EXIT') {
                const html = renderStudentExitEmail({
                    passNumber: pass.passNumber,
                    studentName: pass.createdBy.name || pass.createdBy.email,
                    hostelName: pass.hostelName || '',
                    purpose: pass.purpose,
                    exitDate: new Date(pass.visitFrom).toLocaleString(),
                    returnDate: new Date(pass.visitTo).toLocaleString(),
                    qrCodeUrl: `${baseUrl}/api/passes/${pass.id}/qr`,
                    photoUrl: pass.visitorPhotoUrl ? `${baseUrl}/api/passes/${pass.id}/photo` : undefined,
                });

                await sendAndLog({
                    passId: pass.id,
                    to: targetEmail,
                    subject: `[FORWARDED] Student Exit Pass — ${pass.passNumber}`,
                    html,
                });
            } else {
                console.warn(`[EmailService] Forwarding for pass type ${pass.passType} is not implemented natively yet.`);
            }
        } catch (err) {
            console.error('[EmailService] forwardPassEmail failed:', err);
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

    /**
     * Specialized notification for Student Exits
     */
    async sendStudentScanNotification(pass: any, scanType: string): Promise<void> {
        try {
            if (emailConfig.assistantWardenEmails.length === 0) return;
            
            const scanDescription = scanType === 'STUDENT_EXIT_OUT' ? 'Exited Campus' : 'Returned to Campus';
            const html = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1a3a6b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">Student Gate Notification - ${scanDescription}</h1>
  </div>
  <div style="border: 1px solid #ddd; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Dear Assistant Warden,</p>
    <p>Student <strong>${pass.visitorName || 'A Student'}</strong> has officially <strong>${scanDescription.toLowerCase()}</strong>.</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; width: 40%; border: 1px solid #e0e0e0;">Pass Number</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${pass.passNumber}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Expected Return</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${new Date(pass.visitTo).toLocaleString()}</td></tr>
    </table>
    <hr style="border-color: #e0e0e0; margin: 24px 0;" />
    <p style="font-size: 12px; color: #999;">Automated notification from IIT Palakkad VMS.</p>
  </div>
</body>
</html>`;

            await sendAndLog({
                passId: pass.id,
                to: emailConfig.assistantWardenEmails[0],
                cc: emailConfig.assistantWardenEmails.slice(1),
                subject: `Student Gate Alert: ${scanDescription} (${pass.passNumber})`,
                html,
            });
        } catch (err) {
            console.error('[EmailService] sendStudentScanNotification failed:', err);
        }
    },
};
