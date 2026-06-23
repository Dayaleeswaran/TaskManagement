import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';
import { Check, BellOff, ArrowRight } from 'lucide-react';

export default function NotificationDropdown({ onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Show only the 5 most recent notifications in the dropdown
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden origin-top-right transition-all duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-slate-300">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
              {unreadCount} new
            </span>
          )}
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
        {recentNotifications.length > 0 ? (
          recentNotifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onClick={() => {
                markAsRead(notif.id);
              }}
            />
          ))
        ) : (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-white">
            <div className="p-3 rounded-full bg-slate-50 text-slate-400">
              <BellOff className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-500 font-medium">No notifications yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
        <Link
          to="/notifications"
          onClick={onClose}
          className="inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors py-1.5 w-full cursor-pointer"
        >
          <span>View all notifications</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
