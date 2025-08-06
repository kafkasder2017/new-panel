// utils/format.ts
// Para, tarih ve genel metin formatlayıcı yardımcılar

export type CurrencyCode = 'TRY' | 'USD' | 'EUR';

export function formatCurrency(
  value: number | string | null | undefined,
  currency: CurrencyCode = 'TRY',
  locale: string = 'tr-TR'
): string {
  const num = typeof value === 'string' ? Number(value) : value ?? 0;
  if (!isFinite(num as number)) return '-';
  try {
    return (num as number).toLocaleString(locale, { style: 'currency', currency });
  } catch {
    // Bazı ortamlarda Intl davranışı farklı olabilir; graceful fallback
    return `${num} ${currency}`;
  }
}

export function formatNumber(
  value: number | string | null | undefined,
  locale: string = 'tr-TR',
  options?: Intl.NumberFormatOptions
): string {
  const num = typeof value === 'string' ? Number(value) : value ?? 0;
  if (!isFinite(num as number)) return '-';
  try {
    return (num as number).toLocaleString(locale, options);
  } catch {
    return String(num);
  }
}

export function formatDate(
  date: Date | string | number | null | undefined,
  locale: string = 'tr-TR',
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }
): string {
  if (!date) return '-';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  try {
    return d.toLocaleDateString(locale, options);
  } catch {
    // Fallback: YYYY-MM-DD
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

export function formatDateISO(date: Date | string | number = new Date()): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function parseNumberSafe(value: any, defaultValue = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
}

export function joinName(first?: string | null, last?: string | null): string {
  return [first ?? '', last ?? ''].join(' ').trim() || '-';
}

export function truncate(text: string | null | undefined, max = 120): string {
  const t = text ?? '';
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}
