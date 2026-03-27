'use client';

import { PassQRCode } from '@/components/passes/PassQRCode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VisitorPassWithDetails, useCancelPass } from '@/hooks/usePasses';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, Printer, UserX, Share2, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';

interface PassDetailProps {
    pass: VisitorPassWithDetails;
    role: 'EMPLOYEE' | 'STUDENT' | 'OFFICIAL' | 'SECURITY' | 'ADMIN' | 'ASSISTANT_WARDEN';
}

export function PassDetail({ pass, role }: PassDetailProps) {
    const router = useRouter();
    const { mutateAsync: cancelPass, isPending: isCancelling } = useCancelPass();

    const [isForwardOpen, setIsForwardOpen] = useState(false);
    const [forwardEmail, setForwardEmail] = useState('');
    const [isForwarding, setIsForwarding] = useState(false);

    // Use the server-generated QR code URL (already a data URL)
    const qrUrl = pass.qrCodeUrl || '';

    const handlePrint = () => {
        window.print();
    };

    const handleCancel = async () => {
        if (confirm('Are you sure you want to cancel this pass? This action cannot be undone.')) {
            try {
                await cancelPass(pass.id);
                toast.success('Pass cancelled successfully');
                router.back();
            } catch (err: any) {
                toast.error(err.message || 'Failed to cancel pass');
            }
        }
    };

    const handleForward = async () => {
        if (!forwardEmail || !forwardEmail.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        try {
            setIsForwarding(true);
            await api.post(`/api/passes/${pass.id}/forward`, { email: forwardEmail });
            toast.success('Pass successfully forwarded');
            setIsForwardOpen(false);
            setForwardEmail('');
        } catch (err: any) {
            toast.error(err.message || 'Failed to forward pass');
        } finally {
            setIsForwarding(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'default';
            case 'PENDING_APPROVAL': return 'secondary';
            case 'REJECTED': return 'destructive';
            case 'CANCELLED':
            case 'EXPIRED': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <div className="bg-white rounded-xl border shadow-sm no-print mb-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-bold tracking-tight">{pass.visitorName}</h2>
                        <Badge variant={getStatusColor(pass.status)} className="mt-1">
                            {pass.status.replace('_', ' ')}
                        </Badge>
                    </div>
                    <p className="text-slate-500 font-medium">{pass.passType.replace('_', ' ')}</p>
                    {pass.passNumber && (
                        <p className="text-sm text-slate-400 font-mono mt-1">{pass.passNumber}</p>
                    )}
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {pass.status === 'ACTIVE' && (
                        <Button variant="outline" className="gap-2 flex-1 md:flex-none" onClick={handlePrint}>
                            <Printer className="h-4 w-4" /> Print
                        </Button>
                    )}

                    {pass.passType === 'STUDENT_EXIT' && pass.status === 'ACTIVE' && (
                        <Dialog open={isForwardOpen} onOpenChange={setIsForwardOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2 flex-1 md:flex-none">
                                    <Share2 className="h-4 w-4" /> Forward
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Forward Exit Pass</DialogTitle>
                                    <DialogDescription>
                                        Send a copy of this Student Exit pass to another official or warden immediately.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Recipient Email</label>
                                        <Input
                                            type="email"
                                            placeholder="warden@iitpkd.ac.in"
                                            value={forwardEmail}
                                            onChange={(e) => setForwardEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsForwardOpen(false)} disabled={isForwarding}>Cancel</Button>
                                    <Button onClick={handleForward} disabled={isForwarding}>
                                        {isForwarding ? 'Forwarding...' : 'Send Pass'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {['ACTIVE', 'PENDING_APPROVAL'].includes(pass.status) && role !== 'SECURITY' && (
                        <Button variant="destructive" className="gap-2 flex-1 md:flex-none" onClick={handleCancel} disabled={isCancelling}>
                            <UserX className="h-4 w-4" /> Cancel
                        </Button>
                    )}
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">

                    <section>
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Pass Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                                <span className="text-sm text-slate-500 block">Pass Number</span>
                                <span className="font-medium font-mono text-sm">{pass.passNumber || pass.id.split('-')[0].toUpperCase()}</span>
                            </div>

                            <div>
                                <span className="text-sm text-slate-500 block">Host / Point of Contact</span>
                                <span className="font-medium">{pass.pointOfContact || pass.createdBy?.name || 'N/A'}</span>
                            </div>

                            <div>
                                <span className="text-sm text-slate-500 block">Age & Sex</span>
                                <span className="font-medium capitalize">{pass.visitorAge || 'N/A'} / {pass.visitorSex.toLowerCase()}</span>
                            </div>

                            {pass.visitorMobile && (
                                <div>
                                    <span className="text-sm text-slate-500 flex items-center gap-1 mb-1"><Phone className="h-3 w-3" /> Mobile Number</span>
                                    <span className="font-medium">{pass.visitorMobile}</span>
                                </div>
                            )}

                            {pass.visitorRelation && (
                                <div>
                                    <span className="text-sm text-slate-500 block">Relation</span>
                                    <span className="font-medium">{pass.visitorRelation}</span>
                                </div>
                            )}

                            {pass.hostelName && (
                                <div>
                                    <span className="text-sm text-slate-500 block">Hostel</span>
                                    <span className="font-medium">{pass.hostelName}</span>
                                </div>
                            )}

                            {pass.visitorIdType && (
                                <div className="sm:col-span-2">
                                    <span className="text-sm text-slate-500 block">Identity Proof</span>
                                    <span className="font-medium">{pass.visitorIdType} - {pass.visitorIdNumber}</span>
                                </div>
                            )}

                            <div className="sm:col-span-2">
                                <span className="text-sm text-slate-500 block">Purpose</span>
                                <span className="font-medium">{pass.purpose}</span>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" /> Validity Period
                        </h3>
                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-md border">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase">Valid From</span>
                                <div className="font-medium text-slate-900">{format(new Date(pass.visitFrom), 'PPP')}</div>
                                <div className="text-sm text-slate-500">{format(new Date(pass.visitFrom), 'p')}</div>
                            </div>

                            <div className="h-px bg-slate-300 w-16 mx-4"></div>

                            <div className="space-y-1 text-right">
                                <span className="text-xs font-semibold text-slate-500 uppercase">Valid Until</span>
                                <div className="font-medium text-slate-900">{format(new Date(pass.visitTo), 'PPP')}</div>
                                <div className="text-sm text-slate-500">{format(new Date(pass.visitTo), 'p')}</div>
                            </div>
                        </div>
                    </section>

                    {/* Scan History section */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                            <MapPin className="h-5 w-5" /> Scan History
                        </h3>

                        {(!pass.scanLogs || pass.scanLogs.length === 0) ? (
                            <div className="text-sm text-slate-500 py-4 italic">No scans recorded yet.</div>
                        ) : (
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                {pass.scanLogs.map((log: any, i: number) => (
                                    <div key={log.id || i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-50 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-md border shadow-sm">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-slate-900">{log.scanType}</div>
                                                <time className="font-mono text-xs text-blue-600">{format(new Date(log.scannedAt), 'p')}</time>
                                            </div>
                                            <div className="text-slate-500 text-sm">Gate: {log.gateLocation || 'Main Gate'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column: QR and Actions */}
                <div className="flex flex-col items-center space-y-6">
                    <div className="w-full bg-slate-50 p-6 rounded-xl border flex flex-col items-center justify-center min-h-[300px] text-center">
                        {pass.status === 'ACTIVE' ? (
                            <>
                                <PassQRCode dataUrl={qrUrl} size={200} className="mb-4" />
                                <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
                                    Show this QR code at the security gate for entry and exit.
                                </p>
                            </>
                        ) : pass.status === 'PENDING_APPROVAL' ? (
                            <div className="text-slate-500 space-y-3">
                                <Clock className="w-12 h-12 mx-auto text-yellow-500 opacity-50" />
                                <p className="font-medium text-slate-700">Pending Approval</p>
                                <p className="text-sm">QR Code will be generated once the pass is approved.</p>
                            </div>
                        ) : (
                            <div className="text-slate-500 space-y-3">
                                <UserX className="w-12 h-12 mx-auto text-red-500 opacity-50" />
                                <p className="font-medium text-slate-700">Pass Inactive</p>
                                <p className="text-sm">This pass is {pass.status.toLowerCase().replace('_', ' ')}.</p>
                            </div>
                        )}
                    </div>

                    {pass.visitorPhotoUrl && (
                        <div className="w-full">
                            <h4 className="text-sm font-semibold mb-2">Visitor Photo</h4>
                            <img src={`/api/passes/${pass.id}/photo`} alt="Visitor" className="w-full aspect-video object-cover rounded-md border" />
                        </div>
                    )}

                    {/* Signatures on Record */}
                    {(pass.visitorSignatureUrl || pass.securitySignatureUrl || pass.hostSignatureUrl) && (
                        <div className="w-full bg-slate-50 p-4 rounded-xl border">
                            <h4 className="text-sm font-semibold mb-3">Signatures on Record</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {pass.visitorSignatureUrl && (
                                    <div className="text-center">
                                        <img src={pass.visitorSignatureUrl} alt="Visitor Signature" className="h-14 mx-auto border rounded bg-white object-contain" />
                                        <span className="text-[10px] text-slate-400 mt-1 block">Visitor</span>
                                    </div>
                                )}
                                {pass.securitySignatureUrl && (
                                    <div className="text-center">
                                        <img src={pass.securitySignatureUrl} alt="Security Signature" className="h-14 mx-auto border rounded bg-white object-contain" />
                                        <span className="text-[10px] text-slate-400 mt-1 block">Security</span>
                                    </div>
                                )}
                                {pass.hostSignatureUrl && (
                                    <div className="text-center">
                                        <img src={pass.hostSignatureUrl} alt="Host Signature" className="h-14 mx-auto border rounded bg-white object-contain" />
                                        <span className="text-[10px] text-slate-400 mt-1 block">Host</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
