import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
            {/* Left Panel: Branding (hidden on mobile, shown on large screens) */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-slate-900 text-white p-12">
                <div className="max-w-md text-center space-y-6">
                    <div className="w-32 h-32 bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-8">
                        {/* Placeholder for IIT Palakkad Logo */}
                        <span className="text-4xl font-bold tracking-tighter">VMS</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">
                        IIT Palakkad
                    </h1>
                    <p className="text-xl text-slate-300">
                        Campus Security & Visitor Management System
                    </p>
                    <div className="pt-8 border-t border-slate-800 mt-8">
                        <p className="text-sm text-slate-400">
                            Streamlining campus access, ensuring safety, and managing visitor records effortlessly.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel: Auth Form */}
            <div className="flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16">
                <div className="w-full max-w-[400px] flex flex-col justify-center space-y-6">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
                        <p className="text-sm text-slate-500">
                            Please sign in to your role-based dashboard
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
