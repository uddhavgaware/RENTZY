import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
      // Optional: handle unauthorized access (e.g., logout)
      // localStorage.removeItem('token');
      // window.location.href = '/auth';
    } else if (status === 403) {
      console.error('Access Denied:', message);
    }

    return Promise.reject({
      ...error,
      userMessage: message,
      status: status
    });
  }
);

export default api;
