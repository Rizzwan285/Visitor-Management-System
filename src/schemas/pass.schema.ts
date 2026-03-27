import { z } from 'zod/v4';

// ─── Base fields ────────────────────────────────────

const baseFields = {
    visitorName: z.string().min(2, 'Visitor name must be at least 2 characters'),
    visitorSex: z.enum(['MALE', 'FEMALE', 'OTHER']),
    purpose: z.string().min(1, 'Purpose is required'),
    visitFrom: z.iso.datetime({ message: 'Invalid visitFrom date' }),
    visitTo: z.iso.datetime({ message: 'Invalid visitTo date' }),
};

// ─── Pass Type Schemas (for discriminated union) ────

const employeeGuestObject = z.object({
    passType: z.literal('EMPLOYEE_GUEST'),
    ...baseFields,
});

const officialPassObject = z.object({
    passType: z.literal('OFFICIAL'),
    ...baseFields,
});

const studentGuestObject = z.object({
    passType: z.literal('STUDENT_GUEST'),
    ...baseFields,
    visitorRelation: z.string().min(1, 'Visitor relation is required'),
    visitorAge: z.number().int().positive('Age must be positive'),
    approverId: z.uuid('Invalid approver ID'),
});

const walkinPassObject = z.object({
    passType: z.literal('WALKIN'),
    ...baseFields,
    visitorMobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
    visitorAge: z.number().int().positive('Age must be positive'),
    visitorIdType: z.string().min(1, 'ID type is required'),
    visitorIdNumber: z.string().min(1, 'ID number is required'),
    visitorPhotoUrl: z.string().optional(),
    pointOfContact: z.string().min(1, 'Point of contact is required'),
    pocMobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
    phoneConfirmedBy: z.string().min(1, 'Phone confirmation is required'),
    visitorSignatureUrl: z.string().nullable().optional(),
    securitySignatureUrl: z.string().nullable().optional(),
    hostSignatureUrl: z.string().nullable().optional(),
});

const studentExitObject = z.object({
    passType: z.literal('STUDENT_EXIT'),
    ...baseFields,
    hostelName: z.string().min(1, 'Hostel name is required'),
});

// ─── Exported individual schemas (with refinement) ──

export const employeeGuestSchema = employeeGuestObject.refine(
    (data) => new Date(data.visitTo) > new Date(data.visitFrom),
    { message: 'visitTo must be after visitFrom', path: ['visitTo'] }
);

export const officialPassSchema = officialPassObject.refine(
    (data) => new Date(data.visitTo) > new Date(data.visitFrom),
    { message: 'visitTo must be after visitFrom', path: ['visitTo'] }
);

export const studentGuestSchema = studentGuestObject.refine(
    (data) => new Date(data.visitTo) > new Date(data.visitFrom),
    { message: 'visitTo must be after visitFrom', path: ['visitTo'] }
);

export const walkinPassSchema = walkinPassObject.refine(
    (data) => new Date(data.visitTo) > new Date(data.visitFrom),
    { message: 'visitTo must be after visitFrom', path: ['visitTo'] }
);

export const studentExitSchema = studentExitObject.refine(
    (data) => new Date(data.visitTo) > new Date(data.visitFrom),
    { message: 'visitTo must be after visitFrom', path: ['visitTo'] }
);

// ─── Discriminated Union (uses base objects, not refined) ──

export const createPassSchema = z.discriminatedUnion('passType', [
    employeeGuestObject,
    officialPassObject,
    studentGuestObject,
    walkinPassObject,
    studentExitObject,
]);

// ─── Filters Schema ────────────────────────────────

export const passFiltersSchema = z.object({
    passType: z
        .enum([
            'EMPLOYEE_GUEST',
            'OFFICIAL',
            'STUDENT_GUEST',
            'WALKIN',
            'STUDENT_EXIT',
        ])
        .optional(),
    status: z
        .enum([
            'DRAFT',
            'PENDING_APPROVAL',
            'APPROVED',
            'REJECTED',
            'ACTIVE',
            'EXPIRED',
            'CANCELLED',
        ])
        .optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});
