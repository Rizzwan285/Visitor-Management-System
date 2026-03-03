import { requireRole } from '@/lib/auth-utils';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { FileText, Users, Clock, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function StudentDashboardPage() {
    await requireRole(['STUDENT', 'ADMIN']);

    // Mock data mapping UI
    const mockStats = [
        { title: 'Active Guest Passes', value: '0', icon: Users, description: 'No active guests' },
        { title: 'Pending Approval', value: '1', icon: Clock, description: 'Waiting for faculty' },
        { title: 'Recent Exits', value: '2', icon: LogOut, description: 'This month' },
        { title: 'Total Passes', value: '14', icon: FileText },
    ];

    const mockActivity = [
        { id: '1', visitorName: 'Michael Brown (Father)', passType: 'STUDENT_GUEST', status: 'PENDING_APPROVAL' as const, time: '4h ago', initials: 'MB', description: 'Campus visit' },
        { id: '2', visitorName: 'Self', passType: 'STUDENT_EXIT', status: 'EXPIRED' as const, time: '1w ago', initials: 'S', description: 'Weekend trip home' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
                    <p className="text-slate-500">Request guest passes or out-passes.</p>
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

            <StatsCards stats={mockStats} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <RecentActivity items={mockActivity} title="My Requests" />
                </div>
            </div>
        </div>
    );
}
