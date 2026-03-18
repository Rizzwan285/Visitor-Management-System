import { z } from 'zod/v4';

export const scanInputSchema = z.object({
    scanType: z.enum(['ENTRY', 'INTERMEDIATE_EXIT', 'EXIT']),
    gateLocation: z.string().optional(),
    notes: z.string().optional(),
});

export type ScanInput = z.infer<typeof scanInputSchema>;
