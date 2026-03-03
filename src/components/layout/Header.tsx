'use client';

import { Menu } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useUIStore } from '@/stores/ui.store';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

export function Header() {
    const { data: session } = useSession();
    const { isSidebarOpen, setSidebarOpen } = useUIStore();

    const user = session?.user;
    const role = (user as any)?.role || 'User';
    const initials = user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2)
        : 'U';

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-4 sm:px-6">
            <div className="flex items-center">
                <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden mr-2"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle sidebar</span>
                    </Button>
                    <SheetContent side="left" className="p-0 w-64 border-r-0 bg-slate-900">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <Sidebar />
                    </SheetContent>
                </Sheet>
                <span className="text-lg font-semibold capitalize hidden sm:inline-block">
                    {role.toLowerCase()} Dashboard
                </span>
            </div>

            <div className="flex items-center space-x-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                                <AvatarFallback className="bg-slate-100 text-slate-800">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.name}</p>
                                <p className="text-xs leading-none text-muted-foreground pb-1">
                                    {user?.email}
                                </p>
                                <div className="flex items-center pt-1">
                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                        {role}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                        >
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
