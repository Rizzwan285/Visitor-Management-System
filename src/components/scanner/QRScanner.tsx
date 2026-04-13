'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { AlertCircle, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanError?: (errorMessage: string) => void;
}

export function QRScanner({ onScanSuccess }: QRScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scannerError, setScannerError] = useState('');

    // Stop scanner reliably on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const startScanner = async () => {
        try {
            setScannerError('');
            // Check permissions explicitly first (helps with UX)
            await navigator.mediaDevices.getUserMedia({ video: true });
            setHasPermission(true);

            const html5QrCode = new Html5Qrcode('qr-reader');
            scannerRef.current = html5QrCode;

            setIsScanning(true);
            await html5QrCode.start(
                { facingMode: 'environment' }, // Prefer back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    // Pause scanning to prevent rapid-fire success callbacks
                    if (scannerRef.current?.isScanning) {
                        scannerRef.current.pause();
                        onScanSuccess(decodedText);
                    }
                },
                (errorMessage) => {
                    // Html5Qrcode fires this continuously when no QR is found, so we ignore it unless it's a real failure
                }
            );
        } catch (err: any) {
            setIsScanning(false);
            setHasPermission(false);
            setScannerError(err?.message || 'Failed to access camera.');
            toast.error('Camera access denied or unavailable.');
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
            setIsScanning(false);
        }
    };

    // Exported method to allow parent to resume after a success modal closes
    const resumeScanner = () => {
        if (scannerRef.current && scannerRef.current.getState() === 2) { // 2 = PAUSED
            scannerRef.current.resume();
        } else if (!isScanning) {
            startScanner();
        }
    };

    // Attach resume method to window for easy access by parent (simplified approach)
    // In a real app we'd use forwardRef, but this is simpler for the scaffold
    useEffect(() => {
        (window as any).__resumeQRScanner = resumeScanner;
        return () => { delete (window as any).__resumeQRScanner; };
    });

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center">

            {/* Required ID for html5-qrcode */}
            <div
                id="qr-reader"
                className={`w-full bg-muted rounded-xl overflow-hidden shadow-inner ${!isScanning ? 'hidden' : 'block'}`}
            ></div>

            {!isScanning && (
                <div className="w-full aspect-square max-w-[300px] bg-muted rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <Camera className="w-12 h-12 text-muted-foreground" />
                    {hasPermission === false ? (
                        <div className="text-red-500 space-y-2">
                            <AlertCircle className="w-6 h-6 mx-auto" />
                            <p className="text-sm">Camera access denied.</p>
                            <p className="text-xs text-muted-foreground">Please allow camera access in your browser settings to scan passes.</p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Camera is inactive. Click below to start scanning.</p>
                    )}
                </div>
            )}

            {scannerError && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">
                    {scannerError}
                </div>
            )}

            <div className="mt-6 flex gap-4">
                {!isScanning ? (
                    <Button onClick={startScanner} size="lg" className="w-48 shadow-lg shadow-blue-500/20">
                        Start Scanner
                    </Button>
                ) : (
                    <Button onClick={stopScanner} variant="destructive" size="lg" className="w-48">
                        Stop Scanner
                    </Button>
                )}
            </div>

        </div>
    );
}
