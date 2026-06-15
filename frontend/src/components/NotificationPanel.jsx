import { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, AlertCircle, Info, Calendar, CheckCheck } from 'lucide-react';
import api from '../services/api';
import useSocket from '../hooks/useSocket';

/**
 * NotificationPanel Component: Global header bell dropdown listing user notifications.
 */
export default function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Hook into live WebSockets notifications
  const { notifications: liveNotifications } = useSocket();

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/v1/notifications');
      setNotifications(response.data.notifications || response.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications from backend:', err);
      // Fallback mock notifications for offline testing
      setNotifications([
        {
          id: 'notif-1',
          type: 'COMMENT',
          message: 'Admin User commented on "Setup Axios base interceptors": Working on updating the routing logic now.',
          isRead: false,
          createdAt: new Date(Date.now() - 600000).toISOString(),
        },
        {
          id: 'notif-2',
          type: 'TASK',
          message: 'You have been assigned to task: "Implement drag-and-drop board structure".',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'notif-3',
          type: 'INFO',
          message: 'Welcome to TaskFlow! Enjoy the premium protected application shell.',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        }
      ]);
    }
  };

  useEffect(() => {
    // Wrap in microtask to avoid synchronous calling warnings inside useEffect
    Promise.resolve().then(() => {
      fetchNotifications();
    });
  }, []);

  // Sync WebSocket notifications as they arrive
  useEffect(() => {
    if (liveNotifications.length > 0) {
      const latestNotif = liveNotifications[0];
      // Wrap in microtask to avoid synchronous calling warnings inside useEffect
      Promise.resolve().then(() => {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === latestNotif.id)) {
            return prev;
          }
          return [latestNotif, ...prev];
        });
      });
    }
  }, [liveNotifications]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark single notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/api/v1/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    }
  };

  // Helper to determine relative time
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Helper to resolve icon type
  const getNotificationIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'COMMENT':
        return (
          <div className="h-7 w-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <MessageSquare className="h-4 w-4" />
          </div>
        );
      case 'TASK':
      case 'ASSIGNMENT':
        return (
          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <AlertCircle className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-750 flex items-center justify-center text-slate-400">
            <Info className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700 transition-all duration-200 cursor-pointer flex items-center justify-center"
        aria-label="Toggle notifications"
      >
        <Bell className={`h-4.5 w-4.5 ${unreadCount > 0 ? 'animate-[swing_1.5s_infinite]' : ''}`} />
        
        {/* Glow unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white ring-2 ring-slate-950 shadow shadow-violet-500/50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden origin-top-right transition-all duration-300">
          
          {/* Dropdown Header */}
          <div className="p-4 border-b border-slate-800/60 bg-slate-950/25 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-violet-500/10 text-violet-400 border border-violet-500/25">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-850/50">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  className={`p-4 flex items-start space-x-3.5 hover:bg-slate-950/35 transition-colors duration-150 cursor-pointer ${
                    !notif.isRead ? 'bg-slate-950/15' : 'opacity-65'
                  }`}
                >
                  {/* Icon */}
                  {getNotificationIcon(notif.type)}

                  {/* Body Details */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <p className={`text-xs leading-relaxed break-words font-medium ${!notif.isRead ? 'text-slate-100' : 'text-slate-400'}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center text-[10px] text-slate-500 font-semibold">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatTimeAgo(notif.createdAt)}</span>
                      {!notif.isRead && (
                        <>
                          <span className="mx-1.5 text-slate-700">•</span>
                          <span className="text-violet-400 font-bold">Unread</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mark as read tick (shown only if unread) */}
                  {!notif.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                      }}
                      className="p-1 rounded text-slate-600 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer self-center"
                      title="Mark as read"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                <Bell className="h-8 w-8 text-slate-700" />
                <p className="text-sm text-slate-500 font-medium">No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
