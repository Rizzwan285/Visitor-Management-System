'use client';

import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity, ActivityItem } from '@/components/dashboard/RecentActivity';
import { FileText, Users, Clock, LogOut } from 'lucide-react';
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
        href: `/student/passes/${pass.id}`,
    }));
}

export default function StudentDashboardPage() {
    const { data: dashData, isLoading } = useDashboard();

    const stats = dashData as BaseDashboardStats | undefined;

    const statsCards = [
        { title: 'Active Guest Passes', value: stats?.active ?? '-', icon: Users, description: stats?.active === 0 ? 'No active guests' : undefined },
        { title: 'Pending Approval', value: stats?.pending ?? '-', icon: Clock, description: 'Waiting for faculty' },
        { title: 'Total Passes', value: stats?.total ?? '-', icon: FileText },
        { title: 'Recent', value: stats?.recent?.length ?? '-', icon: LogOut, description: 'Last 5 requests' },
    ];

    const activityItems = stats?.recent ? mapRecentToActivity(stats.recent) : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
                    <p className="text-muted-foreground">Request guest passes or out-passes.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/student/passes/guest">
                        <Button variant="outline">New Guest Pass</Button>
                    </Link>
                    <Link href="/student/passes/exit">
                        <Button>New Exit Pass</Button>
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <StatsCards stats={statsCards} />
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <RecentActivity items={activityItems} title="My Requests" />
                </div>
            </div>
        </div>
    );
}
