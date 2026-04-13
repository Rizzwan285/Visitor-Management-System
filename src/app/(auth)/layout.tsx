import { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
            <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden">

                {/* Branding Header Area - Clean Fedena Style */}
                <div className="bg-card px-8 pt-8 pb-5 flex flex-col items-center justify-center text-center relative border-b border-border">
                    <div className="relative z-10 w-64 h-24 flex items-center justify-center mb-2">
                        <div className="relative w-full h-full flex items-center justify-center">
                            <Image src="/logo.jpg" alt="IIT Palakkad Logo" fill className="object-contain" priority />
                        </div>
                    </div>
                    <h2 className="text-xs sm:text-sm font-medium tracking-wider text-muted-foreground uppercase mt-1">
                        Campus Security & Visitor Management
                    </h2>
                </div>

                {/* Content Area */}
                <div className="p-8 sm:p-10 pt-6">
                    {children}
                </div>

                {/* Footer Area */}
                <div className="bg-background px-8 py-4 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground">
                        Nurturing Minds For a Better World
                    </p>
                </div>
            </div>
        </div>
    );
}
