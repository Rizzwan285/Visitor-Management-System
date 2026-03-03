interface ApprovalRequestEmailProps {
    passNumber: string;
    studentName: string;
    visitorName: string;
    visitorRelation: string;
    purpose: string;
    visitFrom: string;
    visitTo: string;
    approverName: string;
    approvalUrl: string;
}

export function renderApprovalRequestEmail(
    props: ApprovalRequestEmailProps
): string {
    return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1a3a6b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">IIT Palakkad — Visitor Management System</h1>
    <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.8;">Student Guest Pass — Approval Required</p>
  </div>
  <div style="border: 1px solid #ddd; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Dear ${props.approverName},</p>
    <p>A student guest pass requires your approval. Please review the details and take action.</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; width: 40%; border: 1px solid #e0e0e0;">Pass Number</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.passNumber}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Student Name</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.studentName}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Visitor Name</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitorName}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Relation</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitorRelation}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Purpose</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.purpose}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Visit From</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitFrom}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Visit To</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitTo}</td></tr>
    </table>
    <div style="margin-top: 24px; text-align: center;">
      <a href="${props.approvalUrl}" style="background: #22c55e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-right: 8px;">
        Review &amp; Approve/Reject
      </a>
    </div>
    <p style="margin-top: 16px; font-size: 13px; color: #666;">
      Click the button above to log in to the admin panel and review this request. You can add remarks when approving or rejecting.
    </p>
    <hr style="border-color: #e0e0e0; margin: 24px 0;" />
    <p style="font-size: 12px; color: #999;">This is an automated message from the IIT Palakkad Visitor Management System. Please do not reply to this email.</p>
  </div>
</body>
</html>`;
}
