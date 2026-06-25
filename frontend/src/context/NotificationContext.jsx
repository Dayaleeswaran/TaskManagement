/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import useSocket from '../hooks/useSocket';
import api from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Hook into live Socket.io notifications
  const { notifications: liveNotifications, setNotifications: setLiveNotifications } = useSocket();

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!token || !user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/api/v1/notifications');
      const data = response.data.notifications || response.data || [];
      setNotifications(data);
    } catch (err) {
      console.error('[NotificationContext] Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  // Sync Socket.io real-time notifications
  useEffect(() => {
    if (liveNotifications.length > 0) {
      liveNotifications.forEach((latestNotif) => {
        setNotifications((prev) => {
          const exists = prev.some((n) => n.id === latestNotif.id);
          if (exists) {
            return prev;
          }
          return [latestNotif, ...prev];
        });
      });
      // Clear the live notifications queue from the hook to avoid double-processing
      setLiveNotifications([]);
    }
  }, [liveNotifications, setLiveNotifications]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.id === id && !n.isRead) {
            return { ...n, isRead: true };
          }
          return n;
        })
      );
    } catch (err) {
      console.error(`[NotificationContext] Failed to mark notification ${id} as read:`, err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.patch('/api/v1/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error('[NotificationContext] Failed to mark all notifications as read:', err);
    }
  };

  // Mark single notification as unread (Restore)
  const markAsUnread = async (id) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/unread`);
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.id === id && n.isRead) {
            return { ...n, isRead: false };
          }
          return n;
        })
      );
    } catch (err) {
      console.error(`[NotificationContext] Failed to mark notification ${id} as unread:`, err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        markAsUnread,
        setNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
