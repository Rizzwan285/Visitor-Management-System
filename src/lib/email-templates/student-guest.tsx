interface StudentGuestEmailProps {
    passNumber: string;
    studentName: string;
    visitorName: string;
    visitorSex: string;
    visitorRelation: string;
    purpose: string;
    visitFrom: string;
    visitTo: string;
    status: 'PENDING_APPROVAL' | 'ACTIVE';
    qrCodeUrl?: string;
    photoUrl?: string;
}

export function renderStudentGuestEmail(props: StudentGuestEmailProps): string {
    const statusBadge =
        props.status === 'PENDING_APPROVAL'
            ? `<span style="background: #f59e0b; color: white; padding: 4px 10px; border-radius: 12px; font-size: 13px;">Pending Approval</span>`
            : `<span style="background: #22c55e; color: white; padding: 4px 10px; border-radius: 12px; font-size: 13px;">Approved — Active</span>`;

    const statusNote =
        props.status === 'PENDING_APPROVAL'
            ? `<div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin-top: 16px;">
          <strong>Note:</strong> This pass is pending faculty/admin approval. You will receive another email once it is approved or rejected. The pass will only be valid at the gate after approval.
        </div>`
            : `<div style="background: #dcfce7; border: 1px solid #22c55e; padding: 12px; border-radius: 6px; margin-top: 16px;">
          <strong>Approved:</strong> This pass has been approved and is now active. Your guest may present the QR code at the gate.
        </div>`;

    return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1a3a6b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">IIT Palakkad — Visitor Management System</h1>
    <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.8;">Student Guest Pass — ${statusBadge}</p>
  </div>
  <div style="border: 1px solid #ddd; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Dear ${props.studentName},</p>
    <p>A guest pass has been submitted for your visitor. Details are below.</p>
    ${statusNote}
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; width: 40%; border: 1px solid #e0e0e0;">Pass Number</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.passNumber}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Visitor Name</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitorName}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Relation</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitorRelation}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Sex</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitorSex}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Purpose</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.purpose}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Valid From</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitFrom}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Valid To</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitTo}</td></tr>
    </table>
    <div style="margin-top: 24px; text-align: center;">
      ${props.photoUrl ? `<div style="display: inline-block; margin-right: 20px;"><p style="font-weight: bold;">Visitor Photo</p><img src="${props.photoUrl}" alt="Photo" width="150" height="150" style="border: 1px solid #ddd; object-fit: cover; border-radius: 8px;" /></div>` : ''}
      ${props.qrCodeUrl && props.status === 'ACTIVE' ? `<div style="display: inline-block;"><p style="font-weight: bold;">QR Code</p><img src="${props.qrCodeUrl}" alt="QR Code" width="150" height="150" style="border: 1px solid #ddd; padding: 8px;" /></div>` : ''}
    </div>
    <hr style="border-color: #e0e0e0; margin: 24px 0;" />
    <p style="font-size: 12px; color: #999;">This is an automated message from the IIT Palakkad Visitor Management System. Please do not reply to this email.</p>
  </div>
</body>
</html>`;
}
