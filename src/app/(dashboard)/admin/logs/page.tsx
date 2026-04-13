'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import type { PaginationMeta } from '@/types/api.types';

interface ScanLogItem {
    id: string;
    scanType: string;
    scannedAt: string;
    gateLocation: string | null;
    notes: string | null;
    pass: {
        id: string;
        visitorName: string;
        passType: string;
        passNumber: string | null;
    };
    scannedBy: {
        id: string;
        name: string | null;
    };
}

function useScanLogs(page = 1, limit = 20) {
    return useQuery({
        queryKey: ['scan-logs', page, limit],
        queryFn: async (): Promise<{ data: ScanLogItem[]; meta: PaginationMeta }> => {
            const response = await api.getWithMeta<ScanLogItem[]>(
                '/api/scan-logs',
                { page, limit }
            );
            return {
                data: response.data as ScanLogItem[],
                meta: response.meta as PaginationMeta,
            };
        },
    });
}

export default function AdminScanLogsPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading, isError } = useScanLogs(page, 25);

    const logs = data?.data || [];
    const meta = data?.meta;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <History className="h-8 w-8" /> Scan Logs
                </h1>
                <p className="text-muted-foreground">Chronological record of all gate entry and exit scans.</p>
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-12 text-center text-muted-foreground">Loading scan logs...</div>
                    ) : isError ? (
                        <div className="p-12 text-center text-red-500">Failed to load scan logs.</div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">No scan logs recorded yet.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Visitor</TableHead>
                                    <TableHead>Pass Type</TableHead>
                                    <TableHead>Gate</TableHead>
                                    <TableHead>Scanned By</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-sm">
                                            {format(new Date(log.scannedAt), 'MMM d, h:mm a')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={log.scanType === 'ENTRY' ? 'default' : 'secondary'}>
                                                {log.scanType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{log.pass.visitorName}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {log.pass.passType.replace('_', ' ')}
                                        </TableCell>
                                        <TableCell className="text-sm">{log.gateLocation || 'Main Gate'}</TableCell>
                                        <TableCell className="text-sm">{log.scannedBy.name || 'Unknown'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Page {meta.page} of {meta.totalPages} ({meta.total} total)
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
