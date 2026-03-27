'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { VisitorPassWithDetails } from '@/hooks/usePasses';
import { PassCard } from '@/components/passes/PassCard';
import Link from 'next/link';
import { FileText, ShieldAlert, Clock } from 'lucide-react';

export default function WardenDashboardPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['warden-passes'],
        queryFn: async () => {
            const response = await api.get<{ passes: VisitorPassWithDetails[] }>('/api/warden/passes');
            return response.passes;
        },
    });

    const passes = data || [];
    
    // Quick Metrics
    const activeExits = passes.filter(p => p.passType === 'STUDENT_EXIT' && p.status === 'ACTIVE').length;
    const pendingGuests = passes.filter(p => p.passType === 'STUDENT_GUEST' && p.status === 'PENDING_APPROVAL').length;
    const totalPasses = passes.length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Assistant Warden Portal</h1>
                    <p className="text-slate-500">Read-only monitoring of Student Exits and Guests.</p>
                </div>
            </div>

            {/* Warden Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <ShieldAlert className="h-4 w-4" /> Active Exits
                    </div>
                    <div className="text-3xl font-bold">{isLoading ? '--' : activeExits}</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Clock className="h-4 w-4" /> Pending Guests
                    </div>
                    <div className="text-3xl font-bold">{isLoading ? '--' : pendingGuests}</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <FileText className="h-4 w-4" /> Total Monitored
                    </div>
                    <div className="text-3xl font-bold">{isLoading ? '--' : totalPasses}</div>
                </div>
            </div>

            {/* Passes List */}
            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">Student Logs</h2>
                </div>
                <div className="p-6">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500">Loading tracking data...</div>
                    ) : isError ? (
                        <div className="p-12 text-center text-red-500">Failed to load passes.</div>
                    ) : passes.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 border border-dashed rounded-xl">
                            No student passes logged yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {passes.map((pass) => (
                                <Link key={pass.id} href={`/warden/passes/${pass.id}`}>
                                    <PassCard pass={pass} />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
