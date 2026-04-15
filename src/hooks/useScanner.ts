import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useScanner() {
    const queryClient = useQueryClient();

    const verifyQR = useMutation({
        mutationFn: async (qrData: string) => {
            const res = await fetch(`/api/passes/verify?code=${encodeURIComponent(qrData)}`);
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error?.message || 'Invalid or expired QR code');
            }

            return json.data;
        },
    });

    const logScan = useMutation({
        mutationFn: async ({ passId, scanType, gateLocation, deviationReason }: { passId: string, scanType: 'ENTRY' | 'INTERMEDIATE_EXIT' | 'INTERMEDIATE_ENTRY' | 'FINAL_EXIT' | 'STUDENT_EXIT_OUT' | 'STUDENT_EXIT_RETURN' | 'STUDENT_EXIT_AUTO', gateLocation: string, deviationReason?: string }) => {
            const res = await fetch(`/api/passes/${passId}/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scanType, gateLocation, deviationReason }),
            });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error?.message || 'Failed to log scan');
            }

            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['passes'] });
        },
    });

    return { verifyQR, logScan };
}
