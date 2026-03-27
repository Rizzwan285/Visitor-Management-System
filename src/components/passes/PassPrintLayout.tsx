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
        <div className="print-layout hidden bg-white text-black font-sans p-8 w-full max-w-4xl mx-auto border-2 border-slate-800">

            {/* Header */}
            <div className="flex justify-between items-center border-b-4 border-slate-800 pb-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        IIT
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-wider text-black">Indian Institute of Technology Palakkad</h1>
                        <h2 className="text-xl font-semibold mt-1 text-slate-700 uppercase">{pass.passType.replace('_', ' ')} PASS</h2>
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
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-b border-slate-300 pb-6">
                        <div className="col-span-2">
                            <span className="text-sm font-bold uppercase text-slate-500 block mb-1">Visitor Name</span>
                            <span className="text-2xl font-bold uppercase block">{pass.visitorName}</span>
                        </div>

                        <div>
                            <span className="text-sm font-bold uppercase text-slate-500 block mb-1">Age / Sex</span>
                            <span className="text-lg uppercase">{pass.visitorAge || 'N/A'} / {pass.visitorSex}</span>
                        </div>

                        <div>
                            <span className="text-sm font-bold uppercase text-slate-500 block mb-1">Mobile</span>
                            <span className="text-lg">{pass.visitorMobile || 'N/A'}</span>
                        </div>

                        <div className="col-span-2">
                            <span className="text-sm font-bold uppercase text-slate-500 block mb-1">Purpose of Visit</span>
                            <span className="text-lg">{pass.purpose}</span>
                        </div>

                        {pass.pointOfContact && (
                            <div className="col-span-2">
                                <span className="text-sm font-bold uppercase text-slate-500 block mb-1">Host / Point of Contact</span>
                                <span className="text-lg font-semibold">{pass.pointOfContact}</span>
                            </div>
                        )}

                        {pass.visitorRelation && (
                            <div className="col-span-2">
                                <span className="text-sm font-bold uppercase text-slate-500 block mb-1">Relation to Host</span>
                                <span className="text-lg">{pass.visitorRelation}</span>
                            </div>
                        )}

                        {pass.hostelName && (
                            <div className="col-span-2">
                                <span className="text-sm font-bold uppercase text-slate-500 block mb-1">Hostel</span>
                                <span className="text-lg">{pass.hostelName}</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-100 p-4 border border-slate-300 rounded mb-6">
                        <span className="text-sm font-bold uppercase text-slate-500 block mb-2 text-center">Validity Period</span>
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
                        <div className="w-48 h-48 bg-slate-200 border-2 border-slate-400 mb-6 overflow-hidden flex items-center justify-center">
                            <img src={`/api/passes/${pass.id}/photo`} alt="Visitor" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className="w-64 h-64 border-4 border-black p-2 flex items-center justify-center mb-6">
                        {qrUrl ? (
                            <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center">QR PENDING</div>
                        )}
                    </div>

                    <div className="text-center font-bold uppercase text-sm mb-12">Scan for Entry/Exit</div>

                </div>
            </div>

            {/* Footer Signatures */}
            <div className="mt-16 flex justify-between px-8">
                <div className="w-52 text-center">
                    {pass.visitorSignatureUrl && (
                        <img src={pass.visitorSignatureUrl} alt="Visitor Signature" className="h-16 mx-auto mb-1 object-contain" />
                    )}
                    <div className="border-t-2 border-black pt-2 w-full font-bold uppercase text-xs">Visitor Signature</div>
                </div>
                <div className="w-52 text-center">
                    {pass.securitySignatureUrl && (
                        <img src={pass.securitySignatureUrl} alt="Security Signature" className="h-16 mx-auto mb-1 object-contain" />
                    )}
                    <div className="border-t-2 border-black pt-2 w-full font-bold uppercase text-xs">Security Officer</div>
                </div>
                <div className="w-52 text-center">
                    {pass.hostSignatureUrl && (
                        <img src={pass.hostSignatureUrl} alt="Host Signature" className="h-16 mx-auto mb-1 object-contain" />
                    )}
                    <div className="border-t-2 border-black pt-2 w-full font-bold uppercase text-xs">Host / Countersign</div>
                </div>
            </div>

            <div className="mt-12 text-center text-sm font-mono border-t border-slate-300 pt-4">
                This pass is property of IIT Palakkad. Must be surrendered upon exiting the campus.
            </div>
        </div>
    );
}
