import { requireRole } from '@/lib/auth-utils';
import { OfficialPassForm } from '@/components/forms/OfficialPassForm';

export default async function NewOfficialPassPage() {
    await requireRole(['OFFICIAL', 'ADMIN']);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Office Pass</h1>
                <p className="text-muted-foreground">Register a visitor for official campus business.</p>
            </div>
            <div className="bg-card p-6 rounded-xl border shadow-sm">
                <OfficialPassForm />
            </div>
        </div>
    );
}
