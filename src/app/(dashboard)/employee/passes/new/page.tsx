import { requireRole } from '@/lib/auth-utils';
import { EmployeePassForm } from '@/components/forms/EmployeePassForm';

export default async function NewEmployeePassPage() {
    await requireRole(['EMPLOYEE', 'ADMIN']);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Register Guest</h1>
                <p className="text-muted-foreground">Create a visitor pass for your upcoming guest.</p>
            </div>
            <div className="bg-card p-6 rounded-xl border shadow-sm">
                <EmployeePassForm />
            </div>
        </div>
    );
}
