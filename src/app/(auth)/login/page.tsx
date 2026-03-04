'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Suspense } from 'react';

function LoginForm() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    const error = searchParams.get('error');

    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);

    // Simple state for credentials
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Handle URL errors on mount (e.g. AccessDenied from middleware)
    if (error === 'AccessDenied') {
        // Timeout needed to allow Sonner to mount first
        setTimeout(() => toast.error('You do not have permission to view that page. Please sign in with an authorized account.'), 100);
    }

    async function onGoogleSignIn() {
        setIsGoogleLoading(true);
        try {
            await signIn('google', { callbackUrl });
        } catch (error) {
            toast.error('An error occurred while connecting to Google.');
        } finally {
            setIsGoogleLoading(false); // Only reached if redirect fails
        }
    }

    async function onCredentialsSignIn(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please enter both email and password');
            return;
        }

        setIsCredentialsLoading(true);

        try {
            // NextAuth v5 beta signIn with redirect:false returns undefined,
            // so we call the credentials endpoint directly via fetch.
            const csrfRes = await fetch('/api/auth/csrf');
            const { csrfToken } = await csrfRes.json();

            const res = await fetch('/api/auth/callback/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    csrfToken,
                    email,
                    password,
                }),
                redirect: 'manual', // Don't auto-follow redirects
            });

            // NextAuth returns a redirect (302/307) on success, 401/200-with-error on failure
            if (res.ok || res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
                toast.success('Signed in successfully');
                window.location.href = callbackUrl;
            } else {
                toast.error('Invalid credentials. Please check your email and password.');
            }
        } catch (error) {
            toast.error('Authentication failed. Please try again.');
        } finally {
            setIsCredentialsLoading(false);
        }
    }

    return (
        <div className="grid gap-6">
            {/* Google OAuth Button */}
            <Button
                variant="outline"
                type="button"
                disabled={isGoogleLoading || isCredentialsLoading}
                onClick={onGoogleSignIn}
                className="w-full h-12 text-base font-normal flex items-center justify-center gap-2"
            >
                {isGoogleLoading ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                        <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                )}
                Sign in with Google
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50 px-2 text-slate-500">
                        For Security Staff
                    </span>
                </div>
            </div>

            {/* Security Staff Credentials Form */}
            {!showCredentials ? (
                <Button
                    variant="secondary"
                    className="w-full h-12"
                    onClick={() => setShowCredentials(true)}
                >
                    Use Email & Password
                </Button>
            ) : (
                <Card className="border-slate-200">
                    <CardContent className="pt-6">
                        <form onSubmit={onCredentialsSignIn} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="security@vms.local"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isCredentialsLoading || isGoogleLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isCredentialsLoading || isGoogleLoading}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isCredentialsLoading || isGoogleLoading}
                            >
                                {isCredentialsLoading ? (
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                ) : null}
                                Sign In
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading secure sign in...</div>}>
            <LoginForm />
        </Suspense>
    );
}
