import axios from 'axios';

// Prefer environment override; otherwise use same-origin /api in prod and localhost:5000 in dev
const API_URL = process.env.REACT_APP_API_URL || (
  typeof window !== 'undefined' && window.location.origin.includes('localhost')
    ? 'http://localhost:5000/api'
    : '/api'
);

// Simple cache for GET requests (in-memory)
const responseCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token and implement caching
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
    
    // Check cache for GET requests
    if (config.method === 'get') {
      const cacheKey = config.url;
      const cached = responseCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // Return cached response immediately
        return Promise.reject({
          isCached: true,
          response: cached.data,
          config
        });
      }
    }
    
    return config;
  },
  (error) => {
    // If it's a cached response, return it
    if (error.isCached) {
      return Promise.resolve(error.response);
    }
    return Promise.reject(error);
  }
);

// Response interceptor to cache GET responses and handle token expiration
apiClient.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get') {
      responseCache.set(response.config.url, {
        data: response,
        timestamp: Date.now()
      });
    }
    return response;
  },
  (error) => {
    // If it's a cached response, return it immediately
    if (error.isCached) {
      return Promise.resolve(error.response);
    }
    
    // Handle 401 errors (token expired or invalid)
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
      const token = localStorage.getItem('token');
      if (isAuthRequest || !token) {
        return Promise.reject(error);
      }
      // Try to refresh the token
      return refreshToken().then(newToken => {
        if (newToken) {
          // Retry the original request with new token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient.request(error.config);
        } else {
          // Refresh failed, redirect to login
          window.location.href = '/';
          return Promise.reject(error);
        }
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_URL };
