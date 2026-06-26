import axios from 'axios';

// Create api client with baseURL configured
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3000'),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30s timeout to allow Supabase queries to resolve
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

// Flag to track token refreshing state
let isRefreshing = false;
let failedQueue = [];

// Helper to process the request queue on refresh resolution
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle errors, including 401 token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and request hasn't been retried
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      
      // If the error comes from login or refresh, do not retry (prevent loops)
      if (
        originalRequest.url.includes("/auth/login") || 
        originalRequest.url.includes("/auth/refresh")
      ) {
        // If refresh failed, clear session and redirect to login
        if (originalRequest.url.includes("/auth/refresh")) {
          sessionStorage.removeItem("taskflow_token");
          sessionStorage.removeItem("taskflow_user");
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login?session_expired=true";
          }
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      return new Promise((resolve, reject) => {
        // Trigger refresh request - pass withCredentials explicitly to send HttpOnly cookies
        api.post("/api/v1/auth/refresh", {}, { withCredentials: true })
          .then((res) => {
            const { token } = res.data;
            sessionStorage.setItem("taskflow_token", token);
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            originalRequest.headers.Authorization = `Bearer ${token}`;
            processQueue(null, token);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            sessionStorage.removeItem("taskflow_token");
            sessionStorage.removeItem("taskflow_user");
            if (!window.location.pathname.includes("/login")) {
              window.location.href = "/login?session_expired=true";
            }
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
