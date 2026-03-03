'use client';

import type { ApiResponse } from '@/types/api.types';

/**
 * Centralized API client for frontend-to-backend communication.
 * All calls go through this layer for consistent error handling.
 */

class ApiError extends Error {
    code: string;
    status: number;
    details?: unknown;

    constructor(code: string, message: string, status: number, details?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

async function handleResponse<T>(res: Response): Promise<T> {
    const json: ApiResponse<T> = await res.json();

    if (!res.ok || !json.success) {
        throw new ApiError(
            json.error?.code || 'UNKNOWN_ERROR',
            json.error?.message || `Request failed with status ${res.status}`,
            res.status,
            json.error?.details
        );
    }

    return json.data as T;
}

export const api = {
    /**
     * GET request with optional query parameters.
     */
    async get<T>(url: string, params?: Record<string, string | number | undefined>): Promise<T> {
        const searchParams = new URLSearchParams();
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null && value !== '') {
                    searchParams.set(key, String(value));
                }
            }
        }
        const queryString = searchParams.toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;

        const res = await fetch(fullUrl);
        return handleResponse<T>(res);
    },

    /**
     * GET request that returns the full API response (including meta).
     */
    async getWithMeta<T>(url: string, params?: Record<string, string | number | undefined>): Promise<ApiResponse<T>> {
        const searchParams = new URLSearchParams();
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null && value !== '') {
                    searchParams.set(key, String(value));
                }
            }
        }
        const queryString = searchParams.toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;

        const res = await fetch(fullUrl);
        const json: ApiResponse<T> = await res.json();

        if (!res.ok || !json.success) {
            throw new ApiError(
                json.error?.code || 'UNKNOWN_ERROR',
                json.error?.message || `Request failed with status ${res.status}`,
                res.status,
                json.error?.details
            );
        }

        return json;
    },

    /**
     * POST request with JSON body.
     */
    async post<T>(url: string, body?: unknown): Promise<T> {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        });
        return handleResponse<T>(res);
    },

    /**
     * PATCH request with JSON body.
     */
    async patch<T>(url: string, body: unknown): Promise<T> {
        const res = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        return handleResponse<T>(res);
    },

    /**
     * DELETE request.
     */
    async del<T>(url: string): Promise<T> {
        const res = await fetch(url, { method: 'DELETE' });
        return handleResponse<T>(res);
    },

    /**
     * Upload a file via multipart/form-data.
     */
    async upload<T>(url: string, formData: FormData): Promise<T> {
        const res = await fetch(url, {
            method: 'POST',
            body: formData,
        });
        return handleResponse<T>(res);
    },
};

export { ApiError };
