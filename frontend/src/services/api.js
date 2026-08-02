import axios from 'axios';

// Detect if running inside a Capacitor native shell (Android/iOS)
export const isNativePlatform = () => {
  try {
    if (window.Capacitor) {
      if (typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) return true;
      if (typeof window.Capacitor.getPlatform === 'function' && (window.Capacitor.getPlatform() === 'android' || window.Capacitor.getPlatform() === 'ios')) return true;
      if (window.Capacitor.platform === 'android' || window.Capacitor.platform === 'ios') return true;
    }
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'capacitor:') return true;
    if (typeof navigator !== 'undefined' && navigator.userAgent && (navigator.userAgent.includes('Capacitor') || navigator.userAgent.includes('Android'))) {
      // Check if running inside WebView shell
      if (window.location.hostname === 'localhost' && !window.location.port) return true;
    }
    return false;
  } catch {
    return false;
  }
};

// On Android native, use production server or env override
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  if (import.meta.env.PROD || isNativePlatform()) {
    return 'https://rentxybookings.onrender.com/api';
  }
  
  return 'http://localhost:8080/api';
};

const API_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
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

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    let message = error.response?.data?.message || error.message || 'An unexpected error occurred';

    if (!error.response && error.code === 'ERR_NETWORK') {
      message = 'Connecting to server... Please check internet or wait 5s for server to wake up.';
    }

    error.userMessage = message;

    if (status === 401) {
      // Token expired or invalid — clear it and redirect to login
      const currentPath = window.location.pathname;
      if (currentPath !== '/auth' && currentPath !== '/forgot-password' && currentPath !== '/reset-password') {
        localStorage.removeItem('token');
        window.location.href = '/auth';
      }
    } else if (status === 403) {
      console.error('Access Denied:', message);
    }

    // Network error (offline) — give a user-friendly message
    if (!error.response && error.message === 'Network Error') {
      return Promise.reject({
        ...error,
        userMessage: 'Network unavailable. Please check your internet connection and try again.',
        status: null
      });
    }

    return Promise.reject({
      ...error,
      userMessage: message,
      status: status
    });
  }
);

export default api;
