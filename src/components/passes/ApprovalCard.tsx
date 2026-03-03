import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useApprovals } from '@/hooks/usePasses';
import { toast } from 'sonner';
import { User, Check, X } from 'lucide-react';

// Using loosely combined types here since the strict backend schemas might still be evolving
export function ApprovalCard({ approval }: { approval: any }) {
    const { respondToApproval } = useApprovals();

    const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
        try {
            await respondToApproval.mutateAsync({
                approvalId: approval.id,
                status,
                remarks: status === 'REJECTED' ? 'Rejected via dashboard' : 'Approved via dashboard',
            });
            toast.success(`Pass ${status.toLowerCase()} successfully`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to update approval status');
        }
    };

    const pass = approval.pass;

    return (
        <Card className="border-slate-200">
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg leading-none mb-1">{pass.visitorName}</h4>
                            <p className="text-sm font-medium text-slate-500">{pass.passType.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <Badge variant={approval.status === 'PENDING' ? 'secondary' : approval.status === 'APPROVED' ? 'default' : 'destructive'}>
                        {approval.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-6 border-t border-b py-4 border-slate-100">
                    <div>
                        <span className="block text-slate-400 font-medium text-xs uppercase relative mb-1">Requested By</span>
                        <span className="font-semibold">{approval.requestedBy?.name || 'Unknown'}</span>
                    </div>
                    <div>
                        <span className="block text-slate-400 font-medium text-xs uppercase relative mb-1">Purpose</span>
                        <span>{pass.purpose}</span>
                    </div>

                    <div className="col-span-2">
                        <span className="block text-slate-400 font-medium text-xs uppercase relative mb-1">Visit Schedule</span>
                        <span className="font-medium text-slate-700">
                            {format(new Date(pass.visitFrom), 'MMM d, h:mm a')} — {format(new Date(pass.visitTo), 'MMM d, h:mm a')}
                        </span>
                    </div>
                </div>

                {approval.status === 'PENDING' ? (
                    <div className="flex gap-3">
                        <Button onClick={() => handleAction('APPROVED')} className="flex-1 bg-green-600 hover:bg-green-700 gap-2" disabled={respondToApproval.isPending}>
                            <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button onClick={() => handleAction('REJECTED')} variant="destructive" className="flex-1 gap-2" disabled={respondToApproval.isPending}>
                            <X className="h-4 w-4" /> Reject
                        </Button>
                    </div>
                ) : (
                    <div className="text-sm text-slate-500 italic">
                        Decision made on {format(new Date(approval.decidedAt || new Date()), 'MMM d, yyyy')}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
