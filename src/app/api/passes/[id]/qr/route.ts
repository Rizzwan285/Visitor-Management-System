import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const passId = (await params).id;
        
        const pass = await prisma.visitorPass.findUnique({
            where: { id: passId },
            select: { qrCodeData: true }
        });

        if (!pass) {
            return new NextResponse('Pass not found', { status: 404 });
        }

        if (!pass.qrCodeData) {
            return new NextResponse('QR code data not found', { status: 404 });
        }

        // Generate PNG buffer
        const buffer = await QRCode.toBuffer(pass.qrCodeData, {
            type: 'png',
            width: 256,
            margin: 2,
        });

        // Set appropriate headers for an image response
        const headers = new Headers();
        headers.set('Content-Type', 'image/png');
        headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('[QR Route Error]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
