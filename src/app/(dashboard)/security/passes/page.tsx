'use client';

import { PassList } from '@/components/passes/PassList';

export default function SecurityPassesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Walk-in Passes</h1>
                <p className="text-muted-foreground">All walk-in passes you have registered. Click a pass to view full details and scan history.</p>
            </div>
            <div className="bg-card p-6 rounded-xl border shadow-sm">
                <PassList
                    basePath="/security/passes"
                    defaultPassType="WALKIN"
                    showTypeFilter={false}
                    title=""
                    createdByMe
                />
            </div>
        </div>
    );
}
