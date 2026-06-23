import { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  Clock, 
  MessageSquare, 
  Send, 
  Award, 
  Layers, 
  Edit3, 
  Trash2, 
  Save, 
  RotateCcw,
  Paperclip,
  Tag,
  Upload
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function TaskDetailModal({ task, onClose, onCommentAdded, onTaskUpdated, onTaskDeleted }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [localTask, setLocalTask] = useState(task);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Edit fields state
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title || '');
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedPriority, setEditedPriority] = useState(task.priority || 'MEDIUM');
  const [editedStatus, setEditedStatus] = useState(task.status || 'TODO');
  const [editedDueDate, setEditedDueDate] = useState(() => {
    if (!task.dueDate) return '';
    return new Date(task.dueDate).toISOString().split('T')[0];
  });
  const [editedLabels, setEditedLabels] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [editedAssigneeIds, setEditedAssigneeIds] = useState([]);

  // Fetch full details of the task including attachments, watchers, and labels
  const fetchFullTaskDetails = async () => {
    try {
      const response = await api.get(`/api/v1/tasks/${task.id}`);
      setLocalTask(response.data);
      // Sync edit states
      setEditedTitle(response.data.title || '');
      setEditedDescription(response.data.description || '');
      setEditedPriority(response.data.priority || 'MEDIUM');
      setEditedStatus(response.data.status || 'TODO');
      setEditedDueDate(response.data.dueDate ? new Date(response.data.dueDate).toISOString().split('T')[0] : '');
      setEditedLabels(response.data.labels?.map((l) => l.name) || []);
      setEditedAssigneeIds(response.data.assignments?.map((a) => a.userId || a.user?.id) || []);
      
      if (response.data.comments) {
        setComments(response.data.comments);
      }

      if (response.data.projectId) {
        fetchProjectMembers(response.data.projectId);
      }
    } catch (err) {
      console.error('Failed to fetch full task details:', err);
    }
  };

  const fetchProjectMembers = async (pId) => {
    try {
      setLoadingMembers(true);
      const response = await api.get(`/api/v1/projects/${pId}/members`);
      setProjectMembers(response.data);
    } catch (err) {
      console.error('Failed to fetch project members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (task?.id) {
      fetchFullTaskDetails();
    }
  }, [task]);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch comments
  useEffect(() => {
    if (!task?.id) return;

    const fetchComments = async () => {
      setIsLoadingComments(true);
      try {
        const response = await api.get(`/api/v1/tasks/${task.id}/comments`);
        setComments(response.data.comments || response.data || []);
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [task]);

  const handleSaveTask = async () => {
    if (!editedTitle.trim()) {
      addToast('Task title is required.', 'error');
      return;
    }
    if (editedAssigneeIds.length === 0) {
      addToast('At least one assignee is required.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const response = await api.put(`/api/v1/tasks/${task.id}`, {
        title: editedTitle.trim(),
        description: editedDescription.trim(),
        priority: editedPriority,
        status: editedStatus,
        dueDate: editedDueDate ? new Date(editedDueDate).toISOString() : null,
        labels: editedLabels,
        assignedUserIds: editedAssigneeIds,
      });
      addToast('Task updated successfully!', 'success');
      setIsEditing(false);
      
      const updated = {
        ...localTask,
        ...response.data,
      };
      setLocalTask(updated);
      
      if (onTaskUpdated) {
        onTaskUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      addToast(err.response?.data?.message || 'Failed to update task.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/api/v1/tasks/${task.id}`);
      addToast('Task deleted successfully.', 'success');
      if (onTaskDeleted) {
        onTaskDeleted(task.id);
      }
      onClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
      addToast(err.response?.data?.message || 'Failed to delete task.', 'error');
    }
  };

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
    } finally {
      setIsSubmittingComment(false);
    }
  };


  // --- ATTACHMENTS MANAGEMENT ---
  const handleUploadAttachment = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/api/v1/tasks/${task.id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      addToast('File attached successfully.', 'success');
      fetchFullTaskDetails();
    } catch (err) {
      console.error('Failed to upload file:', err);
      addToast(err.response?.data?.message || 'File upload failed. Max size: 10MB.', 'error');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Delete this file attachment permanently?')) return;
    try {
      await api.delete(`/api/v1/tasks/attachments/${attachmentId}`);
      addToast('Attachment removed.', 'success');
      fetchFullTaskDetails();
    } catch (err) {
      console.error('Failed to delete attachment:', err);
      addToast('Failed to delete attachment.', 'error');
    }
  };

  const toggleEditLabel = (labelName) => {
    if (editedLabels.includes(labelName)) {
      setEditedLabels(editedLabels.filter((l) => l !== labelName));
    } else {
      setEditedLabels([...editedLabels, labelName]);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'MEDIUM':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      default:
        return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase().replace('_', '')) {
      case 'COMPLETED':
        return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'INPROGRESS':
        return 'text-blue-700 bg-blue-50 border-blue-100';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 border-purple-200 text-purple-700';
      case 'PROJECT_MANAGER':
        return 'bg-blue-100 border-blue-200 text-blue-700';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-700';
    }
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString();
  };

  // Get full download link
  const getDownloadUrl = (path) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `${api.defaults.baseURL || 'http://localhost:3000'}${path}`;
  };

  const allSystemLabels = ["BUG", "FEATURE", "URGENT", "DOCUMENTATION", "REFACTOR"];
  const isOwnerOrAdmin = user?.role === 'ADMIN' || localTask.project?.ownerId === user?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-transparent"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 transition-all duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="space-y-1.5 flex-1 pr-6">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
              {isEditing ? (
                <>
                  <select
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-350 text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <select
                    value={editedPriority}
                    onChange={(e) => setEditedPriority(e.target.value)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-350 text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </>
              ) : (
                <>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(localTask.status)}`}>
                    {localTask.status?.replace('_', ' ')}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getPriorityColor(localTask.priority)}`}>
                    {localTask.priority} Priority
                  </span>
                </>
              )}
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-600 rounded-xl text-base font-bold text-slate-800 mt-1"
                placeholder="Task Title"
              />
            ) : (
              <h2 className="text-xl font-extrabold text-slate-800 leading-snug tracking-tight">
                {localTask.title}
              </h2>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {isOwnerOrAdmin && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveTask}
                      disabled={isSaving}
                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 border border-emerald-100 hover:border-emerald-600 text-emerald-600 hover:text-white transition-colors cursor-pointer"
                      title="Save Changes"
                    >
                      {isSaving ? <Clock className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        fetchFullTaskDetails();
                      }}
                      className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      title="Cancel Edit"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-100 hover:bg-slate-905 transition-colors cursor-pointer"
                      title="Edit Task"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleDeleteTask}
                      className="p-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-slate-500 block text-xs">Due Date</span>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedDueDate}
                    onChange={(e) => setEditedDueDate(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 mt-0.5"
                  />
                ) : (
                  <span className="text-slate-800 font-medium">
                    {localTask.dueDate ? new Date(localTask.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'No Due Date'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <Layers className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-slate-500 block text-xs">Project</span>
                <span className="text-slate-800 font-medium">
                  {localTask.project?.name || 'General Tasks'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <User className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-slate-500 block text-xs">Created By</span>
                <span className="text-slate-800 font-medium">
                  {localTask.createdBy?.name || 'System Admin'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <Award className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-slate-500 block text-xs">Assignees</span>
                <div className="flex items-center space-x-1 mt-0.5">
                  {localTask.assignments && localTask.assignments.length > 0 ? (
                    localTask.assignments.map((assignment, index) => {
                      const userObj = assignment.user || assignment;
                      const initials = userObj.name?.split(' ').map(n => n[0]).join('') || 'U';
                      return (
                        <div
                          key={index}
                          className="h-6 w-6 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white"
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

          {/* Labels Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Task Labels
            </h3>
            {isEditing ? (
              <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                {allSystemLabels.map((labelName) => {
                  const active = editedLabels.includes(labelName);
                  return (
                    <button
                      key={labelName}
                      onClick={() => toggleEditLabel(labelName)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        active 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {labelName}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {localTask.labels && localTask.labels.length > 0 ? (
                  localTask.labels.map((lbl) => (
                    <span 
                      key={lbl.id} 
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-blue-50 border-blue-100 text-blue-700 uppercase"
                    >
                      {lbl.name}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs">No labels configured.</span>
                )}
              </div>
            )}
          </div>

          {/* Assignees Section */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              Assignees <span className="text-rose-500">*</span>
            </h3>
            {isEditing ? (
              loadingMembers ? (
                <div className="text-slate-550 text-xs py-2 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 animate-spin text-violet-500" /> Loading project members...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {projectMembers.map((member) => {
                    const isSelected = editedAssigneeIds.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setEditedAssigneeIds((prev) =>
                            prev.includes(member.id)
                              ? prev.filter((id) => id !== member.id)
                              : [...prev, member.id]
                          );
                        }}
                        className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-violet-600/10 border-violet-500 text-violet-750'
                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-350'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="accent-violet-500 pointer-events-none"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{member.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{member.role?.replace('_', ' ')}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                {localTask.assignments && localTask.assignments.length > 0 ? (
                  localTask.assignments.map((assignment, index) => {
                    const userObj = assignment.user || assignment;
                    const initials = userObj.name?.split(' ').map(n => n[0]).join('') || 'U';
                    return (
                      <div
                        key={index}
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-750 text-xs font-bold"
                        title={userObj.name}
                      >
                        <div className="h-4 w-4 rounded-full bg-violet-600 flex items-center justify-center text-[8px] font-black text-white uppercase">
                          {initials}
                        </div>
                        <span>{userObj.name}</span>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-slate-400 text-xs">Unassigned</span>
                )}
              </div>
            )}
          </div>


          {/* Description */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h3>
            {isEditing ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-600 rounded-xl text-sm text-slate-800 h-28 resize-none"
                placeholder="Task description details..."
              />
            ) : (
              <p className="text-sm text-slate-650 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                {localTask.description || 'No description provided.'}
              </p>
            )}
          </div>

          {/* Attachments Section */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Attachments ({localTask.attachments?.length || 0})
              </h3>
              
              <label className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold flex items-center space-x-1 cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload File</span>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleUploadAttachment} 
                />
              </label>
            </div>

            {localTask.attachments && localTask.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {localTask.attachments.map((file) => (
                  <div key={file.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <a 
                          href={getDownloadUrl(file.fileUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs font-semibold text-blue-600 hover:underline truncate block"
                        >
                          {file.fileName}
                        </a>
                        <span className="text-[10px] text-slate-400 block mt-0.5">by {file.uploadedBy?.name || 'User'}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteAttachment(file.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold p-1 cursor-pointer shrink-0"
                      title="Remove Attachment"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs py-2">No file attachments loaded.</p>
            )}
          </div>

          {/* Comments Section */}
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div className="flex items-center space-x-2 text-slate-600">
              <MessageSquare className="h-4 w-4 text-violet-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Comments ({comments.length})</h3>
            </div>

            {/* Submit Comment Form */}
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmittingComment}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-250 focus:outline-none focus:ring-1 focus:ring-violet-600 rounded-xl text-sm placeholder-slate-400 text-slate-800 transition-colors"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmittingComment ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-3.5 max-h-62 overflow-y-auto pr-1">
              {isLoadingComments ? (
                <div className="py-6 flex items-center justify-center text-slate-500 text-sm">
                  <Clock className="h-5 w-5 animate-spin mr-2 text-violet-600" />
                  Loading comments...
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => {
                  const author = comment.author || { name: 'Unknown User', role: 'COLLABORATOR' };
                  const initials = author.name?.split(' ').map(n => n[0]).join('') || 'U';
                  return (
                    <div key={comment.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start space-x-3 text-sm">
                      <div className={`h-8 w-8 rounded-lg border flex items-center justify-center font-bold text-xs flex-shrink-0 ${getRoleBadgeColor(author.role)}`}>
                        {initials}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 truncate">{author.name}</span>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed break-words">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-400 text-xs text-center py-6">No comments posted yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
