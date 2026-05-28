export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'NGN', name: 'Nigerian Naira',    symbol: '₦',   locale: 'en-NG' },
  { code: 'USD', name: 'US Dollar',         symbol: '$',   locale: 'en-US' },
  { code: 'EUR', name: 'Euro',              symbol: '€',   locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound',     symbol: '£',   locale: 'en-GB' },
  { code: 'GHS', name: 'Ghanaian Cedi',     symbol: '₵',   locale: 'en-GH' },
  { code: 'KES', name: 'Kenyan Shilling',   symbol: 'KSh', locale: 'sw-KE' },
  { code: 'ZAR', name: 'South African Rand',symbol: 'R',   locale: 'en-ZA' },
];

export const DEFAULT_CURRENCY = 'NGN';

export function getCurrencyConfig(code: string): CurrencyConfig {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function getCurrencySymbol(code: string): string {
  return getCurrencyConfig(code).symbol;
}

/**
 * Format a monetary amount in the given currency.
 * React Native's Hermes engine supports Intl.NumberFormat — falls back
 * to symbol-prefix if the locale/currency isn't available.
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  options: { compact?: boolean; decimals?: number } = {},
): string {
  const { compact = false, decimals = 0 } = options;
  const cfg = getCurrencyConfig(currency);

  try {
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: cfg.code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...(compact ? { notation: 'compact', compactDisplay: 'short' } : {}),
    }).format(amount);
  } catch {
    // Hermes fallback
    if (compact) {
      if (amount >= 1_000_000) return `${cfg.symbol}${(amount / 1_000_000).toFixed(1)}M`;
      if (amount >= 1_000)     return `${cfg.symbol}${(amount / 1_000).toFixed(0)}K`;
    }
    return `${cfg.symbol}${amount.toLocaleString()}`;
  }
}

export function formatCompact(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  return formatCurrency(amount, currency, { compact: true, decimals: 1 });
}
