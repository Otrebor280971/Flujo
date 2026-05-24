import type { Currency } from '../lib/db';

export function formatMoney(amount: number, currency: Currency = 'MXN'): string {
  const currencyMap: Record<Currency, string> = {
    MXN: 'MXN',
    USD: 'USD',
    EUR: 'EUR',
  };

  // Show decimals only when the amount has meaningful cents
  const hasDecimals = Math.abs(amount) % 1 >= 0.005;

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currencyMap[currency],
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export function daysFromNow(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T12:00:00');
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}