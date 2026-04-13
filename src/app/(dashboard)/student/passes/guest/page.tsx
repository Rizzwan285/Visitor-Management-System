import { requireRole } from '@/lib/auth-utils';
import { StudentGuestPassForm } from '@/components/forms/StudentGuestPassForm';

export default async function StudentGuestPassPage() {
    await requireRole(['STUDENT', 'ADMIN']);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Request Guest Pass</h1>
                <p className="text-muted-foreground">Submit a guest visit request. A faculty member must approve it before the pass becomes active.</p>
            </div>
            <div className="bg-card p-6 rounded-xl border shadow-sm">
                <StudentGuestPassForm />
            </div>
        </div>
    );
}
