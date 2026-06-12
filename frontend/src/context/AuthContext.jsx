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
        (email === 'user@taskflow.com' && password === 'user123');

      const isNetworkOrMissingRoute =
        !err.response || err.response.status === 404 || err.response.status === 502;

      if (isDemoUser && isNetworkOrMissingRoute) {
        console.warn('Backend API unavailable. Authenticating with mock local credentials.');
        
        let mockRole = 'COLLABORATOR';
        let mockName = 'Collaborator User';

        if (email === 'admin@taskflow.com') {
          mockRole = 'ADMIN';
          mockName = 'Admin User';
        } else if (email === 'pm@taskflow.com') {
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

  // Mock implementation for Forgot Password to maintain page compatibility
  const forgotPassword = async (email) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Simple validation for email format
    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }

    const resetToken = Math.random().toString(36).substring(2, 10);
    const resetLink = `/reset-password?token=${resetToken}`;

    // Add alert notification for local testing
    const newNotification = {
      id: Date.now(),
      type: 'info',
      message: `Simulated Reset Email sent to ${email}!`,
      link: resetLink,
      linkText: 'Click to Reset Password',
    };

    setNotifications((prev) => [...prev, newNotification]);
    return { success: true, link: resetLink };
  };

  // Mock implementation for Reset Password
  const resetPassword = async (resetToken, newPassword) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (!resetToken) {
      throw new Error('Invalid or expired reset token.');
    }
    console.log(`[Auth Mock] Password reset requested for token "${resetToken}". New password complexity validated: ${!!newPassword}`);
    // Clear simulations notifications
    setNotifications([]);
    return { success: true };
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
        resetPassword,
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
