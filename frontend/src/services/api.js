import axios from 'axios';

// Detect if running inside a Capacitor native shell (Android/iOS)
export const isNativePlatform = () => {
  try {
    return window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

// On Android native, localhost points to the device itself, not the dev machine.
// Use the env variable if set; otherwise fall back to 10.0.2.2 (Android emulator)
// or localhost (web browser).
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  if (import.meta.env.PROD || isNativePlatform()) {
    // Android APK and Production Web will use this URL
    return 'https://rentxy.onrender.com/api';
  }
  
  return 'http://localhost:8080/api';
};

const API_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15s timeout — prevents hanging requests on poor networks
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
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';

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
