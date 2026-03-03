import { requireRole } from '@/lib/auth-utils';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { FileText, Users, Building, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function OfficialDashboardPage() {
    await requireRole(['OFFICIAL', 'ADMIN']);

    const mockStats = [
        { title: 'Office Passes', value: '18', icon: FileText, description: 'Active today' },
        { title: 'Walk-ins to Office', value: '4', icon: Users, trend: { value: 2, label: 'vs yesterday', positive: false } },
        { title: 'Appointments', value: '12', icon: Building },
        { title: 'Pending Actions', value: '0', icon: AlertCircle },
    ];

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

            <StatsCards stats={mockStats} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <RecentActivity items={[]} title="Recent Office Passes" />
                </div>
            </div>
        </div>
    );
}
