'use client';

import { useApprovals } from '@/hooks/usePasses';
import { ApprovalCard } from '@/components/passes/ApprovalCard';
import { ClipboardList } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from 'next-auth/react';
import type { VisitorPassWithDetails } from '@/hooks/usePasses';

export default function OicApprovalsPage() {
    const { data: approvalsData, isLoading } = useApprovals();
    const { data: session } = useSession();

    const passes = approvalsData?.items || [];
    const userId = session?.user?.id;

    // Isolate exclusively OIC assignments explicitly assigned out of pool
    const assignedPasses = passes.filter((p: VisitorPassWithDetails) =>
        p.approvalRequest?.approverId === userId
    );

    const pendingPasses = assignedPasses.filter((p: VisitorPassWithDetails) =>
        p.approvalRequest?.status === 'PENDING' || p.status === 'PENDING_APPROVAL'
    );
    const pastPasses = assignedPasses.filter((p: VisitorPassWithDetails) =>
        p.approvalRequest?.status !== 'PENDING' && p.status !== 'PENDING_APPROVAL'
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">OIC Student Section Dashboard</h1>
                <p className="text-slate-500">Review and authorize pending student visitor requests explicitly assigned to you.</p>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="pending">
                        Pending ({pendingPasses.length})
                    </TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500">Loading requests...</div>
                    ) : pendingPasses.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-dashed flex flex-col items-center justify-center text-slate-500 space-y-3">
                            <ClipboardList className="h-10 w-10 text-slate-300" />
                            <p>No pending approvals at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingPasses.map((pass: VisitorPassWithDetails) => (
                                <ApprovalCard key={pass.id} pass={pass} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500">Loading history...</div>
                    ) : pastPasses.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-dashed flex flex-col items-center justify-center text-slate-500 space-y-3">
                            <ClipboardList className="h-10 w-10 text-slate-300" />
                            <p>No past decisions found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                            {pastPasses.map((pass: VisitorPassWithDetails) => (
                                <ApprovalCard key={pass.id} pass={pass} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
