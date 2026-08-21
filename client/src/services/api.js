import axios from 'axios';

/**
 * Centralized Axios HTTP Client
 * 
 * Responsibilities:
 * 1. Base URL configuration (VITE_API_URL environment variable with '/api' fallback)
 * 2. Request Interceptor: Automatically injects JWT Bearer token from localStorage
 * 3. Response Interceptor: Normalizes error formats and catches 401 Unauthorized responses
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('roxiler_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'An unexpected network error occurred';
    const errors = error.response?.data?.errors || [];

    if (status === 401 && !error.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new CustomEvent('roxiler:unauthorized'));
    }

    return Promise.reject({
      status,
      message,
      errors,
      raw: error
    });
  }
);

export default api;
