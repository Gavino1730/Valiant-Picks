import apiClient from './axios';

// Log error to backend
export const logError = async (error, context = {}) => {
  try {
    const errorData = {
      errorMessage: error.message || String(error),
      errorStack: error.stack || null,
      pageUrl: window.location.href,
      severity: context.severity || 'error',
      ...context
    };

    // Don't wait for response - fire and forget
    apiClient.post('/error-logs', errorData).catch(err => {
      console.error('Failed to log error to server:', err);
    });
  } catch (err) {
    // Silently fail - don't want logging to break the app
    console.error('Error in logError:', err);
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
    logError(event.reason || new Error('Unhandled promise rejection'), {
      severity: 'critical',
      type: 'unhandledRejection'
    });
  });

  // Catch global errors
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      severity: 'critical',
      type: 'globalError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
};
