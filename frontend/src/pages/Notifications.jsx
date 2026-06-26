import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  SlidersHorizontal, 
  ArrowUpDown, 
  Calendar, 
  MessageSquare, 
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  UserCheck,
  UserX,
  Star,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { formatTimeAgo } from '../utils/dateUtils';
import TaskDetailModal from '../components/TaskDetailModal';

export default function Notifications() {
  const { notifications, loading, markAsRead, markAsUnread, unreadCount, markAsStarred, markAsUnstarred, deleteNotification } = useNotifications();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const starredCount = notifications.filter(n => n.isStarred).length;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState('Activity'); // 'Activity', 'Starred', 'Unread'
  const [selectedNotifId, setSelectedNotifId] = useState(null);
  const [sortOrder, setSortOrder] = useState('Newest'); // 'Newest', 'Oldest'
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'COMMENT_ADDED', 'PROJECT_MEMBER_ADDED', 'ROLE_CHANGED', 'ACCOUNT_DEACTIVATED'
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeTaskDetailsId, setActiveTaskDetailsId] = useState(null);

  // Screen resize listener for mobile viewports
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear selected notification when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedNotifId(null);
  };

  // Filter notifications by tab (Activity shows all, Starred shows starred, Unread shows only unread)
  const tabNotifications = notifications.filter(notif => {
    if (activeTab === 'Starred') return notif.isStarred;
    if (activeTab === 'Unread') return !notif.isRead || notif.id === selectedNotifId;
    return true; // 'Activity' tab displays all notifications (seen and unseen)
  });

  // Apply Type Filter
  const filteredNotifications = tabNotifications.filter(notif => {
    if (typeFilter === 'ALL') return true;
    return notif.type === typeFilter;
  });

  // Apply Sort
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortOrder === 'Newest' ? dateB - dateA : dateA - dateB;
  });

  // Determine active selected notification ID (auto-select the first one if none selected - desktop only)
  const activeSelectedNotifId = selectedNotifId || (!isMobile ? sortedNotifications[0]?.id : null);

  // Find selected notification
  const selectedNotif = activeSelectedNotifId ? notifications.find(n => n.id === activeSelectedNotifId) : null;

  // Auto-select first notification on load if none selected (desktop only)
  useEffect(() => {
    if (!isMobile && !selectedNotifId && sortedNotifications.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedNotifId(sortedNotifications[0].id);
    }
  }, [sortedNotifications, selectedNotifId, isMobile]);

  const lastSelectedIdRef = useRef(null);

  // Auto-mark selected notification as read when it becomes active (runs on selection change)
  useEffect(() => {
    if (selectedNotifId && selectedNotifId !== lastSelectedIdRef.current) {
      lastSelectedIdRef.current = selectedNotifId;
      const notif = notifications.find(n => n.id === selectedNotifId);
      if (notif && !notif.isRead) {
        markAsRead(selectedNotifId);
      }
    }
  }, [selectedNotifId, notifications, markAsRead]);

  // Helper: format notification type label
  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return 'Task Assigned';
      case 'TASK_COMPLETED':
        return 'Task Completed';
      case 'COMMENT_ADDED':
        return 'Comment Added';
      case 'PROJECT_MEMBER_ADDED':
        return 'Project Member Added';
      case 'ROLE_CHANGED':
        return 'Role Changed';
      case 'ACCOUNT_DEACTIVATED':
        return 'Account Deactivated';
      default:
        return 'System Alert';
    }
  };

  // Helper: map notification type to icon
  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return Calendar;
      case 'TASK_COMPLETED':
        return CheckCircle;
      case 'COMMENT_ADDED':
        return MessageSquare;
      case 'PROJECT_MEMBER_ADDED':
        return UserCheck;
      case 'ROLE_CHANGED':
        return Shield;
      case 'ACCOUNT_DEACTIVATED':
        return UserX;
      default:
        return MessageSquare;
    }
  };

  // Helper: Parse description, project, task, actor from message string
  const parseNotificationDetails = (notif) => {
    if (!notif) return { actor: 'System', task: 'N/A', project: 'N/A', actionType: 'system', taskId: null, projectId: null };
    const rawMsg = notif.message || '';
    
    // Extract taskId or projectId suffix (format: " | task:<UUID>")
    const idMatch = rawMsg.match(/\s*\|\s*(task|project):([0-9a-fA-F-]+)/);
    let taskId = null;
    let projectId = null;
    if (idMatch) {
      if (idMatch[1] === 'task') {
        taskId = idMatch[2];
      } else if (idMatch[1] === 'project') {
        projectId = idMatch[2];
      }
    }
    
    const msg = rawMsg.split(' | ')[0]; // clean display message
    const type = notif.type;
    
    let actor = 'System';
    let task = 'N/A';
    let project = 'N/A';
    let actionType = 'system';
    
    // 1. COMMENT_ADDED: "${author.name} commented on task: ${task.title}"
    if (type === 'COMMENT_ADDED' || msg.includes('commented on task:')) {
      const commentMatch = msg.match(/^(.+?)\s+commented on task:\s*(.+)$/i);
      if (commentMatch) {
        actor = commentMatch[1];
        task = commentMatch[2];
        actionType = 'task';
      }
    }
    // 2. TASK_ASSIGNED: "You have been assigned to task: ${task.title}"
    else if (type === 'TASK_ASSIGNED' || msg.includes('assigned to task:')) {
      const assignMatch = msg.match(/assigned to task:\s*(.+)$/i);
      if (assignMatch) {
        actor = 'Project Manager';
        task = assignMatch[1];
        actionType = 'task';
      }
    }
    // 3. TASK_COMPLETED: "Task completed: ${task.title}"
    else if (type === 'TASK_COMPLETED' || msg.includes('Task completed:')) {
      const completeMatch = msg.match(/Task completed:\s*(.+)$/i);
      if (completeMatch) {
        actor = 'System';
        task = completeMatch[1];
        actionType = 'task';
      }
    }
    // 4. PROJECT_MEMBER_ADDED: "You have been added to project: ${project.name}"
    else if (type === 'PROJECT_MEMBER_ADDED' || msg.includes('added to project:')) {
      const projectMatch = msg.match(/added to project:\s*(.+)$/i);
      if (projectMatch) {
        actor = 'Project Owner';
        project = projectMatch[1];
        actionType = 'project';
      }
    }
    // 5. ROLE_CHANGED: "Your role has been changed..."
    else if (type === 'ROLE_CHANGED' || msg.includes('role')) {
      actor = 'Administrator';
      actionType = 'system';
    }
    // 6. ACCOUNT_DEACTIVATED
    else if (type === 'ACCOUNT_DEACTIVATED' || msg.includes('deactivated')) {
      actor = 'Administrator';
      actionType = 'system';
    }
    // 7. Fallback matches
    else if (msg.includes('owner of project:')) {
      const ownerMatch = msg.match(/owner of project:\s*(.+)$/i);
      if (ownerMatch) {
        actor = 'Administrator';
        project = ownerMatch[1];
        actionType = 'project';
      }
    }

    return { actor, task, project, actionType, taskId, projectId };
  };

  // Helper: Group notifications by Date (Today, Yesterday, Earlier)
  const groupNotificationsByDate = (notifs) => {
    const todayGroup = [];
    const yesterdayGroup = [];
    const earlierGroup = [];

    const isSameDay = (d1, d2) => 
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    notifs.forEach(notif => {
      const notifDate = new Date(notif.createdAt);
      if (isSameDay(today, notifDate)) {
        todayGroup.push(notif);
      } else if (isSameDay(yesterday, notifDate)) {
        yesterdayGroup.push(notif);
      } else {
        earlierGroup.push(notif);
      }
    });

    return [
      { label: 'Today', items: todayGroup },
      { label: 'Yesterday', items: yesterdayGroup },
      { label: 'Earlier', items: earlierGroup }
    ];
  };

  const groupedNotifications = groupNotificationsByDate(sortedNotifications);

  const selectedDetails = parseNotificationDetails(selectedNotif);

  const handleOpenItem = async () => {
    if (!selectedNotif) return;
    try {
      if (selectedDetails.actionType === 'task') {
        if (selectedDetails.taskId) {
          // Verify if task still exists
          await api.get(`/api/v1/tasks/${selectedDetails.taskId}`);
          setActiveTaskDetailsId(selectedDetails.taskId);
        } else {
          navigate(user?.role === 'COLLABORATOR' ? '/my-tasks' : '/tasks');
        }
      } else if (selectedDetails.actionType === 'project') {
        if (selectedDetails.projectId) {
          // Verify if project still exists
          await api.get(`/api/v1/projects/${selectedDetails.projectId}`);
          // Navigate to projects and pass projectId in state for auto-selection
          navigate('/projects', { state: { selectProjectId: selectedDetails.projectId } });
        } else {
          navigate('/projects');
        }
      }
    } catch (err) {
      console.error('Failed to open related item:', err);
      const itemType = selectedDetails.actionType === 'task' ? 'task' : 'project';
      addToast(`This ${itemType} has been deleted or is no longer accessible.`, 'error');
    }
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="text-3xl font-bold text-white">Inbox</h1>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-850 gap-6 flex-shrink-0">
        {['Activity', 'Starred', 'Unread'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`pb-3 text-sm font-semibold relative transition-colors cursor-pointer ${
              activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            <span>{tab}</span>
            {tab === 'Starred' && starredCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {starredCount}
              </span>
            )}
            {tab === 'Unread' && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-600/15 text-blue-400 border border-blue-500/20">
                {unreadCount}
              </span>
            )}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Toolbar filters */}
      <div className="flex items-center justify-between py-2 border-b border-slate-850 text-xs text-slate-500 flex-shrink-0 relative">
        <div className="flex items-center space-x-4">
          {/* Type Filter Dropdown Trigger */}
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-905/60 transition-colors cursor-pointer text-slate-500 hover:text-white"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filter: {typeFilter === 'ALL' ? 'All Activity' : getNotificationTypeLabel(typeFilter)}</span>
            </button>

            {showFilterMenu && (
              <div className="absolute top-full left-0 mt-2 bg-[#252526] border border-slate-850 rounded-xl shadow-xl w-56 z-50 p-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {['ALL', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'COMMENT_ADDED', 'PROJECT_MEMBER_ADDED', 'ROLE_CHANGED', 'ACCOUNT_DEACTIVATED'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTypeFilter(t);
                      setShowFilterMenu(false);
                      setSelectedNotifId(null);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors text-[11px] font-semibold cursor-pointer ${
                      typeFilter === t ? 'bg-slate-905 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-905/40'
                    }`}
                  >
                    {t === 'ALL' ? 'All Activity' : getNotificationTypeLabel(t)}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Sort order toggle */}
          <button 
            onClick={() => {
              setSortOrder(prev => prev === 'Newest' ? 'Oldest' : 'Newest');
              setSelectedNotifId(null);
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-905/60 transition-colors cursor-pointer text-slate-500 hover:text-white"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Sort: {sortOrder}</span>
          </button>
        </div>
      </div>

      {/* Main Left/Right Workspace Panel */}
      <div className="flex-1 flex overflow-hidden gap-6">
        {/* Left Panel: List of notifications grouped by Date (2/5 width on desktop, full-width on mobile when list is shown) */}
        {(!isMobile || !selectedNotifId) && (
          <div className="w-full md:w-[40%] flex flex-col overflow-y-auto md:border-r border-slate-850 md:pr-4 space-y-6">
            {loading && sortedNotifications.length === 0 ? (
              <div className="py-20 text-center text-slate-550 text-xs animate-pulse">Loading updates...</div>
            ) : sortedNotifications.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-xs italic">
                No notifications matching current filters.
              </div>
            ) : (
              groupedNotifications.map((group) => {
                if (group.items.length === 0) return null;
                return (
                  <div key={group.label} className="space-y-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                      {group.label}
                    </div>
                    <div className="space-y-1.5">
                      {group.items.map((notif) => {
                        const Icon = getNotificationTypeIcon(notif.type);
                        const isSelected = notif.id === activeSelectedNotifId;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => setSelectedNotifId(notif.id)}
                            className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-150 cursor-pointer select-none relative ${
                              isSelected 
                                ? 'bg-slate-905 border-slate-800 shadow-md' 
                                : 'bg-[#252526] border-slate-850 hover:bg-[#2c2c2d]'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2 min-w-0">
                                <div className={`h-6.5 w-6.5 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-slate-950 text-white' : 'bg-slate-905 text-slate-400'
                                }`}>
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-bold text-white truncate">
                                  {getNotificationTypeLabel(notif.type)}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-1.5 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (notif.isStarred) {
                                      markAsUnstarred(notif.id);
                                    } else {
                                      markAsStarred(notif.id);
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                                >
                                  <Star className={`h-3.5 w-3.5 ${notif.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-500 hover:text-slate-350'}`} />
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Delete this notification permanently?')) {
                                      await deleteNotification(notif.id);
                                      if (activeSelectedNotifId === notif.id) {
                                        setSelectedNotifId(null);
                                      }
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-450 transition-colors cursor-pointer shrink-0"
                                  title="Delete notification"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <span className="text-[9px] text-slate-500 font-semibold shrink-0">
                                  {formatTimeAgo(notif.createdAt)}
                                </span>
                                {!notif.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>
                                )}
                              </div>
                            </div>
  
                            <p className="text-xs text-slate-400 mt-2 line-clamp-1 leading-relaxed">
                              {notif.message ? notif.message.split(' | ')[0] : ''}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Right Panel: Detail info card (3/5 width on desktop, full-width on mobile when selected) */}
        {(!isMobile || selectedNotifId) && (
          <div className="w-full md:w-[60%] flex flex-col bg-[#252526] border border-slate-850 rounded-2xl overflow-hidden p-4 sm:p-6 relative justify-between">
          {!selectedNotif ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
              <MessageSquare className="h-10 w-10 text-slate-700 animate-bounce" />
              <p className="text-xs text-slate-550 font-semibold italic">Select a notification to view full details</p>
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between">
              {/* Top content area */}
              <div className="space-y-6">
                {/* Panel Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
                  <div className="flex items-center space-x-2">
                    {isMobile && (
                      <button
                        onClick={() => setSelectedNotifId(null)}
                        className="mr-1 p-1.5 rounded-lg bg-slate-905 hover:bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer flex items-center justify-center"
                        title="Back to inbox list"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-600/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                      {getNotificationTypeLabel(selectedNotif.type)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={async () => {
                        if (selectedNotif.isStarred) {
                          await markAsUnstarred(selectedNotif.id);
                        } else {
                          await markAsStarred(selectedNotif.id);
                        }
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-905 hover:bg-slate-950 text-slate-400 hover:text-white border border-slate-800 text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      <Star className={`h-3 w-3 ${selectedNotif.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                      <span>{selectedNotif.isStarred ? 'Starred' : 'Star'}</span>
                    </button>

                    {selectedNotif.isRead ? (
                      <button
                        onClick={async () => {
                          await markAsUnread(selectedNotif.id);
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-905 hover:bg-slate-950 text-slate-400 hover:text-white border border-slate-800 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Mark as unread</span>
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await markAsRead(selectedNotif.id);
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-905 hover:bg-slate-950 text-slate-400 hover:text-white border border-slate-800 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>Mark as read</span>
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        if (window.confirm('Delete this notification permanently?')) {
                          await deleteNotification(selectedNotif.id);
                          setSelectedNotifId(null);
                        }
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-905 hover:bg-rose-950/30 hover:border-rose-900 text-slate-400 hover:text-rose-400 border border-slate-800 text-[10px] font-bold transition-colors cursor-pointer"
                      title="Delete notification permanently"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs border-b border-slate-850 pb-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Performer / Actor</span>
                    <p className="font-semibold text-white">{selectedDetails.actor}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timestamp</span>
                    <p className="font-semibold text-white">{new Date(selectedNotif.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Related Project</span>
                    <p className="font-semibold text-white truncate" title={selectedDetails.project}>
                      {selectedDetails.project}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Related Task</span>
                    <p className="font-semibold text-white truncate" title={selectedDetails.task}>
                      {selectedDetails.task}
                    </p>
                  </div>
                </div>

                {/* Message Body */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Message</span>
                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                      {selectedNotif.message ? selectedNotif.message.split(' | ')[0] : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom redirection actions */}
              {selectedDetails.actionType !== 'system' && (
                <div className="pt-4 border-t border-slate-850 flex justify-end">
                  <button
                    onClick={handleOpenItem}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    <span>Open Related {selectedDetails.actionType === 'task' ? 'Task' : 'Project'}</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </div>
      {activeTaskDetailsId && (
        <TaskDetailModal
          task={{ id: activeTaskDetailsId }}
          onClose={() => setActiveTaskDetailsId(null)}
          onTaskUpdated={() => {}}
        />
      )}
    </div>
  );
}
