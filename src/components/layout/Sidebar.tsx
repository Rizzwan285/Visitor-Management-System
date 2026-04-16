'use client';
import { useState, useEffect } from 'react';

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
    History,
    BarChart3,
    Menu
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Role } from '@prisma/client';

// Map roles to their available navigation links
const getNavLinks = (role: Role) => {
    const links = [];

    switch (role as string) {
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
        case 'OIC_STUDENT_SECTION':
            links.push(
                { title: 'Dashboard', href: '/oic', icon: LayoutDashboard }
            );
            break;
        case 'ASSISTANT_WARDEN':
            links.push(
                { title: 'Dashboard', href: '/warden', icon: LayoutDashboard }
            );
            break;
        case 'ADMIN':
            links.push(
                { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
                { title: 'All Passes', href: '/admin/passes', icon: FileText },
                { title: 'Approvals', href: '/admin/approvals', icon: ListChecks },
                { title: 'Scan Logs', href: '/admin/logs', icon: History },
                { title: 'Reports', href: '/admin/reports', icon: BarChart3 }
            );
            break;
    }

    return links;
};

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('sidebar_collapsed');
        if (saved) setIsCollapsed(JSON.parse(saved));
    }, []);

    const toggleSidebar = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('sidebar_collapsed', JSON.stringify(next));
            return next;
        });
    };

    // Safe cast since we set it in auth callbacks
    const role = (session?.user as any)?.role as Role | undefined;

    const navLinks = role ? getNavLinks(role) : [];

    return (
        <div className={cn(
            "relative h-screen flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 overflow-hidden",
            isCollapsed ? "w-16" : "w-64"
        )}>
            <div className="px-3 py-4 flex items-center justify-between border-b border-sidebar-border/50 min-h-[73px]">
                {!isCollapsed && (
                    <div className="flex items-center space-x-3 overflow-hidden pl-1">
                        <div className="w-8 h-8 flex-shrink-0 bg-sidebar-primary text-sidebar-primary-foreground rounded-md flex items-center justify-center font-bold">
                            V
                        </div>
                        <span className="font-semibold text-lg tracking-tight whitespace-nowrap">VMS Portal</span>
                    </div>
                )}
                <button 
                    onClick={toggleSidebar} 
                    className={cn(
                        "p-1.5 hover:bg-sidebar-accent/50 rounded-md text-sidebar-foreground",
                        isCollapsed ? "mx-auto" : "ml-auto mr-0.5"
                    )}
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 space-y-2 p-3 overflow-y-auto overflow-x-hidden">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            title={isCollapsed ? link.title : undefined}
                            className={cn(
                                'flex items-center rounded-md text-sm font-medium transition-colors overflow-hidden',
                                isCollapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2.5',
                                isActive
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                            )}
                        >
                            <link.icon className="h-5 w-5 flex-shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">{link.title}</span>}
                        </Link>
                    );
                })}
            </nav>

            {!isCollapsed && (
                <div className="p-4 border-t border-sidebar-border/50 text-xs text-sidebar-foreground/50 whitespace-nowrap">
                    &copy; {new Date().getFullYear()} IIT Palakkad
                </div>
            )}
        </div>
    );
}
