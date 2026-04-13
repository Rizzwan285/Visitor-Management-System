'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePassDetail } from '@/hooks/usePasses';
import { PassDetail } from '@/components/passes/PassDetail';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function WardenPassDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const { data: pass, isLoading, isError } = usePassDetail(id);

    if (isLoading) {
        return <div className="p-12 text-center text-muted-foreground">Loading tracking history...</div>;
    }

    if (isError || !pass) {
        return (
            <div className="p-12 text-center text-red-500">
                <h2 className="text-lg font-bold">Record not found</h2>
                <Button variant="link" onClick={() => router.back()}>Go back</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="no-print mb-4">
                <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" /> Back to Monitoring List
                </Button>
            </div>
            {/* Warden role strips out cancellation rights natively rendering as an observer */}
            <PassDetail pass={pass} role="ASSISTANT_WARDEN" />
        </div>
    );
}
