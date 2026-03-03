export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    meta?: PaginationMeta;
    error: ApiError | null;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string[]> | Array<{ field: string; message: string }>;
}

// Helper to create success responses
export function successResponse<T>(
    data: T,
    meta?: PaginationMeta
): ApiResponse<T> {
    return { success: true, data, meta, error: null };
}

// Helper to create error responses
export function errorResponse(
    code: string,
    message: string,
    details?: ApiError['details']
): ApiResponse<null> {
    return { success: false, data: null, error: { code, message, details } };
}
