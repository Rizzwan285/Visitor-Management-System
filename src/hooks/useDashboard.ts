'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

// Dashboard response types per role
export interface BaseDashboardStats {
    total: number;
    active: number;
    pending: number;
    recent: DashboardRecentPass[];
}

export interface SecurityDashboardStats {
    todayEntries: number;
    todayExits: number;
    activePasses: number;
    recentScans: DashboardRecentScan[];
}

export interface AdminDashboardStats {
    total: number;
    active: number;
    pendingApproval: number;
    todayScans: number;
    recentPasses: DashboardRecentPass[];
}

export interface DashboardRecentPass {
    id: string;
    visitorName: string;
    passType: string;
    status: string;
    purpose: string;
    createdAt: string;
    createdBy?: { id: string; name: string | null; email: string };
    approvalRequest?: { status: string; decidedAt: string | null } | null;
}

export interface DashboardRecentScan {
    id: string;
    scanType: string;
    scannedAt: string;
    gateLocation: string | null;
    pass: { visitorName: string; passType: string };
    scannedBy: { name: string | null };
}

/**
 * Fetches dashboard stats from GET /api/dashboard.
 * Returns role-specific data based on the authenticated user.
 */
export function useDashboard() {
    return useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
            return api.get<BaseDashboardStats | SecurityDashboardStats | AdminDashboardStats>(
                '/api/dashboard'
            );
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

export interface OverstayingPass {
    id: string;
    passNumber: string;
    visitorName: string;
    passType: string;
    visitorMobile: string | null;
    pocMobile: string | null;
    pointOfContact: string | null;
    visitTo: string;
}

/**
 * Fetches overstaying visitors from GET /api/dashboard/overstaying.
 */
export function useOverstayingAlerts() {
    return useQuery({
        queryKey: ['overstaying-alerts'],
        queryFn: async () => {
            return api.get<OverstayingPass[]>('/api/dashboard/overstaying');
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}
