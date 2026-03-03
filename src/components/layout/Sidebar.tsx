'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    PlusCircle,
    LogOut,
    DoorClosed,
    ScanLine,
    UserPlus,
    ListChecks,
    History
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Role } from '@/generated/prisma/client';

// Map roles to their available navigation links
const getNavLinks = (role: Role) => {
    const links = [];

    switch (role) {
        case 'EMPLOYEE':
            links.push(
                { title: 'Dashboard', href: '/employee', icon: LayoutDashboard },
                { title: 'My Passes', href: '/employee/passes', icon: FileText },
                { title: 'Create Pass', href: '/employee/passes/new', icon: PlusCircle }
            );
            break;
        case 'STUDENT':
            links.push(
                { title: 'Dashboard', href: '/student', icon: LayoutDashboard },
                { title: 'Guest Pass', href: '/student/passes/guest', icon: UserPlus },
                { title: 'Exit Pass', href: '/student/passes/exit', icon: DoorClosed }
            );
            break;
        case 'OFFICIAL':
            links.push(
                { title: 'Dashboard', href: '/official', icon: LayoutDashboard },
                { title: 'My Passes', href: '/official/passes', icon: FileText },
                { title: 'Create Pass', href: '/official/passes/new', icon: PlusCircle }
            );
            break;
        case 'SECURITY':
            links.push(
                { title: 'Dashboard', href: '/security', icon: LayoutDashboard },
                { title: 'Scan QR', href: '/security/scan', icon: ScanLine },
                { title: 'Walk-in Pass', href: '/security/walkin', icon: UserPlus }
            );
            break;
        case 'ADMIN':
            links.push(
                { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
                { title: 'All Passes', href: '/admin/passes', icon: FileText },
                { title: 'Approvals', href: '/admin/approvals', icon: ListChecks },
                { title: 'Scan Logs', href: '/admin/logs', icon: History }
            );
            break;
    }

    return links;
};

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Safe cast since we set it in auth callbacks
    const role = (session?.user as any)?.role as Role | undefined;

    const navLinks = role ? getNavLinks(role) : [];

    return (
        <div className="flex h-full flex-col border-r bg-slate-900 text-slate-100">
            <div className="p-6 flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-100 text-slate-900 rounded-md flex items-center justify-center font-bold">
                    V
                </div>
                <span className="font-semibold text-lg tracking-tight">VMS Portal</span>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'flex items-center space-x-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <link.icon className="h-5 w-5" />
                            <span>{link.title}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
                &copy; {new Date().getFullYear()} IIT Palakkad
            </div>
        </div>
    );
}
