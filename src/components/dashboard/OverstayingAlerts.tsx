'use client';

import { useOverstayingAlerts } from '@/hooks/useDashboard';
import { differenceInMinutes } from 'date-fns';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import React from 'react';

export function OverstayingAlerts() {
    const { data: overstayingData, isLoading } = useOverstayingAlerts();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" /> Active Alerts: Overstaying Visitors
                </h2>
                <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (!overstayingData || overstayingData.length === 0) {
        return (
            <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="font-semibold text-sm">No Overstaying Visitors</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" /> Active Alerts: Overstaying Visitors ({overstayingData.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {overstayingData.map((pass: any) => {
                    const overdueMins = differenceInMinutes(new Date(), new Date(pass.visitTo));
                    
                    return (
                        <div key={pass.id} className="bg-red-50 border border-red-200 text-red-900 shadow-sm relative overflow-hidden rounded-xl p-4">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Clock className="w-16 h-16" />
                            </div>
                            <div className="font-bold flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {pass.visitorName}
                                </div>
                                <span className="text-xs font-mono bg-red-100 text-red-800 px-2 py-1 rounded">
                                    {pass.passNumber}
                                </span>
                            </div>
                            <div className="text-sm space-y-1 relative z-10">
                                <p><span className="font-semibold">Type:</span> {pass.passType.replace('_', ' ')}</p>
                                <p><span className="font-semibold">Host:</span> {pass.pointOfContact || 'N/A'}</p>
                                
                                <p className="font-bold text-red-700 mt-2 text-base flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Overdue by {overdueMins} minutes
                                </p>
                                
                                <div className="pt-3 mt-3 border-t border-red-200 flex flex-col gap-2">
                                    {(pass.visitorMobile || pass.pocMobile || pass.ccEmails) ? (
                                        <>
                                            {pass.visitorMobile && (
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-xs text-red-600 uppercase tracking-wider">Visitor Phone</span>
                                                    <a href={`tel:${pass.visitorMobile}`} className="bg-white border border-red-200 hover:bg-red-100 px-3 py-1 rounded text-red-800 font-medium transition-colors">
                                                        {pass.visitorMobile}
                                                    </a>
                                                </div>
                                            )}
                                            {pass.pocMobile && (
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="font-semibold text-xs text-red-600 uppercase tracking-wider">Host Phone</span>
                                                    <a href={`tel:${pass.pocMobile}`} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-medium transition-colors shadow-sm text-center">
                                                        Call Host
                                                    </a>
                                                </div>
                                            )}
                                            {pass.ccEmails && Array.isArray(pass.ccEmails) && pass.ccEmails.length > 0 && (
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="font-semibold text-xs text-red-600 uppercase tracking-wider">Host Email</span>
                                                    <a href={`mailto:${pass.ccEmails[0]}`} className="bg-white border border-red-200 hover:bg-red-100 px-3 py-1 rounded text-red-800 font-medium transition-colors truncate max-w-[150px]">
                                                        {pass.ccEmails[0]}
                                                    </a>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-xs italic text-red-500">No contact info available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
