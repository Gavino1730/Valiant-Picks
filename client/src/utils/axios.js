import axios from 'axios';
import { logError } from './errorLogging';

// Prefer environment override; otherwise use same-origin /api in prod and localhost:5000 in dev
const API_URL = process.env.REACT_APP_API_URL || (
  typeof window !== 'undefined' && window.location.origin.includes('localhost')
    ? 'http://localhost:5000/api'
    : '/api'
);

// Token refresh tracking
let tokenRefreshPromise = null;

// Function to refresh the token
const refreshToken = async () => {
  // If already refreshing, return existing promise
  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newToken = response.data.token;
      const userData = response.data.user;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear auth data if refresh fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('currentPage');
      window.location.href = '/';
      return null;
    } finally {
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
};

// Check if token needs refresh (refresh 1 day before expiration)
const shouldRefreshToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    // Refresh if token expires in less than 1 day
    return (expiresAt - now) < oneDayInMs;
  } catch (error) {
    return false;
  }
};

// Start periodic token refresh check
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (shouldRefreshToken()) {
      refreshToken();
    }
  }, 60 * 60 * 1000); // Check every hour
}

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased to 30 seconds for slower networks and polling
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Check if token needs refresh before making request
    if (shouldRefreshToken()) {
      await refreshToken();
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Log API errors (except auth failures which are normal)
    if (error.response?.status >= 500) {
      logError(error, {
        severity: 'error',
        type: 'apiError',
        endpoint: error.config?.url,
        method: error.config?.method,
        statusCode: error.response?.status,
        responseData: error.response?.data
      });
    }
    
    // Handle 401 errors (token expired or invalid)
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
      
      // Don't retry auth requests or requests that have already been retried
      if (isAuthRequest || error.config._retry) {
        return Promise.reject(error);
      }
      
      // Mark this request as retried to prevent infinite loops
      error.config._retry = true;
      
      // Try to refresh the token
      try {
        const newToken = await refreshToken();
        if (newToken) {
          // Retry the original request with new token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient.request(error.config);
        } else {
          // Refresh failed, redirect to login
          window.location.href = '/';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_URL };
