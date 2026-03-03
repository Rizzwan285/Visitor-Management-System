'use client';

import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity, ActivityItem } from '@/components/dashboard/RecentActivity';
import { FileText, Users, Building, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useDashboard, BaseDashboardStats, DashboardRecentPass } from '@/hooks/useDashboard';
import { formatDistanceToNow } from 'date-fns';

function mapRecentToActivity(recent: DashboardRecentPass[]): ActivityItem[] {
    return recent.map((pass) => ({
        id: pass.id,
        visitorName: pass.visitorName,
        passType: pass.passType,
        status: pass.status as ActivityItem['status'],
        time: formatDistanceToNow(new Date(pass.createdAt), { addSuffix: true }),
        initials: pass.visitorName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
        description: pass.purpose,
    }));
}

export default function OfficialDashboardPage() {
    const { data: dashData, isLoading } = useDashboard();

    const stats = dashData as BaseDashboardStats | undefined;

    const statsCards = [
        { title: 'Active Passes', value: stats?.active ?? '-', icon: FileText, description: 'Currently active' },
        { title: 'Pending', value: stats?.pending ?? '-', icon: AlertCircle },
        { title: 'Total Passes', value: stats?.total ?? '-', icon: Building },
        { title: 'Recent', value: stats?.recent?.length ?? '-', icon: Users },
    ];

    const activityItems = stats?.recent ? mapRecentToActivity(stats.recent) : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Official Dashboard</h1>
                    <p className="text-slate-500">Manage office visitors and appointments.</p>
                </div>
                <Link href="/official/passes/new">
                    <Button>Create Pass</Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <StatsCards stats={statsCards} />
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <RecentActivity items={activityItems} title="Recent Office Passes" />
                </div>
                <div className="lg:col-span-3">
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="font-semibold leading-none tracking-tight mb-4">Quick Links</h3>
                        <div className="space-y-2">
                            <Link href="/official/passes" className="block text-sm text-blue-600 hover:underline">View all my passes</Link>
                            <Link href="/official/passes/new" className="block text-sm text-blue-600 hover:underline">Create a new pass</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
