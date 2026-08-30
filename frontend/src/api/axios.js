import axios from 'axios';

const api = axios.create({
  // In dev: '/api' is proxied to localhost:3001 by Vite
  // In prod: VITE_API_BASE_URL = https://svlogics-api.onrender.com/api
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('svlogics-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — distinguish between normal expiry and SESSION_INVALIDATED
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errCode = error.response.data?.error;
      localStorage.removeItem('svlogics-token');
      if (errCode === 'SESSION_INVALIDATED') {
        // Another device logged in — show clear message
        alert('⚠️ Your account was logged in from another device. You have been logged out.');
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
