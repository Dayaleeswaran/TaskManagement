import React from 'react';
import { formatTimeAgo } from '../utils/dateUtils';

export default function NotificationItem({ notification, onClick }) {
  const { message, isRead, createdAt } = notification;

  return (
    <div
      onClick={onClick}
      className={`p-4 flex items-start space-x-3 transition-colors duration-150 cursor-pointer border-b border-slate-100 ${
        !isRead ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start space-x-2.5">
          {/* Read/Unread bullet style indicator as requested */}
          <span
            className={`inline-block mt-0.5 text-sm font-bold select-none ${
              !isRead ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            {!isRead ? '●' : '○'}
          </span>
          
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm leading-relaxed break-words ${
                !isRead ? 'text-slate-300 font-semibold' : 'text-slate-500 font-normal'
              }`}
            >
              {message}
            </p>
            <p className="text-xs text-slate-450 mt-1 font-medium">
              {formatTimeAgo(createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
