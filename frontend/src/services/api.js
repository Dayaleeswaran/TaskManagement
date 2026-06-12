import axios from 'axios';

// Create api client with baseURL configured
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout
});

// Request interceptor to attach the Authorization token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('taskflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors, including 401 token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized - clean up session and redirect to login
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('taskflow_token');
      sessionStorage.removeItem('taskflow_user');
      
      // Prevent infinite redirect loops if already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
