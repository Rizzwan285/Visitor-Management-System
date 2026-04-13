import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useApprovals } from '@/hooks/usePasses';
import { toast } from 'sonner';
import { User, Check, X } from 'lucide-react';
import type { VisitorPassWithDetails } from '@/hooks/usePasses';

/**
 * Approval card for the admin approval queue.
 * Receives a VisitorPass with nested approvalRequest.
 */
export function ApprovalCard({ pass }: { pass: VisitorPassWithDetails }) {
    const { respondToApproval } = useApprovals();

    const approvalRequest = pass.approvalRequest;
    const approvalStatus = approvalRequest?.status || 'PENDING';

    const handleAction = async (action: 'APPROVE' | 'REJECT') => {
        try {
            await respondToApproval.mutateAsync({
                passId: pass.id,
                action,
                remarks: action === 'REJECT' ? 'Rejected via dashboard' : 'Approved via dashboard',
            });
            toast.success(`Pass ${action.toLowerCase()}d successfully`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to update approval status');
        }
    };

    return (
        <Card className="border-border">
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg leading-none mb-1">{pass.visitorName}</h4>
                            <p className="text-sm font-medium text-muted-foreground">{pass.passType.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <Badge variant={approvalStatus === 'PENDING' ? 'secondary' : approvalStatus === 'APPROVED' ? 'default' : 'destructive'}>
                        {approvalStatus}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-6 border-t border-b py-4 border-border">
                    <div>
                        <span className="block text-muted-foreground font-medium text-xs uppercase relative mb-1">Requested By</span>
                        <span className="font-semibold">{pass.createdBy?.name || 'Unknown'}</span>
                    </div>
                    <div>
                        <span className="block text-muted-foreground font-medium text-xs uppercase relative mb-1">Purpose</span>
                        <span>{pass.purpose}</span>
                    </div>

                    {pass.visitorRelation && (
                        <div>
                            <span className="block text-muted-foreground font-medium text-xs uppercase relative mb-1">Relation</span>
                            <span>{pass.visitorRelation}</span>
                        </div>
                    )}

                    {pass.visitorAge && (
                        <div>
                            <span className="block text-muted-foreground font-medium text-xs uppercase relative mb-1">Visitor Age</span>
                            <span>{pass.visitorAge}</span>
                        </div>
                    )}

                    <div className="col-span-2">
                        <span className="block text-muted-foreground font-medium text-xs uppercase relative mb-1">Visit Schedule</span>
                        <span className="font-medium text-foreground">
                            {format(new Date(pass.visitFrom), 'MMM d, h:mm a')} &mdash; {format(new Date(pass.visitTo), 'MMM d, h:mm a')}
                        </span>
                    </div>
                </div>

                {approvalStatus === 'PENDING' ? (
                    <div className="flex gap-3">
                        <Button onClick={() => handleAction('APPROVE')} className="flex-1 bg-green-600 hover:bg-green-700 gap-2" disabled={respondToApproval.isPending}>
                            <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button onClick={() => handleAction('REJECT')} variant="destructive" className="flex-1 gap-2" disabled={respondToApproval.isPending}>
                            <X className="h-4 w-4" /> Reject
                        </Button>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground italic">
                        Decision made on {approvalRequest?.decidedAt ? format(new Date(approvalRequest.decidedAt), 'MMM d, yyyy') : 'N/A'}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
