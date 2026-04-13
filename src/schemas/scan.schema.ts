import { z } from 'zod/v4';

export const scanInputSchema = z.object({
    scanType: z.enum(['ENTRY', 'INTERMEDIATE_EXIT', 'FINAL_EXIT', 'STUDENT_EXIT_OUT', 'STUDENT_EXIT_RETURN', 'STUDENT_EXIT_AUTO']),
    gateLocation: z.string().optional(),
    notes: z.string().optional(),
});

export type ScanInput = z.infer<typeof scanInputSchema>;
