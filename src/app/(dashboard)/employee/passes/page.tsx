'use client';

import { PassList } from '@/components/passes/PassList';

export default function EmployeePassesPage() {
    return (
        <div className="space-y-6">
            <PassList basePath="/employee/passes" title="My Passes" showTypeFilter={false} />
        </div>
    );
}
