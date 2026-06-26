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
  const { notifications: liveNotifications, setNotifications: setLiveNotifications, getSocket } = useSocket();

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

  // Mark single notification as read — optimistic update then API confirm
  const markAsRead = useCallback(async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
    } catch (err) {
      // Rollback on failure
      console.error(`[NotificationContext] Failed to mark notification ${id} as read:`, err);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    const prev = notifications;
    setNotifications((p) => p.map((n) => ({ ...n, isRead: true })));
    try {
      await api.patch('/api/v1/notifications/read-all');
    } catch (err) {
      // Rollback
      console.error('[NotificationContext] Failed to mark all notifications as read:', err);
      setNotifications(prev);
    }
  }, [notifications]);

  // Mark single notification as unread — optimistic update
  const markAsUnread = useCallback(async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
    );
    try {
      await api.patch(`/api/v1/notifications/${id}/unread`);
    } catch (err) {
      // Rollback
      console.error(`[NotificationContext] Failed to mark notification ${id} as unread:`, err);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  }, []);

  // Mark single notification as starred — optimistic update
  const markAsStarred = useCallback(async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isStarred: true } : n))
    );
    try {
      await api.patch(`/api/v1/notifications/${id}/star`);
    } catch (err) {
      // Rollback
      console.error(`[NotificationContext] Failed to mark notification ${id} as starred:`, err);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isStarred: false } : n))
      );
    }
  }, []);

  // Mark single notification as unstarred — optimistic update
  const markAsUnstarred = useCallback(async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isStarred: false } : n))
    );
    try {
      await api.patch(`/api/v1/notifications/${id}/unstar`);
    } catch (err) {
      // Rollback
      console.error(`[NotificationContext] Failed to mark notification ${id} as unstarred:`, err);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isStarred: true } : n))
      );
    }
  }, []);

  // Delete single notification completely — optimistic update
  const deleteNotification = useCallback(async (id) => {
    const snapshot = notifications.find((n) => n.id === id);
    // Optimistic removal
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.delete(`/api/v1/notifications/${id}`);
    } catch (err) {
      // Rollback
      console.error(`[NotificationContext] Failed to delete notification ${id}:`, err);
      if (snapshot) {
        setNotifications((prev) => [snapshot, ...prev]);
      }
    }
  }, [notifications]);

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
        markAsStarred,
        markAsUnstarred,
        deleteNotification,
        setNotifications,
        getSocket,
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
