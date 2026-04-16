import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreatePassInput, PassFilters } from '@/types/pass.types';
import { VisitorPass, ScanLog, ApprovalRequest, User } from '@prisma/client';
import { PaginatedResult, PaginationMeta } from '@/types/api.types';
import { api } from '@/services/api';

// Extended type matching the PassWithRelations returned by the backend
export type VisitorPassWithDetails = VisitorPass & {
    scanLogs?: (ScanLog & { scannedBy: User })[];
    approvalRequest?: (ApprovalRequest & {
        approver: User | null;
        requestedBy: User;
    }) | null;
    createdBy?: { id: string; name: string | null; email: string; role: string };
    hostProfessor?: { id: string; name: string | null; email: string } | null;
};

/**
 * Fetch paginated list of passes (role-scoped on the backend).
 */
export function usePasses(filters?: PassFilters) {
    return useQuery({
        queryKey: ['passes', filters],
        queryFn: async (): Promise<{ data: VisitorPassWithDetails[]; meta: PaginationMeta }> => {
            const params: Record<string, string | number | boolean | undefined> = {};
            if (filters?.passType) params.passType = filters.passType;
            if (filters?.status) params.status = filters.status;
            if (filters?.search) params.search = filters.search;
            if (filters?.page) params.page = filters.page;
            if (filters?.limit) params.limit = filters.limit;
            if (filters?.createdByMe) params.createdByMe = true;

            const response = await api.getWithMeta<VisitorPassWithDetails[]>('/api/passes', params);
            return {
                data: response.data as VisitorPassWithDetails[],
                meta: response.meta as PaginationMeta,
            };
        },
    });
}

/**
 * Fetch a single pass by ID with all relations.
 */
export function usePassDetail(id: string) {
    return useQuery({
        queryKey: ['passes', id],
        queryFn: async (): Promise<VisitorPassWithDetails> => {
            return api.get<VisitorPassWithDetails>(`/api/passes/${id}`);
        },
        enabled: !!id,
    });
}

/**
 * Create a new pass (any of the 5 pass types).
 */
export function useCreatePass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreatePassInput): Promise<VisitorPassWithDetails> => {
            return api.post<VisitorPassWithDetails>('/api/passes', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['passes'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

/**
 * Cancel (soft-delete) a pass via DELETE /api/passes/:id.
 */
export function useCancelPass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<VisitorPassWithDetails> => {
            return api.del<VisitorPassWithDetails>(`/api/passes/${id}`);
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['passes'] });
            queryClient.invalidateQueries({ queryKey: ['passes', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

/**
 * Fetch pending approval requests. Uses GET /api/passes?status=PENDING_APPROVAL for listing.
 * This returns passes (not approval request objects) with their nested approvalRequest.
 */
export function useApprovals() {
    const queryClient = useQueryClient();

    const approvalsQuery = useQuery({
        queryKey: ['approvals'],
        queryFn: async (): Promise<{ items: VisitorPassWithDetails[]; total: number }> => {
            const response = await api.getWithMeta<VisitorPassWithDetails[]>(
                '/api/passes',
                { status: 'PENDING_APPROVAL', limit: 100 }
            );
            return {
                items: response.data as VisitorPassWithDetails[],
                total: response.meta?.total ?? 0,
            };
        },
    });

    const respondToApproval = useMutation({
        mutationFn: async ({
            passId,
            action,
            remarks,
        }: {
            passId: string;
            action: 'APPROVE' | 'REJECT';
            remarks?: string;
        }) => {
            return api.post(`/api/passes/${passId}/approve`, { action, remarks });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['passes'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });

    return { ...approvalsQuery, respondToApproval };
}
