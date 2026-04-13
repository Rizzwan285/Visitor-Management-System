'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, FileText, Download, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type SummaryData = {
    total: number;
    byType: {
        STUDENT_GUEST: number;
        EMPLOYEE_GUEST: number;
        OFFICIAL: number;
        STUDENT_EXIT: number;
        WALKIN: number;
    };
    byStatus: {
        ACTIVE: number;
        APPROVED: number;
        PENDING_APPROVAL: number;
        EXPIRED: number;
        CANCELLED: number;
        REJECTED: number;
        DRAFT: number;
    };
};

export default function ReportsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [passes, setPasses] = useState<any[]>([]);

    // Filter states
    const [timeline, setTimeline] = useState<'today' | 'week' | 'month' | 'custom'>('today');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            let start = '';
            let end = '';
            const today = new Date();
            
            if (timeline === 'today') {
                const s = new Date(today);
                s.setHours(0, 0, 0, 0);
                start = s.toISOString();
                
                const e = new Date(today);
                e.setHours(23, 59, 59, 999);
                end = e.toISOString();
            } else if (timeline === 'week') {
                const s = new Date(today);
                s.setDate(s.getDate() - 7);
                s.setHours(0, 0, 0, 0);
                start = s.toISOString();
                
                const e = new Date(today);
                e.setHours(23, 59, 59, 999);
                end = e.toISOString();
            } else if (timeline === 'month') {
                const s = new Date(today);
                s.setMonth(s.getMonth() - 1);
                s.setHours(0, 0, 0, 0);
                start = s.toISOString();
                
                const e = new Date(today);
                e.setHours(23, 59, 59, 999);
                end = e.toISOString();
            } else if (timeline === 'custom') {
                if (!customStart || !customEnd) {
                    toast.error('Please select both start and end dates.');
                    setIsLoading(false);
                    return;
                }
                const s = new Date(customStart);
                s.setHours(0, 0, 0, 0);
                start = s.toISOString();
                
                const e = new Date(customEnd);
                e.setHours(23, 59, 59, 999);
                end = e.toISOString();
            }

            const response = await fetch(`/api/reports?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`);
            if (!response.ok) throw new Error('Failed to fetch reports');
            
            const data = await response.json();
            setSummary(data.summary);
            setPasses(data.passes);

        } catch (error) {
            console.error(error);
            toast.error('Could not load reports.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (timeline !== 'custom') {
            fetchReports();
        }
    }, [timeline]);

    const handleCustomFilter = () => {
        if (timeline === 'custom') {
            fetchReports();
        }
    };

    const exportToCSV = () => {
        if (!passes || passes.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = ['Pass ID', 'Pass Number', 'Pass Type', 'Status', 'Visitor Name', 'Created At'];
        const rows = passes.map(p => [
            p.id,
            p.passNumber,
            p.passType,
            p.status,
            p.visitorName,
            new Date(p.createdAt).toLocaleString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `VMS_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = async () => {
        if (!passes || passes.length === 0) {
            toast.error('No data to export');
            return;
        }

        const id = toast.loading('Generating PDF...');
        
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const { ReportPDF } = await import('./ReportPDF');
            
            const blob = await pdf(<ReportPDF summary={summary} passes={passes} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `VMS_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('PDF downloaded successfully', { id });
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Failed to generate PDF', { id });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
                    <p className="text-muted-foreground pt-1">Generate and view actionable insights on visitor passes.</p>
                </div>
                
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchReports} disabled={isLoading}>
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button disabled={passes.length === 0 || isLoading}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                                Export as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                                Export as PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Filter Controls */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-2 w-full md:w-auto">
                            <label className="text-sm font-medium">Timeline</label>
                            <div className="flex border rounded-md overflow-hidden bg-slate-50">
                                <button 
                                    onClick={() => setTimeline('today')}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${timeline === 'today' ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-700'}`}
                                >
                                    Today
                                </button>
                                <button 
                                    onClick={() => setTimeline('week')}
                                    className={`px-4 py-2 text-sm font-medium border-l transition-colors border-slate-200 ${timeline === 'week' ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-700'}`}
                                >
                                    Last 7 Days
                                </button>
                                <button 
                                    onClick={() => setTimeline('month')}
                                    className={`px-4 py-2 text-sm font-medium border-l transition-colors border-slate-200 ${timeline === 'month' ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-700'}`}
                                >
                                    Last 30 Days
                                </button>
                                <button 
                                    onClick={() => setTimeline('custom')}
                                    className={`px-4 py-2 text-sm font-medium border-l transition-colors border-slate-200 ${timeline === 'custom' ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-700'}`}
                                >
                                    Custom Range
                                </button>
                            </div>
                        </div>

                        {timeline === 'custom' && (
                            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 items-end">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Start Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">End Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleCustomFilter}>Apply</Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="py-20 flex justify-center text-slate-500">
                    <RefreshCcw className="h-8 w-8 animate-spin opacity-50" />
                </div>
            ) : summary ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Passes Generate</p>
                                        <h3 className="text-2xl font-bold">{summary.total}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm font-medium text-muted-foreground mb-4">Pass Breakdown</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Guest Passes</span>
                                        <span className="font-semibold">{summary.byType.STUDENT_GUEST + summary.byType.EMPLOYEE_GUEST}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Exit Passes</span>
                                        <span className="font-semibold">{summary.byType.STUDENT_EXIT}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Walk-ins</span>
                                        <span className="font-semibold">{summary.byType.WALKIN}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Official</span>
                                        <span className="font-semibold">{summary.byType.OFFICIAL}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardContent className="pt-6">
                                <p className="text-sm font-medium text-muted-foreground mb-4">Status Breakdown</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-center">
                                    <div className="p-3 bg-green-50 rounded-lg text-green-900 border border-green-100">
                                        <span className="block text-xl font-bold">{summary.byStatus.ACTIVE}</span>
                                        <span className="text-xs uppercase font-medium">Active</span>
                                    </div>
                                    <div className="p-3 bg-yellow-50 rounded-lg text-yellow-900 border border-yellow-100">
                                        <span className="block text-xl font-bold">{summary.byStatus.PENDING_APPROVAL}</span>
                                        <span className="text-xs uppercase font-medium">Pending</span>
                                    </div>
                                    <div className="p-3 bg-red-50 rounded-lg text-red-900 border border-red-100">
                                        <span className="block text-xl font-bold">{summary.byStatus.REJECTED}</span>
                                        <span className="text-xs uppercase font-medium">Rejected</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg text-slate-900 border border-slate-100">
                                        <span className="block text-xl font-bold">{summary.byStatus.EXPIRED + summary.byStatus.CANCELLED}</span>
                                        <span className="text-xs uppercase font-medium">Inactive</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Pass Logs</CardTitle>
                            <CardDescription>All passes generated within the selected timeframe.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Pass Number</th>
                                            <th className="px-4 py-3 font-medium">Pass Type</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium">Visitor Name</th>
                                            <th className="px-4 py-3 font-medium">Created By</th>
                                            <th className="px-4 py-3 font-medium">Date Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {passes.length > 0 ? passes.map((pass) => (
                                            <tr key={pass.id} className="border-b hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium">{pass.passNumber}</td>
                                                <td className="px-4 py-3 text-slate-600">{pass.passType.replace('_', ' ')}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                                        ${pass.status === 'ACTIVE' || pass.status === 'APPROVED' ? 'bg-green-100 text-green-700' : ''}
                                                        ${pass.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700' : ''}
                                                        ${pass.status === 'REJECTED' || pass.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : ''}
                                                        ${pass.status === 'EXPIRED' ? 'bg-slate-100 text-slate-700' : ''}
                                                    `}>
                                                        {pass.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">{pass.visitorName || '-'}</td>
                                                <td className="px-4 py-3">{pass.createdBy?.name || pass.createdBy?.email}</td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {new Date(pass.createdAt).toLocaleDateString()} {new Date(pass.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                    No passes found in this time range.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : null}
        </div>
    );
}
