'use client';

import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity, ActivityItem } from '@/components/dashboard/RecentActivity';
import { FileText, ScanLine, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useDashboard, useOverstayingAlerts, SecurityDashboardStats, DashboardRecentScan } from '@/hooks/useDashboard';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock } from 'lucide-react';

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
    const { data: overstayingData, isLoading: isLoadingAlerts } = useOverstayingAlerts();

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

            {!isLoadingAlerts && overstayingData && overstayingData.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" /> Active Alerts: Overstaying Visitors
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {overstayingData.map((pass: any) => (
                            <div key={pass.id} className="bg-red-50 border border-red-200 text-red-900 shadow-sm relative overflow-hidden rounded-xl p-4">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <Clock className="w-16 h-16" />
                                </div>
                                <div className="font-bold flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        {pass.visitorName}
                                    </div>
                                    <span className="text-xs font-mono bg-red-100 text-red-800 px-2 py-1 rounded">
                                        {pass.passNumber}
                                    </span>
                                </div>
                                <div className="text-sm space-y-1 relative z-10">
                                    <p><span className="font-semibold">Type:</span> {pass.passType.replace('_', ' ')}</p>
                                    <p><span className="font-semibold">Host:</span> {pass.pointOfContact || 'N/A'}</p>
                                    <p><span className="font-semibold">Expired:</span> {formatDistanceToNow(new Date(pass.visitTo), { addSuffix: true })}</p>
                                    {(pass.visitorMobile || pass.pocMobile) && (
                                        <div className="pt-2 mt-2 border-t border-red-200">
                                            {pass.visitorMobile && <p><span className="font-semibold">Visitor:</span> {pass.visitorMobile}</p>}
                                            {pass.pocMobile && <p><span className="font-semibold">Host:</span> {pass.pocMobile}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
