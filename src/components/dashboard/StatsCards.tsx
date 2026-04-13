import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface Stat {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
        positive: boolean;
    };
}

interface StatsCardsProps {
    stats: Stat[];
}

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                        </CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>

                        {(stat.description || stat.trend) && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                {stat.trend && (
                                    <span className={stat.trend.positive ? 'text-green-600' : 'text-muted-foreground'}>
                                        {stat.trend.positive ? '↑' : '↓'} {Math.abs(stat.trend.value)}%
                                    </span>
                                )}
                                <span className={stat.trend ? 'ml-1' : ''}>
                                    {stat.description || stat.trend?.label}
                                </span>
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
