import { requireRole } from '@/lib/auth-utils';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { FileText, Users, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function EmployeeDashboardPage() {
    await requireRole(['EMPLOYEE', 'ADMIN']);

    // TODO: Replace with real data from React Query / API
    const mockStats = [
        { title: 'Active Passes', value: '4', icon: CheckCircle, description: 'Currently on campus' },
        { title: 'Pending Guests', value: '1', icon: Clock, description: 'Waiting for approval' },
        { title: 'Total Visitors Today', value: '12', icon: Users, trend: { value: 14, label: 'vs yesterday', positive: true } },
        { title: 'Lifetime Passes', value: '143', icon: FileText },
    ];

    const mockActivity = [
        { id: '1', visitorName: 'John Smith', passType: 'EMPLOYEE_GUEST', status: 'ACTIVE' as const, time: '2h ago', initials: 'JS', description: 'Meeting in lab 3' },
        { id: '2', visitorName: 'Alice Johnson', passType: 'EMPLOYEE_GUEST', status: 'PENDING_APPROVAL' as const, time: '3h ago', initials: 'AJ', description: 'Department visit' },
        { id: '3', visitorName: 'Robert Wilson', passType: 'EMPLOYEE_GUEST', status: 'EXPIRED' as const, time: '1d ago', initials: 'RW', description: 'Equipment delivery' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
                    <p className="text-slate-500">Manage your visitor passes and approvals.</p>
                </div>
                <Link href="/employee/passes/new">
                    <Button>Create New Pass</Button>
                </Link>
            </div>

            <StatsCards stats={mockStats} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <RecentActivity items={mockActivity} />
                </div>
                <div className="lg:col-span-3">
                    {/* We'll add a quick actions or info card here later */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="font-semibold leading-none tracking-tight mb-4">Quick Links</h3>
                        <div className="space-y-2">
                            <Link href="/employee/passes" className="block text-sm text-blue-600 hover:underline">View all my passes</Link>
                            <Link href="/employee/passes/new" className="block text-sm text-blue-600 hover:underline">Register a new guest</Link>
                            <Link href="#" className="block text-sm text-blue-600 hover:underline">Review pass policies</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
