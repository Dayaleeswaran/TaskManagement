/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

/**
 * ToastProvider — Global toast notification context.
 * Provides `addToast(message, type)` to any consuming component.
 * Types: 'success' | 'error' | 'info' | 'warning'
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastIdCounter;
    const toast = { id, message, type, duration, exiting: false };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss after duration
    setTimeout(() => {
      dismissToast(id);
    }, duration);

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    // Trigger exit animation first
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );

    // Remove from DOM after exit animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 280);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
