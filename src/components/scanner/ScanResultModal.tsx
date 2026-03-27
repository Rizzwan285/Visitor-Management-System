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

    if (!passData) return null;

    const handleLogScan = async (scanType: 'ENTRY' | 'INTERMEDIATE_EXIT' | 'FINAL_EXIT' | 'STUDENT_EXIT_OUT' | 'STUDENT_EXIT_RETURN') => {
        try {
            await logScan.mutateAsync({
                passId: passData.id,
                scanType,
                gateLocation: 'Main Gate',
            });
            toast.success(`${scanType.replace('_', ' ')} logged successfully for ${passData.visitorName}`);
            onClose();
        } catch (err: any) {
            toast.error(err.message || `Failed to log ${scanType.replace('_', ' ').toLowerCase()}`);
        }
    };

    const isActive = passData.status === 'ACTIVE';

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
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{passData.passType.replace('_', ' ')}</p>

                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-2 ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {passData.status}
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <span className="text-slate-500 font-semibold block">Host / To Visit</span>
                            <span>{passData.pointOfContact || passData.hostProfessor?.name || passData.createdBy?.name || 'N/A'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-slate-500 font-semibold block">Purpose</span>
                            <span>{passData.purpose}</span>
                        </div>

                        {passData.visitorSex && (
                            <div className="space-y-1">
                                <span className="text-slate-500 font-semibold block">Sex</span>
                                <span className="capitalize">{passData.visitorSex.toLowerCase()}</span>
                            </div>
                        )}
                        {passData.visitorAge && (
                            <div className="space-y-1">
                                <span className="text-slate-500 font-semibold block">Age</span>
                                <span>{passData.visitorAge} years</span>
                            </div>
                        )}
                        {passData.visitorRelation && (
                            <div className="space-y-1">
                                <span className="text-slate-500 font-semibold block">Relation</span>
                                <span>{passData.visitorRelation}</span>
                            </div>
                        )}
                        {passData.hostelName && (
                            <div className="space-y-1">
                                <span className="text-slate-500 font-semibold block">Hostel</span>
                                <span>{passData.hostelName}</span>
                            </div>
                        )}
                        {passData.visitorIdType && (
                            <div className="space-y-1 col-span-2">
                                <span className="text-slate-500 font-semibold block">ID Proof Provided</span>
                                <span>{passData.visitorIdType} - {passData.visitorIdNumber}</span>
                            </div>
                        )}

                        {passData.visitorMobile && (
                            <div className="space-y-1 col-span-2">
                                <span className="text-slate-500 font-semibold block">Visitor Mobile</span>
                                <span>{passData.visitorMobile}</span>
                            </div>
                        )}

                        {passData.visitorPhotoUrl && (
                            <div className="col-span-2 mt-2">
                                <span className="text-slate-500 font-semibold block mb-2">Visitor Photo</span>
                                <div className="w-32 h-32 rounded-lg overflow-hidden border">
                                    <img 
                                        src={`/api/passes/${passData.id}/photo`} 
                                        alt={`Photo of ${passData.visitorName}`} 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {isActive ? (
                        passData.passType === 'STUDENT_EXIT' ? (
                            <div className="w-full flex flex-col gap-3 pt-4 border-t">
                                <Button onClick={() => handleLogScan('STUDENT_EXIT_OUT')} className="w-full bg-amber-600 hover:bg-amber-700" size="lg" disabled={logScan.isPending}>
                                    Log Student Exit (Leaving Campus)
                                </Button>
                                <Button onClick={() => handleLogScan('STUDENT_EXIT_RETURN')} className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled={logScan.isPending}>
                                    Log Student Return (Back to Campus)
                                </Button>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col gap-3 pt-4 border-t">
                                <Button onClick={() => handleLogScan('ENTRY')} className="w-full bg-blue-600 hover:bg-blue-700" size="lg" disabled={logScan.isPending}>
                                    Log Entry
                                </Button>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button onClick={() => handleLogScan('INTERMEDIATE_EXIT')} className="w-full bg-slate-600 hover:bg-slate-700" size="lg" disabled={logScan.isPending}>
                                        Intermediate Exit
                                    </Button>
                                    <Button onClick={() => handleLogScan('FINAL_EXIT')} variant="destructive" className="w-full" size="lg" disabled={logScan.isPending}>
                                        Final Exit
                                    </Button>
                                </div>
                            </div>
                        )
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
