import { requireRole } from '@/lib/auth-utils';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Activity, Users, CheckSquare, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AdminDashboardPage() {
    await requireRole(['ADMIN']);

    const mockStats = [
        { title: 'Total Active Passes', value: '87', icon: Activity, trend: { value: 5, label: 'vs yesterday', positive: true } },
        { title: 'Pending Approvals', value: '12', icon: CheckSquare, description: 'Requires review' },
        { title: 'Security Scans', value: '342', icon: ShieldAlert, trend: { value: 18, label: 'vs yesterday', positive: true } },
        { title: 'System Users', value: '1.2k', icon: Users },
    ];

    const mockActivity = [
        { id: '1', visitorName: 'Ravi Shankar', passType: 'WALKIN', status: 'ACTIVE' as const, time: '10m ago', initials: 'RS', description: 'Scanned ENTRY at Main Gate' },
        { id: '2', visitorName: 'Lakshmi Kumar', passType: 'STUDENT_GUEST', status: 'PENDING_APPROVAL' as const, time: '12m ago', initials: 'LK', description: 'Student: Arjun Kumar' },
    ];

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

            <StatsCards stats={mockStats} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <RecentActivity items={mockActivity} title="System-wide Activity" />
                </div>
                <div className="lg:col-span-3 space-y-6">
                    {/* Admin specific widgets */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="font-semibold leading-none tracking-tight mb-4">Approval Queue</h3>
                        <p className="text-sm text-slate-500 mb-4">You have 12 guest passes waiting for your approval.</p>
                        <Link href="/admin/approvals">
                            <Button variant="secondary" className="w-full">Review Now</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
