import { requireRole } from '@/lib/auth-utils';
import { StudentExitPassForm } from '@/components/forms/StudentExitPassForm';

export default async function StudentExitPassPage() {
    await requireRole(['STUDENT', 'ADMIN']);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Request Exit Pass</h1>
                <p className="text-muted-foreground">Submit a campus exit request. You will receive an email confirmation once processed.</p>
            </div>
            <div className="bg-card p-6 rounded-xl border shadow-sm">
                <StudentExitPassForm />
            </div>
        </div>
    );
}
