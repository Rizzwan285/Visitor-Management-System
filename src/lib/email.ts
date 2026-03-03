import { Resend } from 'resend';

/**
 * Resend client singleton.
 * Falls back to a stub when RESEND_API_KEY is not configured
 * so the app can start in development without a real key.
 */
const apiKey = process.env.RESEND_API_KEY;

export const resend = new Resend(apiKey || 're_placeholder_key');

export const isEmailConfigured = !!apiKey;
