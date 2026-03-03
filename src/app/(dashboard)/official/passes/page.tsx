'use client';

import { PassList } from '@/components/passes/PassList';

export default function OfficialPassesPage() {
    return (
        <div className="space-y-6">
            <PassList basePath="/official/passes" title="Office Passes" showTypeFilter={false} />
        </div>
    );
}
