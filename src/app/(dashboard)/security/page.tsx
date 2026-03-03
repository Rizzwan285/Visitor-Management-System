'use client';

import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity, ActivityItem } from '@/components/dashboard/RecentActivity';
import { FileText, ScanLine, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useDashboard, SecurityDashboardStats, DashboardRecentScan } from '@/hooks/useDashboard';
import { formatDistanceToNow } from 'date-fns';

function mapScansToActivity(scans: DashboardRecentScan[]): ActivityItem[] {
    return scans.map((scan) => ({
        id: scan.id,
        visitorName: scan.pass.visitorName,
        passType: scan.pass.passType,
        status: 'ACTIVE' as const,
        time: formatDistanceToNow(new Date(scan.scannedAt), { addSuffix: true }),
        initials: scan.pass.visitorName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
        description: `${scan.scanType} at ${scan.gateLocation || 'Main Gate'}`,
    }));
}

export default function SecurityDashboardPage() {
    const { data: dashData, isLoading } = useDashboard();

    const stats = dashData as SecurityDashboardStats | undefined;

    const totalScans = (stats?.todayEntries ?? 0) + (stats?.todayExits ?? 0);

    const statsCards = [
        { title: 'Scans Today', value: totalScans || '-', icon: ScanLine, description: `${stats?.todayEntries ?? 0} entries, ${stats?.todayExits ?? 0} exits` },
        { title: 'Active Passes', value: stats?.activePasses ?? '-', icon: Users, description: 'Currently valid' },
        { title: 'Entries Today', value: stats?.todayEntries ?? '-', icon: UserPlus },
        { title: 'Exits Today', value: stats?.todayExits ?? '-', icon: FileText },
    ];

    const activityItems = stats?.recentScans ? mapScansToActivity(stats.recentScans) : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security Gate</h1>
                    <p className="text-slate-500">Scan QR codes and log walk-in visitors.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/security/walkin">
                        <Button variant="secondary" className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Walk-in Pass
                        </Button>
                    </Link>
                    <Link href="/security/scan">
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                            <ScanLine className="h-4 w-4" />
                            Scan QR
                        </Button>
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
                    <RecentActivity items={activityItems} title="Recent Scans" />
                </div>
                <div className="lg:col-span-3">
                    <div className="rounded-xl border bg-slate-900 text-white shadow p-6 flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[250px]">
                        <ScanLine className="h-16 w-16 text-slate-400" />
                        <h3 className="text-xl font-semibold">Ready to Scan</h3>
                        <p className="text-slate-400 text-sm max-w-xs">
                            Click the Scan QR button above to open the camera and verify passes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
