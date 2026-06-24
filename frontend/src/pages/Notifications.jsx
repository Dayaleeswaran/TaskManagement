import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from '../components/NotificationItem';
import api from '../services/api';

export default function Notifications() {
  const [localNotifications, setLocalNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'read', 'unread'
  const [loadingPage, setLoadingPage] = useState(false);

  const { markAsRead, markAllAsRead, unreadCount } = useNotifications();

  // Fetch paginated notifications page
  const fetchPage = useCallback(async (pageNum, activeFilter, append = false) => {
    setLoadingPage(true);
    try {
      const response = await api.get('/api/v1/notifications', {
        params: {
          page: pageNum,
          limit: 10,
          filter: activeFilter === 'all' ? undefined : activeFilter,
        },
      });
      const data = response.data.notifications || [];
      const pagination = response.data.pagination || { totalPages: 1 };

      setLocalNotifications((prev) => (append ? [...prev, ...data] : data));
      setTotalPages(pagination.totalPages);
    } catch (err) {
      console.error('[NotificationsPage] Failed to fetch paginated notifications:', err);
    } finally {
      setLoadingPage(false);
    }
  }, []);

  // Fetch when page or filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPage(page, filter, page > 1);
    }, 0);
    return () => clearTimeout(timer);
  }, [page, filter, fetchPage]);

  // Handle filter changes
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  // Handle load more trigger
  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  // Handle marking single notification as read
  const handleMarkItemRead = async (id) => {
    await markAsRead(id);
    // Update local state to reflect read status
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // Handle marking all notifications as read
  const handleMarkAllRead = async () => {
    await markAllAsRead();
    // Update local state to reflect read status for all
    setLocalNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">Review, manage and filter your real-time notification events.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="self-start sm:self-center inline-flex items-center space-x-2 text-xs font-semibold text-blue-600 hover:text-blue-750 transition-colors border border-blue-200 px-3.5 py-2 rounded-xl bg-blue-50/50 hover:bg-blue-50 cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>Mark All As Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        {['all', 'unread', 'read'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleFilterChange(tab)}
            className={`pb-3 text-sm font-semibold capitalize relative transition-colors cursor-pointer ${
              filter === tab ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
            {tab === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                {unreadCount}
              </span>
            )}
            {filter === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Notifications List container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {localNotifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {localNotifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onClick={() => handleMarkItemRead(notif.id)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-white">
            <div className="p-4 rounded-full bg-slate-50 text-slate-400">
              <Bell className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No notifications found</h3>
            <p className="text-xs text-slate-450 max-w-xs mx-auto">
              There are no notifications matching your '{filter}' filter choice.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Load More */}
      {page < totalPages && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingPage}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50/80 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {loadingPage && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Load More Notifications</span>
          </button>
        </div>
      )}
    </div>
  );
}
