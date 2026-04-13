import { requireRole } from '@/lib/auth-utils';
import { WalkinPassForm } from '@/components/forms/WalkinPassForm';

export default async function SecurityWalkinPage() {
    await requireRole(['SECURITY', 'ADMIN']);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Walk-in Visitor Pass</h1>
                <p className="text-muted-foreground">Register a walk-in visitor. Capture their photo, verify identity, and generate a temporary pass.</p>
            </div>
            <div className="bg-card p-6 rounded-xl border shadow-sm">
                <WalkinPassForm />
            </div>
        </div>
    );
}
