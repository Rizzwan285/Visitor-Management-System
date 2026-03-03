'use client';

import { PassList } from '@/components/passes/PassList';

export default function AdminPassesPage() {
    return (
        <div className="space-y-6">
            <PassList basePath="/admin/passes" title="All Passes" showTypeFilter={true} />
        </div>
    );
}
