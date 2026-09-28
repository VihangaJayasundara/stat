/**
 * UI Data Formatting Utilities
 * Standardizes units and ensures non-technical management clarity.
 */

export function formatCurrency(amount) {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
}

export function formatPercentage(fraction, decimals = 1) {
  if (fraction === undefined || fraction === null || isNaN(fraction)) return '0.0%';
  return `${(Number(fraction) * 100).toFixed(decimals)}%`;
}

export function formatInteger(number) {
  const val = Math.round(Number(number) || 0);
  return new Intl.NumberFormat('en-GB').format(val);
}

export function formatDays(days) {
  const val = Math.round(Number(days) || 0);
  return `${val} ${val === 1 ? 'day' : 'days'}`;
}

export function formatOrders(orders) {
  const val = Math.round(Number(orders) || 0);
  return `${val} ${val === 1 ? 'order' : 'orders'}`;
}
