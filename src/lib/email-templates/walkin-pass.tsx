interface WalkinPassEmailProps {
    passNumber: string;
    visitorName: string;
    visitorSex: string;
    purpose: string;
    visitorMobile: string;
    visitorIdType: string;
    visitorIdNumber: string;
    pointOfContact: string;
    phoneConfirmedBy: string;
    visitFrom: string;
    visitTo: string;
    qrCodeUrl?: string;
}

export function renderWalkinPassEmail(props: WalkinPassEmailProps): string {
    return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1a3a6b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">IIT Palakkad — Visitor Management System</h1>
    <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.8;">Walk-in Visitor Pass</p>
  </div>
  <div style="border: 1px solid #ddd; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>A walk-in visitor pass has been created at the security gate. Details are below.</p>
    <div style="background: #fff7ed; border: 1px solid #f97316; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
      <strong>Note:</strong> Physical signature blocks are included on the printed pass. The visitor must sign in the presence of security personnel.
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; width: 40%; border: 1px solid #e0e0e0;">Pass Number</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.passNumber}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Visitor Name</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitorName}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Sex</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitorSex}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Mobile</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitorMobile}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">ID Type</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitorIdType}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">ID Number</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitorIdNumber}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Point of Contact</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.pointOfContact}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Phone Confirmed By</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.phoneConfirmedBy}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Purpose</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.purpose}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Valid From</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitFrom}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Valid To</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitTo}</td></tr>
    </table>
    ${props.qrCodeUrl ? `<div style="margin-top: 24px; text-align: center;"><p style="font-weight: bold;">QR Code</p><img src="${props.qrCodeUrl}" alt="QR Code" width="200" height="200" style="border: 1px solid #ddd; padding: 8px;" /></div>` : ''}
    <hr style="border-color: #e0e0e0; margin: 24px 0;" />
    <p style="font-size: 12px; color: #999;">This is an automated message from the IIT Palakkad Visitor Management System. Please do not reply to this email.</p>
  </div>
</body>
</html>`;
}
