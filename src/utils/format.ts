/**
 * Formatting utilities for the Mexican B2B SaaS platform.
 * Consistent currency (MXN) and date (es-MX) formatting across the app.
 */

/**
 * Format a number as Mexican Pesos (MXN).
 * @example formatMXN(1500)    → "$1,500.00"
 * @example formatMXN(1500, false) → "$1,500"
 */
export function formatMXN(amount: number | string | null | undefined, decimals = true): string {
    const num = Number(amount) || 0;
    return num.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: decimals ? 2 : 0,
        maximumFractionDigits: decimals ? 2 : 0,
    });
}

/**
 * Format a date string/Date to readable locale format.
 * @example formatDate('2026-03-05T12:00:00Z') → "5 mar 2026"
 * @example formatDate('2026-03-05', 'long')   → "5 de marzo de 2026"
 */
export function formatDate(
    date: string | Date | null | undefined,
    style: 'short' | 'long' | 'datetime' = 'short'
): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';

    switch (style) {
        case 'long':
            return d.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        case 'datetime':
            return d.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        case 'short':
        default:
            return d.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
    }
}

/**
 * Format a number with thousand separators (es-MX locale).
 * @example formatNumber(12345) → "12,345"
 */
export function formatNumber(n: number | string | null | undefined): string {
    const num = Number(n) || 0;
    return num.toLocaleString('es-MX');
}

/**
 * Format a percentage.
 * @example formatPercent(16) → "16%"
 */
export function formatPercent(n: number | string | null | undefined): string {
    const num = Number(n) || 0;
    return `${num}%`;
}
