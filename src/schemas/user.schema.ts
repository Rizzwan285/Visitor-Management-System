import { z } from 'zod/v4';

export const credentialsSchema = z.object({
    email: z.email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
