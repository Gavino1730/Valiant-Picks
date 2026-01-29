// Currency formatting utility - Always displays whole numbers (no cents)
// Rounds away from zero: positive values round up, negative values round down
export const formatCurrency = (amount) => {
  const num = parseFloat(amount || 0);
  
  // For negative values, round down (more negative, away from zero)
  // For positive values, round up (more positive, away from zero)
  const roundedNum = num >= 0 ? Math.ceil(num) : Math.floor(num);
  
  return `$${roundedNum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Format currency for display in text
export const formatCurrencyText = (amount, suffix = '') => {
  return `${formatCurrency(amount)}${suffix ? ' ' + suffix : ''}`;
};
