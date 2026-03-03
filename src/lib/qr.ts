import crypto from 'crypto';
import QRCode from 'qrcode';

const SECRET = process.env.QR_HMAC_SECRET!;

export function generateQRPayload(passId: string): string {
    const checksum = crypto
        .createHmac('sha256', SECRET)
        .update(passId)
        .digest('hex')
        .slice(0, 8);
    return `VMS:${passId}:${checksum}`;
}

export function verifyQRPayload(
    payload: string
): { valid: boolean; passId: string | null } {
    const parts = payload.split(':');
    if (parts.length !== 3 || parts[0] !== 'VMS') {
        return { valid: false, passId: null };
    }

    const [, passId, checksum] = parts;
    const expected = crypto
        .createHmac('sha256', SECRET)
        .update(passId)
        .digest('hex')
        .slice(0, 8);

    return {
        valid: checksum === expected,
        passId: checksum === expected ? passId : null,
    };
}

export async function generateQRCodeDataURL(
    payload: string
): Promise<string> {
    return QRCode.toDataURL(payload, { width: 256, margin: 2 });
}
