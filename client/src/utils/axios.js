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
  (config) => {
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
);

export default apiClient;
export { API_URL };
