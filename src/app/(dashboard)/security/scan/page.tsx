'use client';

import { useState } from 'react';
import { requireRole } from '@/lib/auth-utils';
import { QRScanner } from '@/components/scanner/QRScanner';
import { ScanResultModal } from '@/components/scanner/ScanResultModal';
import { useScanner } from '@/hooks/useScanner';
import { toast } from 'sonner';
import { Scan, ShieldAlert } from 'lucide-react';

export default function SecurityScanPage() {
    const [scannedPassData, setScannedPassData] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { verifyQR } = useScanner();

    // We skip strict SSR auth for this scaffold page so we don't block the UI while testing
    // await requireRole(['SECURITY', 'ADMIN']); is normally used in server components

    const handleScanSuccess = async (qrData: string) => {
        try {
            // 1. Send the encrypted string to the backend to verify and decrypt
            const serverResponseData = await verifyQR.mutateAsync(qrData);

            // 2. Open the modal with the decrypted pass info
            setScannedPassData(serverResponseData);
            setIsModalOpen(true);
        } catch (err: any) {
            toast.error(err.message || 'Invalid QR Code');
            // Resume immediately if invalid so they can scan another one
            setTimeout(() => {
                (window as any).__resumeQRScanner?.();
            }, 1500);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setScannedPassData(null);
        // Give the modal a ms to close before waking camera back up
        setTimeout(() => {
            (window as any).__resumeQRScanner?.();
        }, 300);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">QR Scanner</h1>
                <p className="text-muted-foreground">Scan visitor and student passes at the gate to verify and log entry/exit.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <div className="bg-card p-6 rounded-xl border shadow-sm h-full">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Scan className="h-5 w-5" /> Live Camera Feed
                        </h2>
                        <QRScanner onScanSuccess={handleScanSuccess} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-card p-6 rounded-xl border shadow-sm">
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-primary" /> Instructions</h3>
                        <ul className="text-sm text-muted-foreground space-y-3 list-disc pl-4">
                            <li>Click <strong>Start Scanner</strong> and grant camera permissions.</li>
                            <li>Point the camera at the visitor&apos;s digital or printed QR code.</li>
                            <li>The scanner will automatically pause when a code is detected.</li>
                            <li>Verify the visitor&apos;s physical identity against the photo shown on screen.</li>
                            <li>Log the matching action (Entry or Exit).</li>
                        </ul>
                    </div>
                </div>
            </div>

            {scannedPassData && (
                <ScanResultModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    passData={scannedPassData}
                />
            )}
        </div>
    );
}
