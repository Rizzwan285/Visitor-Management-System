import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/secure-image/[filename]
 * Fetches an image securely from the internal Supabase private bucket.
 * Auth: Requires any valid session.
 */
export const GET = withAuth(async (req: NextRequest, context: { params: Promise<{ filename: string }> }) => {
    try {
        const { filename } = await context.params;
        
        if (!filename) {
            return new NextResponse('Missing filename', { status: 400 });
        }

        const { data, error } = await supabase.storage
            .from('visitor-uploads')
            .download(filename);

        if (error) {
            console.error('[GET /api/secure-image]', error);
            return new NextResponse('File not found', { status: 404 });
        }

        const buffer = await data.arrayBuffer();
        
        // Infer basic content type from extension
        let contentType = 'image/jpeg';
        if (filename.endsWith('.png')) contentType = 'image/png';
        if (filename.endsWith('.webp')) contentType = 'image/webp';

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'private, max-age=86400',
            },
        });
    } catch (err) {
        console.error('[GET /api/secure-image] Server Error', err);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
});
