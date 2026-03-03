import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaginatedResult } from '@/types/api.types';
import { VisitorPassWithDetails } from './usePasses';

export function usePendingApprovals(page = 1, limit = 20) {
    return useQuery({
        queryKey: ['approvals', 'pending', page, limit],
        queryFn: async (): Promise<PaginatedResult<VisitorPassWithDetails>> => {
            const res = await fetch(`/api/approvals/pending?page=${page}&limit=${limit}`);
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error?.message || 'Failed to fetch pending approvals');
            }

            return json.data;
        },
    });
}

interface ApprovalMutationArgs {
    passId: string;
    status: 'APPROVED' | 'REJECTED';
    remarks?: string;
}

export function useReviewApproval() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ passId, status, remarks }: ApprovalMutationArgs) => {
            const res = await fetch(`/api/approvals/${passId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, remarks }),
            });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error?.message || `Failed to ${status.toLowerCase()} pass`);
            }

            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['passes'] });
        },
    });
}
