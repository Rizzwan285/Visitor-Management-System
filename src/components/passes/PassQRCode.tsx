import QRCode from 'qrcode';

interface PassQRCodeProps {
    dataUrl: string;
    size?: number;
    className?: string;
}

export function PassQRCode({ dataUrl, size = 150, className = '' }: PassQRCodeProps) {
    if (!dataUrl) {
        return (
            <div
                className={`bg-slate-100 flex items-center justify-center border border-dashed rounded-md ${className}`}
                style={{ width: size, height: size }}
            >
                <span className="text-xs text-slate-400 text-center px-2">No QR Data</span>
            </div>
        );
    }

    return (
        <div className={`bg-white p-2 rounded-lg inline-block border shadow-sm ${className}`}>
            <img
                src={dataUrl}
                alt="Pass QR Code"
                width={size}
                height={size}
                className="w-full h-full object-contain"
            />
        </div>
    );
}
