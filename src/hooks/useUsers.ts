'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { ApiResponse, PaginationMeta } from '@/types/api.types';

export interface UserListItem {
    id: string;
    email: string;
    name: string | null;
    role: string;
    rollNumber: string | null;
    uniqueId: string | null;
    department: string | null;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Fetches a list of users, optionally filtered by role.
 * Used in the student guest pass form to find ADMIN approvers.
 */
export function useUsers(params?: { role?: string; search?: string; page?: number; limit?: number }) {
    return useQuery({
        queryKey: ['users', params],
        queryFn: async () => {
            const response = await api.getWithMeta<UserListItem[]>(
                '/api/users',
                {
                    role: params?.role,
                    search: params?.search,
                    page: params?.page,
                    limit: params?.limit,
                }
            );
            return {
                users: response.data as UserListItem[],
                meta: response.meta as PaginationMeta,
            };
        },
        enabled: params !== undefined,
    });
}

/**
 * Fetches the current user profile.
 */
export function useCurrentUser() {
    return useQuery({
        queryKey: ['users', 'me'],
        queryFn: () => api.get<UserListItem>('/api/users/me'),
    });
}
