'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Phone, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function OverstayerAlerts() {
    const [overstayers, setOverstayers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOverstayers = async () => {
        try {
            const res = await fetch('/api/alerts/overstayers');
            if (res.ok) {
                const data = await res.json();
                setOverstayers(data);
            }
        } catch (error) {
            console.error('Failed to fetch overstayers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOverstayers();
        const interval = setInterval(fetchOverstayers, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (isLoading) return <div className="h-48 bg-slate-50 animate-pulse rounded-xl" />;
    if (overstayers.length === 0) return null;

    return (
        <Card className="border-red-200 bg-red-50/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-red-700 flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5" />
                    Security Alert: Overstaying Visitors
                </CardTitle>
                <p className="text-xs text-red-600 font-medium">
                    The following visitors are still marked as &quot;Inside&quot; despite their pass expiring.
                </p>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {overstayers.map((visitor) => (
                        <div key={visitor.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{visitor.visitorName}</span>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold bg-white">{visitor.passType.replace('_', ' ')}</Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        POC: {visitor.pointOfContact || 'N/A'}
                                    </div>
                                    {visitor.visitorMobile && (
                                        <div className="flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {visitor.visitorMobile}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                <Clock className="h-3 w-3" />
                                Expired {formatDistanceToNow(new Date(visitor.visitTo))} ago
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
