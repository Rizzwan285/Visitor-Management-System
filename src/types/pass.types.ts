import type { PassType, PassStatus, Sex } from '@prisma/client';

export interface CreatePassInput {
    passType: PassType;
    visitorName: string;
    visitorSex: Sex;
    purpose: string;
    visitFrom: string; // ISO8601
    visitTo: string; // ISO8601
    visitorRelation?: string;
    visitorAge?: number;
    visitorMobile?: string;
    visitorIdType?: string;
    visitorIdNumber?: string;
    visitorPhotoUrl?: string;
    pointOfContact?: string;
    phoneConfirmedBy?: string;
    hostelName?: string;
    approverId?: string;
}

export interface UpdatePassInput {
    visitorName?: string;
    visitorSex?: Sex;
    purpose?: string;
    visitFrom?: string;
    visitTo?: string;
    visitorRelation?: string;
    visitorAge?: number;
    visitorMobile?: string;
    pointOfContact?: string;
    pocMobile?: string;
    hostelName?: string;
}

export interface PassFilters {
    passType?: PassType;
    status?: PassStatus;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    createdByMe?: boolean;
}
