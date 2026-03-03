import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreatePassInput, PassFilters, UpdatePassInput } from '@/types/pass.types';
import { VisitorPass, ScanLog, ApprovalRequest } from '@/generated/prisma/client';
import { PaginatedResult } from '@/types/api.types';

// Extended type to include relations that the frontend needs
export type VisitorPassWithDetails = VisitorPass & {
    scanLogs?: ScanLog[];
    approvalRequest?: ApprovalRequest | null;
    createdBy?: { id: string; name: string | null; role: string };
    hostName?: string | null;
    mobileNumber?: string | null;
    idType?: string | null;
    idNumber?: string | null;
    photoUrl?: string | null;
};

export function usePasses(filters?: PassFilters) {
    return useQuery({
        queryKey: ['passes', filters],
        queryFn: async (): Promise<PaginatedResult<VisitorPassWithDetails>> => {
            const searchParams = new URLSearchParams();
            if (filters?.passType) searchParams.set('passType', filters.passType);
            if (filters?.status) searchParams.set('status', filters.status);
            if (filters?.search) searchParams.set('search', filters.search);
            if (filters?.page) searchParams.set('page', filters.page.toString());
            if (filters?.limit) searchParams.set('limit', filters.limit.toString());

            const res = await fetch(`/api/passes?${searchParams.toString()}`);
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error?.message || 'Failed to fetch passes');
            }

            return json.data;
        },
    });
}

export function usePassDetail(id: string) {
    return useQuery({
        queryKey: ['passes', id],
        queryFn: async (): Promise<VisitorPassWithDetails> => {
            const res = await fetch(`/api/passes/${id}`);
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error?.message || 'Failed to fetch pass details');
            }

            return json.data;
        },
        enabled: !!id,
    });
}

export function useCreatePass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreatePassInput): Promise<VisitorPassWithDetails> => {
            const res = await fetch('/api/passes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error?.message || 'Failed to create pass');
            }

            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['passes'] });
        },
    });
}

export function useCancelPass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<VisitorPassWithDetails> => {
            const res = await fetch(`/api/passes/${id}/cancel`, {
                method: 'POST',
            });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error?.message || 'Failed to cancel pass');
            }

            return json.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['passes'] });
            queryClient.invalidateQueries({ queryKey: ['passes', id] });
        },
    });
}

export function useApprovals() {
    const queryClient = useQueryClient();

    const approvalsQuery = useQuery({
        queryKey: ['approvals'],
        queryFn: async (): Promise<{ items: any[], total: number }> => {
            const res = await fetch('/api/approvals');
            if (res.status === 404) return { items: [], total: 0 }; // Handle mock
            const json = await res.json();
            if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch approvals');
            return json.data;
        },
    });

    const respondToApproval = useMutation({
        mutationFn: async ({ approvalId, status, remarks }: { approvalId: string, status: 'APPROVED' | 'REJECTED', remarks?: string }) => {
            const res = await fetch(`/api/approvals/${approvalId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, remarks }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error?.message || 'Failed to update approval');
            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['passes'] });
        },
    });

    return { ...approvalsQuery, respondToApproval };
}

