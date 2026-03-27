import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/types/api.types';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/email.service';

/**
 * POST /api/passes/[id]/forward
 * Forwards a copy of a pass (specifically Student Exits) to a target email.
 */
export const POST = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const { id } = await params;
        const body = await req.json();
        const { email } = body;

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                errorResponse('VALIDATION_ERROR', 'A valid destination email is required.'),
                { status: 400 }
            );
        }

        const pass = await prisma.visitorPass.findUnique({
            where: { id },
            include: { hostProfessor: true, createdBy: true },
        });

        if (!pass) {
            return NextResponse.json(
                errorResponse('NOT_FOUND', 'Pass not found'),
                { status: 404 }
            );
        }

        // We specifically check if it's a student exit pass, though technically it could be opened up
        if (pass.passType !== 'STUDENT_EXIT') {
            return NextResponse.json(
                errorResponse('INVALID_OPERATION', 'Only Student Exit passes support manual forwarding currently.'),
                { status: 400 }
            );
        }

        // Delegate explicitly to the Email Service
        await EmailService.forwardPassEmail(pass as any, email);

        return NextResponse.json(
            successResponse({ forwardedTo: email }),
            { status: 200 }
        );
    } catch (err: any) {
        console.error('[POST /api/passes/[id]/forward]', err);
        return NextResponse.json(
            errorResponse('FORWARD_ERROR', 'Failed to forward the pass email.'),
            { status: 500 }
        );
    }
});
