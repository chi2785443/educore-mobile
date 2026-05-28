import { useAuthStore } from '@/store/authStore';
import {
  formatCurrency,
  formatCompact,
  getCurrencySymbol,
  getCurrencyConfig,
  DEFAULT_CURRENCY,
} from '@/lib/currency';

/**
 * Returns currency helpers scoped to the currently selected school's currency.
 * Use this everywhere a financial amount is displayed so the school's chosen
 * currency is applied consistently across the app.
 *
 * Usage:
 *   const { format, formatCompact, symbol } = useCurrency();
 *   <Text>{format(amount)}</Text>
 */
export function useCurrency() {
  const { selectedSchoolId, user } = useAuthStore();

  const selectedSchool = user?.schools?.find(
    (s) => s.schoolId === selectedSchoolId,
  )?.school;

  const currency: string = selectedSchool?.currency ?? DEFAULT_CURRENCY;
  const config = getCurrencyConfig(currency);

  return {
    currency,
    config,
    symbol: getCurrencySymbol(currency),
    format: (amount: number, decimals = 0) =>
      formatCurrency(amount, currency, { decimals }),
    formatCompact: (amount: number) => formatCompact(amount, currency),
  };
}
