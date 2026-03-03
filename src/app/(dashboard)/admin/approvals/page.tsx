'use client';

import { requireRole } from '@/lib/auth-utils';
import { useApprovals } from '@/hooks/usePasses';
import { ApprovalCard } from '@/components/passes/ApprovalCard';
import { ClipboardList } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminApprovalsPage() {
    const { data: approvalsData, isLoading } = useApprovals();

    const approvals = approvalsData?.items || [];

    const pendingApprovals = approvals.filter((a: any) => a.status === 'PENDING');
    const pastApprovals = approvals.filter((a: any) => a.status !== 'PENDING');

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Access Approvals</h1>
                <p className="text-slate-500">Review and authorize pending visitor requests requiring high-level or faculty consent.</p>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="pending">
                        Pending ({pendingApprovals.length})
                    </TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500">Loading requests...</div>
                    ) : pendingApprovals.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-dashed flex flex-col items-center justify-center text-slate-500 space-y-3">
                            <ClipboardList className="h-10 w-10 text-slate-300" />
                            <p>No pending approvals at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingApprovals.map((approval: any) => (
                                <ApprovalCard key={approval.id} approval={approval} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500">Loading history...</div>
                    ) : pastApprovals.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-dashed flex flex-col items-center justify-center text-slate-500 space-y-3">
                            <ClipboardList className="h-10 w-10 text-slate-300" />
                            <p>No past decisions found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                            {pastApprovals.map((approval: any) => (
                                <ApprovalCard key={approval.id} approval={approval} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
