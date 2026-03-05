'use client';

import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity, ActivityItem } from '@/components/dashboard/RecentActivity';
import { Activity, Users, CheckSquare, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useDashboard, AdminDashboardStats, DashboardRecentPass } from '@/hooks/useDashboard';
import { formatDistanceToNow } from 'date-fns';

function mapRecentToActivity(recent: DashboardRecentPass[]): ActivityItem[] {
    return recent.map((pass) => ({
        id: pass.id,
        visitorName: pass.visitorName,
        passType: pass.passType,
        status: pass.status as ActivityItem['status'],
        time: formatDistanceToNow(new Date(pass.createdAt), { addSuffix: true }),
        initials: pass.visitorName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
        description: `${pass.passType.replace('_', ' ')} - ${pass.purpose}`,
        href: `/admin/passes/${pass.id}`,
    }));
}

export default function AdminDashboardPage() {
    const { data: dashData, isLoading } = useDashboard();

    const stats = dashData as AdminDashboardStats | undefined;

    const statsCards = [
        { title: 'Total Active Passes', value: stats?.active ?? '-', icon: Activity },
        { title: 'Pending Approvals', value: stats?.pendingApproval ?? '-', icon: CheckSquare, description: 'Requires review' },
        { title: 'Security Scans Today', value: stats?.todayScans ?? '-', icon: ShieldAlert },
        { title: 'Total Passes', value: stats?.total ?? '-', icon: Users },
    ];

    const activityItems = stats?.recentPasses ? mapRecentToActivity(stats.recentPasses) : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Admin</h1>
                    <p className="text-slate-500">Overview of all campus visitor activity.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/approvals">
                        <Button variant="outline" className="gap-2">
                            <CheckSquare className="h-4 w-4" />
                            Review Approvals
                        </Button>
                    </Link>
                    <Link href="/admin/passes">
                        <Button>View All Passes</Button>
                    </Link>
                </div>
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
                    <RecentActivity items={activityItems} title="System-wide Activity" />
                </div>
                <div className="lg:col-span-3 space-y-6">
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="font-semibold leading-none tracking-tight mb-4">Approval Queue</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            {stats?.pendingApproval
                                ? `You have ${stats.pendingApproval} guest pass${stats.pendingApproval !== 1 ? 'es' : ''} waiting for your approval.`
                                : 'No pending approvals.'}
                        </p>
                        <Link href="/admin/approvals">
                            <Button variant="secondary" className="w-full">Review Now</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
