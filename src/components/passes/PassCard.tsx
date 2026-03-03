import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { VisitorPassWithDetails } from '@/hooks/usePasses';
import { format } from 'date-fns';
import { Clock, User } from 'lucide-react';
import Link from 'next/link';

interface PassCardProps {
    pass: VisitorPassWithDetails;
    href: string;
}

export function PassCard({ pass, href }: PassCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'default'; // primary color
            case 'PENDING_APPROVAL': return 'secondary'; // yellow-ish
            case 'REJECTED': return 'destructive'; // red
            case 'CANCELLED':
            case 'EXPIRED': return 'outline'; // grey
            default: return 'outline';
        }
    };

    return (
        <Link href={href}>
            <Card className="hover:bg-slate-50 transition-colors cursor-pointer border-slate-200">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold leading-none">{pass.visitorName}</h4>
                            <p className="text-sm text-slate-500 line-clamp-1">{pass.purpose}</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2">
                        <Badge variant={getStatusColor(pass.status)} className="w-fit">
                            {pass.status.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center text-xs text-slate-500 gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(pass.visitFrom), 'MMM d, h:mm a')}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
