import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface ActivityItem {
    id: string;
    visitorName: string;
    passType: string;
    status: 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRED' | 'REJECTED' | 'CANCELLED';
    time: string;
    initials: string;
    avatarUrl?: string;
    description: string;
}

interface RecentActivityProps {
    items: ActivityItem[];
    title?: string;
}

export function RecentActivity({ items, title = 'Recent Passes' }: RecentActivityProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">
                        No recent activity found.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={item.avatarUrl} alt={item.visitorName} />
                                    <AvatarFallback>{item.initials}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1 overflow-hidden">
                                    <p className="text-sm font-medium leading-none truncate pr-2">
                                        {item.visitorName}
                                    </p>
                                    <p className="text-sm text-slate-500 truncate pr-2">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="ml-auto flex flex-col items-end gap-1">
                                    <Badge
                                        variant={
                                            item.status === 'ACTIVE' ? 'default' :
                                                item.status === 'PENDING_APPROVAL' ? 'secondary' :
                                                    item.status === 'REJECTED' ? 'destructive' : 'outline'
                                        }
                                        className="text-[10px] px-1.5 py-0 h-4"
                                    >
                                        {item.status.replace('_', ' ')}
                                    </Badge>
                                    <div className="text-xs text-slate-400">
                                        {item.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
