/**
 * Re-exports from qr.ts and id-generator.ts for convenient single-import.
 */
export { generateQRPayload, verifyQRPayload, generateQRCodeDataURL } from '@/lib/qr';
export { generateUniqueId, generatePassNumber } from '@/lib/id-generator';
