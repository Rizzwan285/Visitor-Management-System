import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import fs from 'fs';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const pass = await prisma.visitorPass.findUnique({
            where: { id: params.id },
            select: { visitorPhotoUrl: true }
        });

        if (!pass || !pass.visitorPhotoUrl) {
            return new NextResponse('Photo not found', { status: 404 });
        }

        // We assume visitorPhotoUrl corresponds to /uploads/... 
        // e.g., /uploads/filename.jpg or raw absolute path.
        let imagePath = pass.visitorPhotoUrl;
        
        // Strip leading slashes to prevent root resolution issues when constructing path
        if (imagePath.startsWith('/')) {
            imagePath = imagePath.slice(1);
        }
        
        const absolutePath = path.join(process.cwd(), 'public', imagePath);
        
        if (!fs.existsSync(absolutePath)) {
            return new NextResponse('File could not be found locally', { status: 404 });
        }

        const imageBuffer = await readFile(absolutePath);
        
        // Very basic mime typing based on rough extension assumption
        let contentType = 'image/jpeg';
        if (absolutePath.toLowerCase().endsWith('.png')) {
            contentType = 'image/png';
        }

        return new NextResponse(imageBuffer, {
            headers: { 
                'Content-Type': contentType, 
                'Cache-Control': 'public, max-age=3600' 
            }
        });
    } catch (error) {
        console.error('[Pass Photo API] Error serving picture bytes', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
