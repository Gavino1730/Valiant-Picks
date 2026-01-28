// Currency formatting utility - Always displays whole numbers by rounding up
export const formatCurrency = (amount) => {
  const num = parseFloat(amount || 0);
  // Always round up to whole number using Math.ceil()
  const roundedNum = Math.ceil(num);
  
  return `$${roundedNum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Format currency for display in text
export const formatCurrencyText = (amount, suffix = '') => {
  return `${formatCurrency(amount)}${suffix ? ' ' + suffix : ''}`;
};
