// Form Validation Utilities
import { formatCurrency } from './currency';

export const validateUsername = (username) => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 20) return 'Username must be less than 20 characters';
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Username can only contain letters, numbers, dashes, and underscores';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return '';
};

export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return '';
};

export const validateBetAmount = (amount, balance) => {
  const num = parseFloat(amount);
  if (!amount) return 'Amount is required';
  if (isNaN(num)) return 'Please enter a valid number';
  if (num <= 0) return 'Amount must be greater than 0';
  if (num > balance) return `You only have ${formatCurrency(balance)} Valiant Bucks available`;
  if (num > 10000) return 'Maximum bet is 10,000 Valiant Bucks';
  return '';
};

export const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  return {
    score: strength,
    label: strength < 2 ? 'Weak' : strength < 4 ? 'Good' : 'Strong'
  };
};
