import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

// Role-to-route prefix mapping
const ROUTE_ROLE_MAP: Record<string, string[]> = {
    '/employee': ['EMPLOYEE', 'ADMIN'],
    '/student': ['STUDENT', 'ADMIN'],
    '/official': ['OFFICIAL', 'ADMIN'],
    '/security': ['SECURITY', 'ADMIN'],
    '/admin': ['ADMIN'],
};

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const session = req.auth;

    // No session → redirect to login
    if (!session?.user) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const userRole = (session.user as { role?: string }).role ?? '';

    // Check role-based route access
    for (const [prefix, allowedRoles] of Object.entries(ROUTE_ROLE_MAP)) {
        if (pathname.startsWith(prefix)) {
            if (!allowedRoles.includes(userRole)) {
                const loginUrl = new URL('/login', req.url);
                loginUrl.searchParams.set('error', 'AccessDenied');
                return NextResponse.redirect(loginUrl);
            }
            break;
        }
    }

    return NextResponse.next();
}) as (req: NextRequest) => NextResponse;

export const config = {
    matcher: [
        '/employee/:path*',
        '/student/:path*',
        '/official/:path*',
        '/security/:path*',
        '/admin/:path*',
    ],
};
