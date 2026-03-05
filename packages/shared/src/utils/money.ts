export function parseMoney(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return Math.round(value * 100);
  }

  const cleaned = value.toString().replace(/[$,\s]/g, '').trim();

  if (cleaned === '') {
    return 0;
  }

  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100);
}

export function formatMoney(cents: number, currency: string = 'USD'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function centsToDecimal(cents: number): number {
  return cents / 100;
}

export function decimalToCents(decimal: number): number {
  return Math.round(decimal * 100);
}
