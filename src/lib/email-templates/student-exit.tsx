interface StudentExitEmailProps {
    passNumber: string;
    studentName: string;
    hostelName: string;
    purpose: string;
    exitDate: string;
    returnDate: string;
    qrCodeUrl?: string;
    photoUrl?: string;
}

export function renderStudentExitEmail(props: StudentExitEmailProps): string {
    return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1a3a6b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">IIT Palakkad — Visitor Management System</h1>
    <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.8;">Student Exit Pass</p>
  </div>
  <div style="border: 1px solid #ddd; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Dear ${props.studentName},</p>
    <p>Your exit pass has been issued. Please find the details below. Ensure you return to campus by the return date/time.</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; width: 40%; border: 1px solid #e0e0e0;">Pass Number</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.passNumber}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Student Name</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.studentName}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Hostel</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.hostelName}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Purpose</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.purpose}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Exit Date/Time</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.exitDate}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Return Date/Time</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.returnDate}</td></tr>
    </table>
    <div style="margin-top: 24px; text-align: center;">
      ${props.photoUrl ? `<div style="display: inline-block; margin-right: 20px;"><p style="font-weight: bold;">Student Photo</p><img src="${props.photoUrl}" alt="Photo" width="150" height="150" style="border: 1px solid #ddd; object-fit: cover; border-radius: 8px;" /></div>` : ''}
      ${props.qrCodeUrl ? `<div style="display: inline-block;"><p style="font-weight: bold;">QR Code for Gate Exit/Re-Entry</p><img src="${props.qrCodeUrl}" alt="QR Code" width="150" height="150" style="border: 1px solid #ddd; padding: 8px;" /></div>` : ''}
    </div>
    <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 12px; border-radius: 6px; margin-top: 16px;">
      <strong>Forward this pass:</strong> You can forward this email to additional authorities if required by your hostel warden.
    </div>
    <hr style="border-color: #e0e0e0; margin: 24px 0;" />
    <p style="font-size: 12px; color: #999;">This is an automated message from the IIT Palakkad Visitor Management System. Please do not reply to this email.</p>
  </div>
</body>
</html>`;
}
