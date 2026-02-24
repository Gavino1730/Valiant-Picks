import axios from 'axios';

// Create a separate axios instance for error logging that doesn't use the main apiClient
// This prevents circular logging when error-log requests themselves fail
const errorLogClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || (
    typeof window !== 'undefined' && window.location.origin.includes('localhost')
      ? 'http://localhost:5000/api'
      : '/api'
  ),
  timeout: 5000, // Short timeout for error logging
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach auth token so error logs can be associated with the logged-in user
errorLogClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Rate limiting for error logging - prevent spam
const errorLogRateLimit = {
  lastLogTime: 0,
  errorCount: 0,
  maxErrorsPerMinute: 5,
  recentErrors: new Set() // Track unique errors to avoid duplicates
};

// Get current user info from localStorage
const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Log error to backend
export const logError = async (error, context = {}) => {
  try {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Reset counter if a minute has passed
    if (errorLogRateLimit.lastLogTime < oneMinuteAgo) {
      errorLogRateLimit.errorCount = 0;
      errorLogRateLimit.recentErrors.clear();
    }
    
    // Check rate limit
    if (errorLogRateLimit.errorCount >= errorLogRateLimit.maxErrorsPerMinute) {
      return; // Skip logging, rate limit exceeded
    }
    
    // Create a fingerprint for this error to avoid duplicate logging
    const errorFingerprint = `${error.message || ''}:${context.endpoint || ''}:${context.statusCode || ''}`;
    if (errorLogRateLimit.recentErrors.has(errorFingerprint)) {
      return; // Skip duplicate error
    }
    
    // Update rate limit tracking
    errorLogRateLimit.lastLogTime = now;
    errorLogRateLimit.errorCount++;
    errorLogRateLimit.recentErrors.add(errorFingerprint);

    // Pull user identity from localStorage so it's included even before the
    // auth token is decoded server-side (belt-and-suspenders for the username field)
    const currentUser = getCurrentUser();
    
    const errorData = {
      errorMessage: error.message || String(error),
      errorStack: error.stack || null,
      pageUrl: window.location.href,
      severity: context.severity || 'error',
      // Include user identity fields from localStorage
      clientUserId: currentUser?.id || null,
      clientUsername: currentUser?.username || null,
      // Spread all context fields (endpoint, method, type, statusCode,
      // componentStack, responseData, requestBody, etc.)
      ...context
    };

    // Don't wait for response - fire and forget
    // Use the separate error log client to avoid circular logging
    errorLogClient.post('/error-logs', errorData).catch(() => {
      // Silently fail - don't log errors about logging errors
    });
  } catch (err) {
    // Silently fail - don't want logging to break the app
  }
};

// Wrapper for async functions to catch and log errors
export const withErrorLogging = (fn, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { ...context, severity: 'error' });
      throw error; // Re-throw so app can handle it
    }
  };
};

// Global error handler for uncaught errors
export const setupGlobalErrorHandler = () => {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || '';
    // Suppress chunk load errors (handled by lazyWithRetry)
    if (message.includes('Loading chunk') || event.reason?.name === 'ChunkLoadError') {
      event.preventDefault();
      return;
    }
    logError(event.reason || new Error('Unhandled promise rejection'), {
      severity: 'critical',
      type: 'unhandledRejection'
    });
  });

  // Catch global errors
  window.addEventListener('error', (event) => {
    const message = event.error?.message || event.message || '';
    // Suppress chunk load errors and "undefined" JSON parse errors (already fixed at source)
    if (message.includes('Loading chunk') || message.includes('"undefined" is not valid JSON')) {
      event.preventDefault();
      return;
    }
    logError(event.error || new Error(event.message), {
      severity: 'critical',
      type: 'globalError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
};
