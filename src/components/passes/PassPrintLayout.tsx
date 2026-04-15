import { VisitorPassWithDetails } from '@/hooks/usePasses';
import { format } from 'date-fns';

interface PassPrintLayoutProps {
    pass: VisitorPassWithDetails;
}

export function PassPrintLayout({ pass }: PassPrintLayoutProps) {
    // Use the server-generated QR code URL directly
    const qrUrl = pass.qrCodeUrl || '';

    // This component handles exactly what happens on the printed page
    return (
        <div className="print-layout hidden bg-card text-foreground font-sans p-8 w-full max-w-4xl mx-auto border-2 border-border">

            {/* Header */}
            <div className="flex justify-between items-center border-b-4 border-border pb-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        IIT
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-wider text-foreground">Indian Institute of Technology Palakkad</h1>
                        <h2 className="text-xl font-semibold mt-1 text-foreground uppercase">{pass.passType.replace('_', ' ')} PASS</h2>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-mono text-xl font-bold uppercase">No. {pass.passNumber || pass.id.split('-')[0]}</div>
                    <div className="text-sm mt-1">Issued: {format(new Date(pass.createdAt), 'dd/MM/yyyy HH:mm')}</div>
                </div>
            </div>

            <div className="flex gap-12">

                {/* Left Col - Details */}
                <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-b border-border pb-6">
                        <div className="col-span-2">
                            <span className="text-sm font-bold uppercase text-muted-foreground block mb-1">Visitor Name</span>
                            <span className="text-2xl font-bold uppercase block">{pass.visitorName}</span>
                        </div>

                        <div>
                            <span className="text-sm font-bold uppercase text-muted-foreground block mb-1">Age / Sex</span>
                            <span className="text-lg uppercase">{pass.visitorAge || 'N/A'} / {pass.visitorSex}</span>
                        </div>

                        <div>
                            <span className="text-sm font-bold uppercase text-muted-foreground block mb-1">Mobile</span>
                            <span className="text-lg">{pass.visitorMobile || 'N/A'}</span>
                        </div>

                        <div className="col-span-2">
                            <span className="text-sm font-bold uppercase text-muted-foreground block mb-1">Purpose of Visit</span>
                            <span className="text-lg">{pass.purpose}</span>
                        </div>

                        {pass.pointOfContact && (
                            <div className="col-span-2">
                                <span className="text-sm font-bold uppercase text-muted-foreground block mb-1">Host / Point of Contact</span>
                                <span className="text-lg font-semibold">{pass.pointOfContact}</span>
                            </div>
                        )}

                        {pass.visitorRelation && (
                            <div className="col-span-2">
                                <span className="text-sm font-bold uppercase text-muted-foreground block mb-1">Relation to Host</span>
                                <span className="text-lg">{pass.visitorRelation}</span>
                            </div>
                        )}

                        {pass.hostelName && (
                            <div className="col-span-2">
                                <span className="text-sm font-bold uppercase text-muted-foreground block mb-1">Hostel</span>
                                <span className="text-lg">{pass.hostelName}</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-muted p-4 border border-border rounded mb-6">
                        <span className="text-sm font-bold uppercase text-muted-foreground block mb-2 text-center">Validity Period</span>
                        <div className="flex justify-between items-center px-4">
                            <div className="text-center w-1/2">
                                <span className="block font-bold text-lg">{format(new Date(pass.visitFrom), 'dd MMM yyyy')}</span>
                                <span className="block mt-1 font-mono">{format(new Date(pass.visitFrom), 'HH:mm')}</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-300 py-1">&rarr;</div>
                            <div className="text-center w-1/2">
                                <span className="block font-bold text-lg">{format(new Date(pass.visitTo), 'dd MMM yyyy')}</span>
                                <span className="block mt-1 font-mono">{format(new Date(pass.visitTo), 'HH:mm')}</span>
                            </div>
                        </div>
                    </div>

                    {pass.visitorIdType && (
                        <div className="text-sm text-center italic mt-4 mb-2">
                            Identity verified via {pass.visitorIdType} ({pass.visitorIdNumber})
                        </div>
                    )}

                </div>

                {/* Right Col - QR & Photo & Signatures */}
                <div className="w-72 flex flex-col items-center">

                    {pass.visitorPhotoUrl && (
                        <div className="w-48 h-48 bg-muted/80 border-2 border-border mb-6 overflow-hidden flex items-center justify-center">
                            <img src={pass.visitorPhotoUrl} alt="Visitor" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className="w-64 h-64 border-4 border-black p-2 flex items-center justify-center mb-6">
                        {qrUrl ? (
                            <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full bg-muted/80 flex items-center justify-center">QR PENDING</div>
                        )}
                    </div>

                    <div className="text-center font-bold uppercase text-sm mb-12">Scan for Entry/Exit</div>

                </div>
            </div>

            {/* Footer Signatures */}
            <div className="mt-8 flex justify-between items-end">
                <div className="w-1/4 text-center">
                    <div className="h-16 w-full"></div>
                    <div className="border-t-2 border-black pt-2 w-full font-bold uppercase text-xs">Visitor Signature</div>
                </div>
                <div className="w-1/4 text-center">
                    <div className="h-16 w-full"></div>
                    <div className="border-t-2 border-black pt-2 w-full font-bold uppercase text-xs">Security Signature</div>
                </div>
                <div className="w-1/4 text-center">
                    <div className="h-16 w-full"></div>
                    <div className="border-t-2 border-black pt-2 w-full font-bold uppercase text-xs">Host Signature</div>
                </div>
            </div>

            <div className="mt-12 text-center text-sm font-mono border-t border-border pt-4">
                This pass is property of IIT Palakkad. Must be surrendered upon exiting the campus.
            </div>
        </div>
    );
}
