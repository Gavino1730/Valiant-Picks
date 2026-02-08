import { formatCurrency } from './currency';

const DEFAULT_LOCALE = 'en-US';

export const formatNumber = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString(DEFAULT_LOCALE, { maximumFractionDigits: 0 });
};

export const formatDate = (dateValue, options = {}) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Date TBD';
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  }).format(date);
};

export const formatSignedCurrency = (value) => {
  if (!Number.isFinite(Number(value))) {
    return formatCurrency(0);
  }
  const amount = Number(value);
  const formatted = formatCurrency(Math.abs(amount));
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
};

export const formatSignedPercentage = (value) => {
  if (!Number.isFinite(Number(value))) {
    return '0%';
  }
  const amount = Number(value);
  const formatted = Math.abs(amount).toLocaleString(DEFAULT_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  if (amount > 0) return `+${formatted}%`;
  if (amount < 0) return `-${formatted}%`;
  return `${formatted}%`;
};

export const getValueClass = (value) => {
  if (!Number.isFinite(Number(value))) return '';
  if (value > 0) return 'u-positive';
  if (value < 0) return 'u-negative';
  return '';
};

export { formatCurrency };
