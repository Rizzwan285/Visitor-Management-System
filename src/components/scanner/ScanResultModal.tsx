import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useScanner } from '@/hooks/useScanner';
import { toast } from 'sonner';

interface ScanResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    passData: any; // The full pass object returned from GET /api/passes/verify
}

export function ScanResultModal({ isOpen, onClose, passData }: ScanResultModalProps) {
    const { logScan } = useScanner();
    const [deviationReason, setDeviationReason] = useState('');

    if (!passData) return null;

    const isActive = passData.status === 'ACTIVE';
    const now = new Date();
    const isEarly = new Date(passData.visitFrom) > now;
    const isLate = new Date(passData.visitTo) < now;
    const lastScanType = passData.scanLogs?.[0]?.scanType ?? null;

    const handleLogScan = async (scanType: 'ENTRY' | 'INTERMEDIATE_EXIT' | 'FINAL_EXIT' | 'STUDENT_EXIT_OUT' | 'STUDENT_EXIT_RETURN' | 'STUDENT_EXIT_AUTO') => {
        try {
            await logScan.mutateAsync({
                passId: passData.id,
                scanType,
                gateLocation: 'Main Gate',
                deviationReason: (isEarly || isLate) && deviationReason.trim() ? deviationReason.trim() : undefined,
            });
            toast.success(`${scanType.replace('_', ' ')} logged successfully for ${passData.visitorName}`);
            onClose();
        } catch (err: any) {
            toast.error(err.message || `Failed to log ${scanType.replace('_', ' ').toLowerCase()}`);
        }
    };
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Scan Result</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-6 pt-4">
                    <div className="text-center space-y-2 w-full border-b pb-4">
                        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center font-bold text-2xl mb-2 ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isActive ? '\u2713' : '\u2717'}
                        </div>
                        <h3 className="text-xl font-bold">{passData.visitorName}</h3>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{passData.passType.replace('_', ' ')}</p>

                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-2 ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {passData.status}
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <span className="text-muted-foreground font-semibold block">Host / To Visit</span>
                            <span>{passData.pointOfContact || passData.hostProfessor?.name || passData.createdBy?.name || 'N/A'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground font-semibold block">Purpose</span>
                            <span>{passData.purpose}</span>
                        </div>

                        {passData.visitorSex && (
                            <div className="space-y-1">
                                <span className="text-muted-foreground font-semibold block">Sex</span>
                                <span className="capitalize">{passData.visitorSex.toLowerCase()}</span>
                            </div>
                        )}
                        {passData.visitorAge && (
                            <div className="space-y-1">
                                <span className="text-muted-foreground font-semibold block">Age</span>
                                <span>{passData.visitorAge} years</span>
                            </div>
                        )}
                        {passData.visitorRelation && (
                            <div className="space-y-1">
                                <span className="text-muted-foreground font-semibold block">Relation</span>
                                <span>{passData.visitorRelation}</span>
                            </div>
                        )}
                        {passData.hostelName && (
                            <div className="space-y-1">
                                <span className="text-muted-foreground font-semibold block">Hostel</span>
                                <span>{passData.hostelName}</span>
                            </div>
                        )}
                        {passData.visitorIdType && (
                            <div className="space-y-1 col-span-2">
                                <span className="text-muted-foreground font-semibold block">ID Proof Provided</span>
                                <span>{passData.visitorIdType} - {passData.visitorIdNumber}</span>
                            </div>
                        )}

                        {passData.visitorMobile && (
                            <div className="space-y-1 col-span-2">
                                <span className="text-muted-foreground font-semibold block">Visitor Mobile</span>
                                <span>{passData.visitorMobile}</span>
                            </div>
                        )}

                        {passData.visitorPhotoUrl && (
                            <div className="col-span-2 mt-2">
                                <span className="text-muted-foreground font-semibold block mb-2">Visitor Photo</span>
                                <div className="w-32 h-32 rounded-lg overflow-hidden border">
                                    <img 
                                        src={passData.visitorPhotoUrl.startsWith('data:') ? passData.visitorPhotoUrl : `/api/passes/${passData.id}/photo`} 
                                        alt={`Photo of ${passData.visitorName}`} 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                            </div>
                        )}

                        {/* Signatures */}
                        {(passData.visitorSignatureUrl || passData.securitySignatureUrl || passData.hostSignatureUrl) && (
                            <div className="col-span-2 mt-3 pt-3 border-t">
                                <span className="text-muted-foreground font-semibold block mb-2">Signatures on Record</span>
                                <div className="grid grid-cols-3 gap-3">
                                    {passData.visitorSignatureUrl && (
                                        <div className="text-center">
                                            <img src={passData.visitorSignatureUrl} alt="Visitor" className="h-12 mx-auto border rounded object-contain bg-card" />
                                            <span className="text-[10px] text-muted-foreground mt-1 block">Visitor</span>
                                        </div>
                                    )}
                                    {passData.securitySignatureUrl && (
                                        <div className="text-center">
                                            <img src={passData.securitySignatureUrl} alt="Security" className="h-12 mx-auto border rounded object-contain bg-card" />
                                            <span className="text-[10px] text-muted-foreground mt-1 block">Security</span>
                                        </div>
                                    )}
                                    {passData.hostSignatureUrl && (
                                        <div className="text-center">
                                            <img src={passData.hostSignatureUrl} alt="Host" className="h-12 mx-auto border rounded object-contain bg-card" />
                                            <span className="text-[10px] text-muted-foreground mt-1 block">Host</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {isActive ? (
                        <>
                            {(isEarly || isLate) && (
                                <div className={`w-full p-4 rounded text-sm ${isEarly ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'} mb-4`}>
                                    <p className="font-bold flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs ${isEarly ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {isEarly ? 'EARLY' : 'LATE'}
                                        </span>
                                        Visitor is {isEarly ? 'EARLY' : 'LATE'}
                                    </p>
                                    <p className="mt-1 opacity-90">
                                        Allowed time: {new Date(passData.visitFrom).toLocaleString()} - {new Date(passData.visitTo).toLocaleString()}
                                    </p>
                                    <div className="mt-3">
                                        <label className="block text-xs font-semibold mb-1 opacity-90">Reason (optional)</label>
                                        <textarea
                                            className="w-full text-sm p-2 rounded bg-white/50 border border-black/10 focus:outline-none"
                                            rows={2}
                                            value={deviationReason}
                                            onChange={(e) => setDeviationReason(e.target.value)}
                                            placeholder="Why are they scanning outside the window?"
                                        />
                                    </div>
                                </div>
                            )}

                            {passData.passType === 'STUDENT_EXIT' ? (
                                <div className="w-full flex flex-col gap-3 border-t pt-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button onClick={() => handleLogScan('STUDENT_EXIT_OUT')} className="w-full" size="lg" disabled={logScan.isPending || lastScanType === 'STUDENT_EXIT_OUT'}>
                                            Exit (Out)
                                        </Button>
                                        <Button onClick={() => handleLogScan('STUDENT_EXIT_RETURN')} className="w-full bg-indigo-600 hover:bg-indigo-700" size="lg" disabled={logScan.isPending || lastScanType !== 'STUDENT_EXIT_OUT'}>
                                            Entry (Return)
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full flex flex-col gap-3 pt-4 border-t">
                                    <Button onClick={() => handleLogScan('ENTRY')} className="w-full bg-primary hover:bg-blue-700" size="lg" disabled={logScan.isPending}>
                                        Log Entry
                                    </Button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button onClick={() => handleLogScan('INTERMEDIATE_EXIT')} className="w-full bg-slate-600 hover:bg-slate-700" size="sm" disabled={logScan.isPending || lastScanType === 'INTERMEDIATE_EXIT'}>
                                            Intermediate Exit
                                        </Button>
                                        <Button onClick={() => handleLogScan('INTERMEDIATE_ENTRY')} className="w-full bg-indigo-600 hover:bg-indigo-700" size="sm" disabled={logScan.isPending || lastScanType !== 'INTERMEDIATE_EXIT'}>
                                            Return (Entry)
                                        </Button>
                                    </div>
                                    <Button onClick={() => handleLogScan('FINAL_EXIT')} variant="destructive" className="w-full mt-1" size="lg" disabled={logScan.isPending || lastScanType === 'INTERMEDIATE_EXIT'}>
                                        Final Exit
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full pt-4 border-t px-2 text-center text-red-600 font-medium">
                            This pass cannot be used for entry or exit.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
