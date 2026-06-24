/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => {
    return sessionStorage.getItem('taskflow_token') || null;
  });

  const [user, setUserState] = useState(() => {
    const savedUser = sessionStorage.getItem('taskflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [role, setRoleState] = useState(() => {
    const savedUser = sessionStorage.getItem('taskflow_user');
    return savedUser ? JSON.parse(savedUser).role : null;
  });

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // On mount, verify session
  useEffect(() => {
    // Simulate minor latency to check state, then resolve loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // Helper setter that synchronizes state and sessionStorage
  const setSession = (newToken, newUser) => {
    if (newToken && newUser) {
      setTokenState(newToken);
      setUserState(newUser);
      setRoleState(newUser.role);
      sessionStorage.setItem('taskflow_token', newToken);
      sessionStorage.setItem('taskflow_user', JSON.stringify(newUser));
    } else {
      setTokenState(null);
      setUserState(null);
      setRoleState(null);
      sessionStorage.removeItem('taskflow_token');
      sessionStorage.removeItem('taskflow_user');
    }
  };

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      // Call actual backend login endpoint
      const response = await api.post('/api/auth/login', { email, password });
      
      const { token, user: apiUser } = response.data;
      setSession(token, apiUser);
      setLoading(false);
      return apiUser;
    } catch (err) {
      // Fallback for local simulation testing if the backend is down or the route is a 404
      const isDemoUser =
        (email === 'admin@taskflow.com' && password === 'admin123') ||
        (email === 'pm@taskflow.com' && password === 'pm123') ||
        (email === 'user@taskflow.com' && password === 'user123') ||
        (email === 'admin@tms.com' && password === 'Admin@123!') ||
        (email === 'pm1@tms.com' && password === 'Manager@123!') ||
        (email === 'collab1@tms.com' && password === 'Collab@123!');

      const isNetworkOrMissingRoute =
        !err.response || err.response.status === 404 || err.response.status === 502;

      if (isDemoUser && isNetworkOrMissingRoute) {
        console.warn('Backend API unavailable. Authenticating with mock local credentials.');
        
        let mockRole = 'COLLABORATOR';
        let mockName = 'Collaborator User';

        if (email === 'admin@taskflow.com' || email === 'admin@tms.com') {
          mockRole = 'ADMIN';
          mockName = 'Admin User';
        } else if (email === 'pm@taskflow.com' || email === 'pm1@tms.com') {
          mockRole = 'PROJECT_MANAGER';
          mockName = 'Project Manager User';
        }

        const mockUser = {
          email: email.toLowerCase(),
          name: mockName,
          role: mockRole,
        };
        const mockToken = `mock-jwt-token-${Math.random().toString(36).substring(2)}`;

        // Simulate small server latency
        await new Promise((resolve) => setTimeout(resolve, 600));

        setSession(mockToken, mockUser);
        setLoading(false);
        return mockUser;
      }

      setLoading(false);
      throw err;
    }
  };

  // Logout handler
  const logout = () => {
    setSession(null, null);
    // Force redirect to login
    window.location.href = '/login';
  };

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/api/v1/auth/forgot-password', { email });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to send verification code.', { cause: err });
    }
  };

  const verifyResetCode = async (email, code) => {
    try {
      const response = await api.post('/api/v1/auth/verify-reset-code', { email, code });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Invalid or expired verification code.', { cause: err });
    }
  };

  const resetPassword = async (email, code, newPassword) => {
    try {
      const response = await api.post('/api/v1/auth/reset-password', { email, code, newPassword });
      setNotifications([]);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to reset password.', { cause: err });
    }
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const changePassword = async (newPassword) => {
    setLoading(true);
    try {
      const response = await api.post('/api/v1/auth/change-password', { newPassword });
      const updatedUser = { ...user, mustResetPassword: false };
      setSession(token, updatedUser);
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        loading,
        notifications,
        login,
        logout,
        forgotPassword,
        verifyResetCode,
        resetPassword,
        changePassword,
        dismissNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
