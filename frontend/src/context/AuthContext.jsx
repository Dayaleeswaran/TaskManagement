import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

// Pre-defined credentials for local testing
const DEFAULT_USERS = [
  {
    email: 'admin@taskflow.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'Admin'
  },
  {
    email: 'user@taskflow.com',
    password: 'user123',
    name: 'Regular User',
    role: 'User'
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Initialize mock users and restore session
  useEffect(() => {
    // Set up users database in localStorage if not already present
    const storedUsers = localStorage.getItem('taskflow_users');
    if (!storedUsers) {
      localStorage.setItem('taskflow_users', JSON.stringify(DEFAULT_USERS));
    }

    // Recover session from localStorage
    const savedSession = localStorage.getItem('taskflow_current_user');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }

    // Simulate small latency to check session
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const storedUsers = JSON.parse(localStorage.getItem('taskflow_users') || '[]');
      const foundUser = storedUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!foundUser) {
        throw new Error('Invalid email or password. Try admin@taskflow.com / admin123');
      }

      const sessionUser = {
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role
      };

      setUser(sessionUser);
      localStorage.setItem('taskflow_current_user', JSON.stringify(sessionUser));
      setLoading(false);
      return sessionUser;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    localStorage.removeItem('taskflow_current_user');
  };

  // Forgot password flow - generates simulated token and link
  const forgotPassword = async (email) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const storedUsers = JSON.parse(localStorage.getItem('taskflow_users') || '[]');
    const userExists = storedUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!userExists) {
      throw new Error('This email address is not registered.');
    }

    // Generate random 8-character token
    const token = Math.random().toString(36).substring(2, 10);
    
    // Store token-email mapping in localStorage for retrieval
    const tokens = JSON.parse(localStorage.getItem('taskflow_reset_tokens') || '{}');
    tokens[token] = email.toLowerCase();
    localStorage.setItem('taskflow_reset_tokens', JSON.stringify(tokens));

    const resetLink = `/reset-password?token=${token}`;
    
    // Add notification so the user can easily click/test it
    const newNotification = {
      id: Date.now(),
      type: 'info',
      message: `Simulated Email Sent to ${email}!`,
      link: resetLink,
      linkText: 'Click here to Reset Password'
    };

    setNotifications((prev) => [...prev, newNotification]);

    return { success: true, link: resetLink };
  };

  // Reset password flow using token
  const resetPassword = async (token, newPassword) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const tokens = JSON.parse(localStorage.getItem('taskflow_reset_tokens') || '{}');
    const email = tokens[token];

    if (!email) {
      throw new Error('Invalid or expired reset token.');
    }

    // Update password in stored users database
    const storedUsers = JSON.parse(localStorage.getItem('taskflow_users') || '[]');
    const userIndex = storedUsers.findIndex((u) => u.email.toLowerCase() === email);

    if (userIndex === -1) {
      throw new Error('User account not found.');
    }

    storedUsers[userIndex].password = newPassword;
    localStorage.setItem('taskflow_users', JSON.stringify(storedUsers));

    // Invalidate the reset token
    delete tokens[token];
    localStorage.setItem('taskflow_reset_tokens', JSON.stringify(tokens));

    // Clear notifications
    setNotifications([]);

    return { success: true };
  };

  // Dismiss notification banner
  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        forgotPassword,
        resetPassword,
        notifications,
        dismissNotification
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
