import { requireRole } from '@/lib/auth-utils';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { FileText, ScanLine, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function SecurityDashboardPage() {
    await requireRole(['SECURITY', 'ADMIN']);

    const mockStats = [
        { title: 'Scans Today', value: '142', icon: ScanLine, trend: { value: 12, label: 'vs yesterday', positive: true } },
        { title: 'Walk-ins Created', value: '18', icon: UserPlus },
        { title: 'Active on Campus', value: '45', icon: Users, description: 'Based on un-exited scans' },
        { title: 'Flagged Passes', value: '0', icon: FileText },
    ];

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

            <StatsCards stats={mockStats} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    {/* This would be ScanLogs later */}
                    <RecentActivity items={[]} title="Recent Scans" />
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
