import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod/v4';
import { errorResponse } from '@/types/api.types';

type RouteHandler = (
    req: NextRequest,
    context?: { params: Record<string, string> }
) => Promise<NextResponse>;

type AuthenticatedRequest = NextRequest & {
    auth: {
        user: {
            id: string;
            email: string;
            name: string | null;
            role: string;
        };
    };
};

type AuthenticatedHandler = (
    req: AuthenticatedRequest,
    context?: { params: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Wraps a handler to require authentication.
 * Returns 401 if no session is present.
 */
export function withAuth(handler: AuthenticatedHandler): RouteHandler {
    return async (req, context) => {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                errorResponse('UNAUTHORIZED', 'Authentication required'),
                { status: 401 }
            );
        }

        (req as AuthenticatedRequest).auth = {
            user: session.user as AuthenticatedRequest['auth']['user'],
        };

        return handler(req as AuthenticatedRequest, context);
    };
}

/**
 * Wraps a handler to require specific roles.
 * Returns 403 if user role is not in the allowed list.
 * Must be used after withAuth.
 */
export function withRole(
    roles: string[],
    handler: AuthenticatedHandler
): AuthenticatedHandler {
    return async (req, context) => {
        const userRole = req.auth.user.role;

        if (!roles.includes(userRole)) {
            return NextResponse.json(
                errorResponse(
                    'FORBIDDEN',
                    `Access denied. Required roles: ${roles.join(', ')}`
                ),
                { status: 403 }
            );
        }

        return handler(req, context);
    };
}

/**
 * Wraps a handler to validate request body against a Zod schema.
 * Returns 400 with field errors if validation fails.
 */
export function withValidation<T>(
    schema: z.ZodType<T>,
    handler: (
        req: AuthenticatedRequest,
        validatedData: T,
        context?: { params: Record<string, string> }
    ) => Promise<NextResponse>
): AuthenticatedHandler {
    return async (req, context) => {
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                errorResponse('VALIDATION_ERROR', 'Invalid JSON body'),
                { status: 400 }
            );
        }

        const result = schema.safeParse(body);

        if (!result.success) {
            const fieldErrors: Array<{ field: string; message: string }> = [];
            for (const issue of result.error.issues) {
                fieldErrors.push({
                    field: issue.path.map(String).join('.') || 'root',
                    message: issue.message,
                });
            }

            return NextResponse.json(
                errorResponse('VALIDATION_ERROR', 'Validation failed', fieldErrors),
                { status: 400 }
            );
        }

        return handler(req, result.data, context);
    };
}
