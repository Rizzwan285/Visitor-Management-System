import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { VisitorPassWithDetails } from './usePasses';
import type { PaginationMeta } from '@/types/api.types';

/**
 * Fetch passes with PENDING_APPROVAL status for the admin approval queue.
 */
export function usePendingApprovals(page = 1, limit = 20) {
    return useQuery({
        queryKey: ['approvals', 'pending', page, limit],
        queryFn: async (): Promise<{ data: VisitorPassWithDetails[]; meta: PaginationMeta }> => {
            const response = await api.getWithMeta<VisitorPassWithDetails[]>(
                '/api/passes',
                { status: 'PENDING_APPROVAL', page, limit }
            );
            return {
                data: response.data as VisitorPassWithDetails[],
                meta: response.meta as PaginationMeta,
            };
        },
    });
}

interface ApprovalActionArgs {
    passId: string;
    action: 'APPROVE' | 'REJECT';
    remarks?: string;
}

/**
 * Approve or reject a pass via POST /api/passes/:id/approve.
 */
export function useReviewApproval() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ passId, action, remarks }: ApprovalActionArgs) => {
            return api.post(`/api/passes/${passId}/approve`, { action, remarks });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['passes'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}
