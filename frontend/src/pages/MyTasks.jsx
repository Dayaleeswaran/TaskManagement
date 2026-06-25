import { useEffect, useState, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { CheckSquare, Clock, AlertTriangle, Play, CheckCircle2 } from 'lucide-react';
import TaskDetailModal from '../components/TaskDetailModal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function MyTasks() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const { getSocket } = useNotifications();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, COMPLETED
  const [selectedTask, setSelectedTask] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchMyTasks = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/tasks?limit=100');
      const tasksData = response.data.tasks || response.data || [];
      setTasks(tasksData);
    } catch (err) {
      console.error('Failed to load my tasks:', err);
      addToast('Failed to retrieve tasks.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMyTasks();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMyTasks, refreshTrigger]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleActivity = (activity) => {
      if (activity && activity.userId !== user?.id) {
        setRefreshTrigger(prev => prev + 1);
      }
    };

    socket.on('activity', handleActivity);
    return () => {
      socket.off('activity', handleActivity);
    };
  }, [getSocket, user?.id]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/api/v1/tasks/${taskId}/status`, { status: newStatus });
      addToast(`Task status updated to ${newStatus.replace('_', ' ').toLowerCase()}`, 'success');
      fetchMyTasks();
      // If the currently selected task is updated, refresh it too
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update task status.', 'error');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return <span className="flex items-center text-rose-400 text-xs font-semibold"><AlertTriangle className="h-3.5 w-3.5 mr-1" /> High</span>;
      case 'MEDIUM':
        return <span className="flex items-center text-amber-400 text-xs font-semibold"><Clock className="h-3.5 w-3.5 mr-1" /> Medium</span>;
      default:
        return <span className="flex items-center text-slate-400 text-xs font-semibold"><Clock className="h-3.5 w-3.5 mr-1" /> Low</span>;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'COMPLETED') return task.status === 'COMPLETED';
    if (filter === 'PENDING') return task.status !== 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">My Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">Review and manage your assigned tasks and sprint tickets.</p>
        </div>
        
        <div className="flex items-center space-x-3 text-xs bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
          <button 
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded font-medium cursor-pointer transition-colors ${filter === 'ALL' ? 'bg-violet-650 text-white shadow shadow-violet-600/15' : 'text-slate-400 hover:text-white'}`}
          >
            All Assigned
          </button>
          <button 
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1 rounded font-medium cursor-pointer transition-colors ${filter === 'PENDING' ? 'bg-violet-650 text-white shadow shadow-violet-600/15' : 'text-slate-400 hover:text-white'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilter('COMPLETED')}
            className={`px-3 py-1 rounded font-medium cursor-pointer transition-colors ${filter === 'COMPLETED' ? 'bg-violet-650 text-white shadow shadow-violet-600/15' : 'text-slate-400 hover:text-white'}`}
          >
            Completed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-550 text-sm animate-pulse">Loading my tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-16 text-center bg-slate-955 border border-slate-900 border-dashed rounded-3xl">
          <CheckSquare className="h-10 w-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No tasks match the selected filter.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/20 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start space-x-3.5">
                <div className="mt-1 h-9 w-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">{task.title}</h3>
                  <div className="flex items-center space-x-3 mt-1.5 flex-wrap gap-y-1">
                    {getPriorityBadge(task.priority)}
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-slate-400 text-xs">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    {task.project && (
                      <>
                        <span className="text-slate-500 text-xs">•</span>
                        <span className="text-violet-400 text-xs font-semibold">{task.project.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 self-end md:self-center">
                {/* Status Selection Dropdown */}
                <select
                  value={task.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleStatusChange(task.id, e.target.value);
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                {/* Quick actions status updates */}
                {task.status === 'TODO' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(task.id, 'IN_PROGRESS');
                    }}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-violet-600/20 text-slate-400 hover:text-violet-300 border border-slate-850 hover:border-violet-500/30 transition-all duration-200 cursor-pointer"
                    title="Start Task"
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(task.id, 'COMPLETED');
                    }}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-300 border border-slate-850 hover:border-emerald-500/30 transition-all duration-200 cursor-pointer"
                    title="Complete Task"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Details Panel overlay */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={fetchMyTasks}
          onTaskDeleted={fetchMyTasks}
        />
      )}
    </div>
  );
}
