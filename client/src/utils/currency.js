// Currency formatting utility
export const formatCurrency = (amount) => {
  return `$${parseFloat(amount || 0).toFixed(2)}`;
};

// Format currency for display in text
export const formatCurrencyText = (amount, suffix = '') => {
  return `${formatCurrency(amount)}${suffix ? ' ' + suffix : ''}`;
};
