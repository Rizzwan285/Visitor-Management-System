import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const pass = await prisma.visitorPass.findUnique({
            where: { id: id },
            select: { visitorPhotoUrl: true }
        });

        if (!pass || !pass.visitorPhotoUrl) {
            return new NextResponse('Photo not found', { status: 404 });
        }

        const photoStr = pass.visitorPhotoUrl;

        // 1) Handle Base64 Data URL (e.g. data:image/png;base64,...)
        if (photoStr.startsWith('data:image/')) {
            const matches = photoStr.match(/^data:(image\/\w+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const contentType = matches[1];
                const base64Data = matches[2];
                const imageBuffer = Buffer.from(base64Data, 'base64');
                
                return new NextResponse(imageBuffer, {
                    headers: { 
                        'Content-Type': contentType, 
                        'Cache-Control': 'public, max-age=3600' 
                    }
                });
            }
        }

        // 2) Fallback to local disk (Legacy uploaded files)
        let imagePath = photoStr;
        if (imagePath.startsWith('/')) {
            imagePath = imagePath.slice(1);
        }
        
        const absolutePath = path.join(process.cwd(), 'public', imagePath);
        
        if (!fs.existsSync(absolutePath)) {
            return new NextResponse('File could not be found locally', { status: 404 });
        }

        const imageBuffer = await readFile(absolutePath);
        
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
