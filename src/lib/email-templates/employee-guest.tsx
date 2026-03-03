import * as React from 'react';

interface EmployeeGuestEmailProps {
    pasNumber: string;
    visitorName: string;
    visitorSex: string;
    purpose: string;
    visitFrom: string;
    visitTo: string;
    hostName: string;
    qrCodeUrl?: string;
}

export function EmployeeGuestEmail({
    pasNumber,
    visitorName,
    visitorSex,
    purpose,
    visitFrom,
    visitTo,
    hostName,
    qrCodeUrl,
}: EmployeeGuestEmailProps) {
    return (
        <html>
            <body
                style={{
                    fontFamily: 'Arial, sans-serif',
                    maxWidth: '600px',
                    margin: '0 auto',
                    padding: '20px',
                    color: '#333',
                }}
            >
                <div
                    style={{
                        background: '#1a3a6b',
                        color: 'white',
                        padding: '20px',
                        borderRadius: '8px 8px 0 0',
                    }}
                >
                    <h1 style={{ margin: 0, fontSize: '22px' }}>
                        IIT Palakkad — Visitor Management System
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.8 }}>
                        Employee Guest Pass Issued
                    </p>
                </div>

                <div
                    style={{
                        border: '1px solid #ddd',
                        borderTop: 'none',
                        padding: '24px',
                        borderRadius: '0 0 8px 8px',
                    }}
                >
                    <p>Dear {hostName},</p>
                    <p>
                        A visitor pass has been successfully created for your guest. Please
                        find the details below.
                    </p>

                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            marginTop: '16px',
                        }}
                    >
                        <tbody>
                            {[
                                ['Pass Number', pasNumber],
                                ['Visitor Name', visitorName],
                                ['Sex', visitorSex],
                                ['Purpose', purpose],
                                ['Valid From', visitFrom],
                                ['Valid To', visitTo],
                            ].map(([label, value]) => (
                                <tr key={label}>
                                    <td
                                        style={{
                                            padding: '8px 12px',
                                            background: '#f5f5f5',
                                            fontWeight: 'bold',
                                            width: '40%',
                                            border: '1px solid #e0e0e0',
                                        }}
                                    >
                                        {label}
                                    </td>
                                    <td
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #e0e0e0',
                                        }}
                                    >
                                        {value}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {qrCodeUrl && (
                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <p style={{ fontWeight: 'bold' }}>QR Code for Gate Entry</p>
                            <img
                                src={qrCodeUrl}
                                alt="Visitor Pass QR Code"
                                width={200}
                                height={200}
                                style={{ border: '1px solid #ddd', padding: '8px' }}
                            />
                        </div>
                    )}

                    <p style={{ marginTop: '24px', fontSize: '13px', color: '#666' }}>
                        Please present this QR code (or its printout) at the campus gate.
                        This pass is valid only within the specified date/time range.
                    </p>

                    <hr style={{ borderColor: '#e0e0e0', margin: '24px 0' }} />
                    <p style={{ fontSize: '12px', color: '#999' }}>
                        This is an automated message from the IIT Palakkad Visitor Management
                        System. Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
    );
}

export function renderEmployeeGuestEmail(props: EmployeeGuestEmailProps): string {
    return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1a3a6b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">IIT Palakkad — Visitor Management System</h1>
    <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.8;">Employee Guest Pass Issued</p>
  </div>
  <div style="border: 1px solid #ddd; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Dear ${props.hostName},</p>
    <p>A visitor pass has been successfully created for your guest. Please find the details below.</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; width: 40%; border: 1px solid #e0e0e0;">Pass Number</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.pasNumber}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Visitor Name</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitorName}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Sex</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitorSex}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Purpose</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.purpose}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Valid From</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitFrom}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Valid To</td><td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${props.visitTo}</td></tr>
    </table>
    ${props.qrCodeUrl ? `<div style="margin-top: 24px; text-align: center;"><p style="font-weight: bold;">QR Code for Gate Entry</p><img src="${props.qrCodeUrl}" alt="QR Code" width="200" height="200" style="border: 1px solid #ddd; padding: 8px;" /></div>` : ''}
    <p style="margin-top: 24px; font-size: 13px; color: #666;">Please present this QR code at the campus gate. This pass is valid only within the specified date/time range.</p>
    <hr style="border-color: #e0e0e0; margin: 24px 0;" />
    <p style="font-size: 12px; color: #999;">This is an automated message from the IIT Palakkad Visitor Management System. Please do not reply to this email.</p>
  </div>
</body>
</html>`;
}
