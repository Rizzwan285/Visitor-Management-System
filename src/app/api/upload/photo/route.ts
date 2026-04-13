import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/types/api.types';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10); // 5MB default
const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * POST /api/upload/photo
 * Upload a walk-in visitor photo.
 * Auth: SECURITY only
 * Returns: { url: '/uploads/<filename>' }
 */
export const POST = withAuth(
    withRole(['SECURITY'], async (req: NextRequest) => {
        try {
            const contentType = req.headers.get('content-type') || '';

            if (!contentType.includes('multipart/form-data')) {
                return NextResponse.json(
                    errorResponse(
                        'VALIDATION_ERROR',
                        'Request must be multipart/form-data'
                    ),
                    { status: 400 }
                );
            }

            const formData = await req.formData();
            const file = formData.get('photo') as File | null;

            if (!file) {
                return NextResponse.json(
                    errorResponse('VALIDATION_ERROR', 'No photo file provided'),
                    { status: 400 }
                );
            }

            // Validate MIME type
            if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                return NextResponse.json(
                    errorResponse(
                        'VALIDATION_ERROR',
                        `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP`
                    ),
                    { status: 400 }
                );
            }

            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    errorResponse(
                        'FILE_TOO_LARGE',
                        `File size ${file.size} bytes exceeds maximum ${MAX_FILE_SIZE} bytes (5MB)`
                    ),
                    { status: 413 }
                );
            }

            // Determine extension from MIME type
            const extMap: Record<string, string> = {
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/webp': '.webp',
            };
            const ext = extMap[file.type] || '.jpg';
            const filename = `${uuidv4()}${ext}`;

            // Upload to Supabase Storage
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const { error } = await supabase.storage
                .from('visitor-uploads')
                .upload(filename, buffer, {
                    contentType: file.type,
                    upsert: false
                });

            if (error) {
                console.error('Supabase upload error:', error);
                throw error;
            }

            const url = `/api/secure-image/${filename}`;

            return NextResponse.json(
                successResponse({ url, filename, size: file.size }),
                { status: 201 }
            );
        } catch (err) {
            console.error('[POST /api/upload/photo]', err);
            return NextResponse.json(
                errorResponse('UPLOAD_ERROR', 'Failed to upload photo'),
                { status: 500 }
            );
        }
    })
);
