'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePasses, VisitorPassWithDetails } from '@/hooks/usePasses';
import { PassCard } from '@/components/passes/PassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PassFilters } from '@/types/pass.types';

interface PassListProps {
    /** Base path for linking to pass detail (e.g., '/employee/passes') */
    basePath: string;
    /** Optional default filter by pass type */
    defaultPassType?: string;
    /** Whether to show pass type filter */
    showTypeFilter?: boolean;
    /** Title above the list */
    title?: string;
    /** Scope list to passes created by the current user (used for Security's walk-ins view) */
    createdByMe?: boolean;
}

export function PassList({ basePath, defaultPassType, showTypeFilter = true, title = 'My Passes', createdByMe }: PassListProps) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>(defaultPassType || '');

    const filters: PassFilters = {
        page,
        limit: 10,
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter as any } : {}),
        ...(typeFilter ? { passType: typeFilter as any } : {}),
        ...(createdByMe ? { createdByMe: true } : {}),
    };

    const { data, isLoading, isError } = usePasses(filters);
    const passes = data?.data || [];
    const meta = data?.meta;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">{title}</h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by visitor name..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>

                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1); }}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All statuses</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>

                {showTypeFilter && (
                    <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'ALL' ? '' : v); setPage(1); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All types</SelectItem>
                            <SelectItem value="EMPLOYEE_GUEST">Employee Guest</SelectItem>
                            <SelectItem value="OFFICIAL">Official</SelectItem>
                            <SelectItem value="STUDENT_GUEST">Student Guest</SelectItem>
                            <SelectItem value="WALKIN">Walk-in</SelectItem>
                            <SelectItem value="STUDENT_EXIT">Student Exit</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* List */}
            {isLoading ? (
                <div className="p-12 text-center text-muted-foreground">Loading passes...</div>
            ) : isError ? (
                <div className="p-12 text-center text-red-500">Failed to load passes. Please try again.</div>
            ) : passes.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl">
                    No passes found matching your criteria.
                </div>
            ) : (
                <div className="space-y-3">
                    {passes.map((pass: VisitorPassWithDetails) => (
                        <Link key={pass.id} href={`${basePath}/${pass.id}`}>
                            <PassCard pass={pass} />
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                        Page {meta.page} of {meta.totalPages} ({meta.total} total)
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= meta.totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
