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

    const handleLogScan = async (scanType: 'ENTRY' | 'EXIT') => {
        try {
            await logScan.mutateAsync({
                passId: passData.id,
                scanType,
                gateLocation: 'Main Gate',
            });
            toast.success(`${scanType} logged successfully for ${passData.visitorName}`);
            onClose();
        } catch (err: any) {
            toast.error(err.message || `Failed to log ${scanType.toLowerCase()}`);
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
                            <span>{passData.pointOfContact || passData.createdBy?.name || 'N/A'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-slate-500 font-semibold block">Purpose</span>
                            <span>{passData.purpose}</span>
                        </div>

                        {passData.visitorMobile && (
                            <div className="space-y-1 col-span-2">
                                <span className="text-slate-500 font-semibold block">Mobile</span>
                                <span>{passData.visitorMobile}</span>
                            </div>
                        )}

                        {passData.visitorPhotoUrl && (
                            <div className="col-span-2 mt-2">
                                <img src={passData.visitorPhotoUrl} alt="Visitor" className="w-full max-h-48 object-cover rounded-md border" />
                            </div>
                        )}
                    </div>

                    {isActive ? (
                        <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t">
                            <Button onClick={() => handleLogScan('ENTRY')} className="w-full bg-blue-600 hover:bg-blue-700" size="lg" disabled={logScan.isPending}>
                                Log Entry
                            </Button>
                            <Button onClick={() => handleLogScan('EXIT')} className="w-full bg-slate-800 hover:bg-slate-900" size="lg" disabled={logScan.isPending}>
                                Log Exit
                            </Button>
                        </div>
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
