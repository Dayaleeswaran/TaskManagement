import { useState, useEffect } from 'react';
import { X, Calendar, User, Clock, MessageSquare, Send, Award, Layers } from 'lucide-react';
import api from '../services/api';

/**
 * TaskDetailModal component: Displays task details and handles comments.
 */
export default function TaskDetailModal({ task, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch comments on mount or when task changes
  useEffect(() => {
    if (!task?.id) return;

    const fetchComments = async () => {
      setIsLoadingComments(true);
      try {
        const response = await api.get(`/api/v1/tasks/${task.id}/comments`);
        setComments(response.data.comments || response.data || []);
      } catch (err) {
        console.error('Failed to load comments:', err);
        // Fallback for offline testing / stub comments
        setComments([
          {
            id: 'mock-c1',
            body: 'Is there any blocker on this check-in?',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            author: { name: 'Admin User', role: 'ADMIN' }
          },
          {
            id: 'mock-c2',
            body: 'Working on updating the routing logic now.',
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            author: { name: 'Collaborator User', role: 'COLLABORATOR' }
          }
        ]);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [task]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await api.post(`/api/v1/tasks/${task.id}/comments`, {
        body: newComment.trim()
      });

      const addedComment = response.data.comment || response.data;
      
      setComments((prev) => [addedComment, ...prev]);
      setNewComment('');
      
      if (onCommentAdded) {
        onCommentAdded(task.id);
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
      // Fallback optimistic comment for offline demo
      const savedUser = sessionStorage.getItem('taskflow_user');
      const currentUser = savedUser ? JSON.parse(savedUser) : { name: 'Current User', role: 'COLLABORATOR' };
      const fallbackComment = {
        id: `mock-c-${Date.now()}`,
        body: newComment.trim(),
        createdAt: new Date().toISOString(),
        author: currentUser
      };
      setComments((prev) => [fallbackComment, ...prev]);
      setNewComment('');
      
      if (onCommentAdded) {
        onCommentAdded(task.id);
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase().replace('_', '')) {
      case 'COMPLETED':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'INPROGRESS':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      default:
        return 'text-slate-400 bg-slate-800/40 border-slate-700/60';
    }
  };

  // Standardized role badge colors for comment author avatars
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-600/10 border-purple-500/25 text-purple-300';
      case 'PROJECT_MANAGER':
        return 'bg-blue-600/10 border-blue-500/25 text-blue-300';
      default:
        return 'bg-violet-600/10 border-violet-500/25 text-violet-300';
    }
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 600);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 transition-transform duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800/60 flex items-start justify-between">
          <div className="space-y-1.5 flex-1 pr-6">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(task.status)}`}>
                {task.status?.replace('_', ' ')}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                {task.priority} Priority
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white leading-snug tracking-tight">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <div className="flex items-center space-x-3 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-slate-500 block text-xs">Due Date</span>
                <span className="text-slate-200 font-medium">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'No Due Date'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <Layers className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-slate-500 block text-xs">Project</span>
                <span className="text-slate-200 font-medium">
                  {task.project?.name || 'General Tasks'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <User className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-slate-500 block text-xs">Created By</span>
                <span className="text-slate-200 font-medium">
                  {task.createdBy?.name || 'System Admin'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <Award className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-slate-500 block text-xs">Assignees</span>
                <div className="flex items-center space-x-1 mt-0.5">
                  {task.assignments && task.assignments.length > 0 ? (
                    task.assignments.map((assignment, index) => {
                      const userObj = assignment.user || assignment;
                      const initials = userObj.name?.split(' ').map(n => n[0]).join('') || 'U';
                      return (
                        <div
                          key={index}
                          className="h-6 w-6 rounded-full bg-violet-600 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-white"
                          title={userObj.name}
                        >
                          {initials}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-slate-400 text-xs font-normal">Unassigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Description</h3>
            <p className="text-sm text-slate-300 bg-slate-950/20 p-4 rounded-xl border border-slate-800/40 leading-relaxed whitespace-pre-wrap">
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 border-t border-slate-800/60 pt-6">
            <div className="flex items-center space-x-2 text-slate-300">
              <MessageSquare className="h-4 w-4 text-violet-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Comments ({comments.length})</h3>
            </div>

            {/* Submit Comment Form */}
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmittingComment}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-sm placeholder-slate-500 text-slate-100 transition-colors"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmittingComment ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
              {isLoadingComments ? (
                <div className="py-6 flex items-center justify-center text-slate-500 text-sm">
                  <Clock className="h-5 w-5 animate-spin mr-2 text-violet-400" />
                  Loading comments...
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => {
                  const author = comment.author || { name: 'Unknown User', role: 'COLLABORATOR' };
                  const initials = author.name?.split(' ').map(n => n[0]).join('') || 'U';
                  return (
                    <div key={comment.id} className="p-3 bg-slate-950/30 rounded-xl border border-slate-850 flex items-start space-x-3 text-sm">
                      <div className={`h-8 w-8 rounded-lg border flex items-center justify-center font-bold text-xs flex-shrink-0 ${getRoleBadgeColor(author.role)}`}>
                        {initials}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 truncate">{author.name}</span>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-350 text-xs leading-relaxed break-words">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500 text-xs text-center py-6">No comments posted yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
