import { useState, useEffect, useCallback } from 'react';
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
  CheckCircle,
  AlertTriangle,
  Tag,
  Plus,
  Paperclip,
  Upload,
  Download,
  FileText,
  File,
  FileSpreadsheet,
  FileArchive,
  FileImage,
  Loader
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';

export default function TaskDetailModal({ task, onClose, onCommentAdded, onTaskUpdated, onTaskDeleted }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { getSocket, notifications } = useNotifications();

  const [localTask, setLocalTask] = useState(task);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Task attachments states
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingIndex, setUploadingIndex] = useState(-1);

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
  const [isSaving, setIsSaving] = useState(false);

  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [editedAssigneeIds, setEditedAssigneeIds] = useState([]);
  
  const [availableLabels, setAvailableLabels] = useState(['BUG', 'FEATURE', 'URGENT', 'DOCUMENTATION', 'REFACTOR']);
  const [editedLabels, setEditedLabels] = useState([]);
  const [newLabelInput, setNewLabelInput] = useState('');

  // Fetch project members for reassigning
  const fetchProjectMembers = useCallback(async (pId) => {
    try {
      setLoadingMembers(true);
      const response = await api.get(`/api/v1/projects/${pId}/members`);
      setProjectMembers(response.data);
    } catch (err) {
      console.error('Failed to fetch project members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  // Fetch attachments definition
  const fetchAttachments = useCallback(async (showLoading = true) => {
    if (!task?.id) return;
    if (showLoading) setIsLoadingAttachments(true);
    try {
      const response = await api.get(`/api/v1/tasks/${task.id}/attachments`);
      setAttachments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    } finally {
      setIsLoadingAttachments(false);
    }
  }, [task.id]);

  // Fetch full details of the task
  const fetchFullTaskDetails = useCallback(async () => {
    try {
      const response = await api.get(`/api/v1/tasks/${task.id}`);
      const data = response.data;
      setLocalTask(data);
      // Sync edit states
      setEditedTitle(data.title || '');
      setEditedDescription(data.description || '');
      setEditedPriority(data.priority || 'MEDIUM');
      setEditedStatus(data.status || 'TODO');
      setEditedDueDate(data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '');
      setEditedAssigneeIds(data.assignments?.map((a) => a.userId || a.user?.id) || []);
      setEditedLabels(data.labels?.map((l) => l.name) || []);
      
      if (data.comments) {
        setComments(data.comments);
      }

      if (data.projectId) {
        fetchProjectMembers(data.projectId);
      }
      
      // Fetch attachments on reload silently
      fetchAttachments(false);
    } catch (err) {
      console.error('Failed to fetch full task details:', err);
      if (err.response?.status === 404) {
        addToast('This task has been deleted or is no longer accessible.', 'error');
        onClose();
        if (onTaskDeleted) {
          onTaskDeleted(task.id);
        }
      }
    }
  }, [task.id, fetchProjectMembers, onClose, onTaskDeleted, addToast, fetchAttachments]);

  useEffect(() => {
    if (task?.id) {
      const timer = setTimeout(() => {
        fetchFullTaskDetails();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [task?.id, fetchFullTaskDetails]);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const response = await api.get('/api/v1/tasks/labels');
        const names = response.data.map(l => l.name);
        setAvailableLabels(prev => Array.from(new Set([...prev, ...names])));
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    };
    fetchLabels();
  }, []);

  // Connect socket.io listeners for attachments
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAttachmentUploaded = (data) => {
      if (data && data.taskId === task.id) {
        setAttachments((prev) => {
          if (prev.some((a) => a.id === data.attachment.id)) return prev;
          return [data.attachment, ...prev];
        });
      }
    };

    const handleAttachmentDeleted = (data) => {
      if (data && data.taskId === task.id) {
        setAttachments((prev) => prev.filter((a) => a.id !== data.attachmentId));
      }
    };

    socket.on('attachment_uploaded', handleAttachmentUploaded);
    socket.on('attachment_deleted', handleAttachmentDeleted);

    return () => {
      socket.off('attachment_uploaded', handleAttachmentUploaded);
      socket.off('attachment_deleted', handleAttachmentDeleted);
    };
  }, [getSocket, task.id]);

  const handleAddNewLabel = () => {
    const name = newLabelInput.trim().toUpperCase();
    if (!name) return;
    if (!availableLabels.includes(name)) {
      setAvailableLabels(prev => [...prev, name]);
    }
    if (!editedLabels.includes(name)) {
      setEditedLabels(prev => [...prev, name]);
    }
    setNewLabelInput('');
  };

  const toggleLabel = (label) => {
    setEditedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  // Real-time socket notification update trigger
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (latest && latest.message && latest.message.includes(`task:${task.id}`)) {
        const timer = setTimeout(() => {
          fetchFullTaskDetails();
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications, task.id, fetchFullTaskDetails]);

  // Close panel on Escape key
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
  }, [task?.id]);

  // Permission helpers
  const canEditTask = 
    user?.role === 'ADMIN' || 
    user?.role === 'SUPER_ADMIN' || 
    (user?.role === 'PROJECT_MANAGER' && localTask.project?.ownerId === user?.id);

  const canChangeStatus = 
    user?.role === 'ADMIN' || 
    user?.role === 'SUPER_ADMIN' || 
    (user?.role === 'PROJECT_MANAGER' && localTask.project?.ownerId === user?.id) ||
    (user?.role === 'COLLABORATOR' && localTask.assignments?.some(a => (a.userId || a.user?.id) === user?.id));

  // Save changes (Admin/PM details edit)
  const handleSaveTask = async () => {
    if (!editedTitle.trim()) {
      addToast('Task title is required.', 'error');
      return;
    }
    if (editedAssigneeIds.length === 0) {
      addToast('At least one assignee is required.', 'error');
      return;
    }

    if (editedDueDate) {
      const selectedDue = new Date(editedDueDate);
      selectedDue.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const originalDue = task.dueDate ? new Date(task.dueDate) : null;
      if (originalDue) {
        originalDue.setHours(0, 0, 0, 0);
      }

      if ((!originalDue || originalDue.getTime() !== selectedDue.getTime()) && selectedDue < today) {
        addToast('Due date cannot be in the past.', 'error');
        return;
      }
    }

    setIsSaving(true);
    try {
      const response = await api.put(`/api/v1/tasks/${task.id}`, {
        title: editedTitle.trim(),
        description: editedDescription.trim(),
        priority: editedPriority,
        status: editedStatus,
        dueDate: editedDueDate ? new Date(editedDueDate).toISOString() : null,
        assignedUserIds: editedAssigneeIds,
        labels: editedLabels,
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
      fetchFullTaskDetails();
    } catch (err) {
      console.error('Failed to update task:', err);
      addToast(err.response?.data?.message || 'Failed to update task.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Change task status directly
  const handleStatusChange = async (newStatus) => {
    setIsSaving(true);
    try {
      const response = await api.patch(`/api/v1/tasks/${task.id}/status`, { status: newStatus });
      addToast(`Task status updated to ${newStatus.replace('_', ' ').toLowerCase()}`, 'success');
      
      const updated = {
        ...localTask,
        ...response.data,
      };
      setLocalTask(updated);
      
      if (onTaskUpdated) {
        onTaskUpdated(updated);
      }
      fetchFullTaskDetails();
    } catch (err) {
      console.error('Failed to update status:', err);
      addToast(err.response?.data?.message || 'Failed to update status.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkComplete = () => {
    handleStatusChange('COMPLETED');
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
      fetchFullTaskDetails();
    } catch (err) {
      console.error('Failed to submit comment:', err);
      addToast(err.response?.data?.message || 'Failed to submit comment.', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFileSelect = (filesInput) => {
    if (!filesInput) return;
    
    // Normalize input to array of files (FileList, Array, or single File)
    let files = [];
    if (filesInput.name) {
      files = [filesInput];
    } else {
      files = Array.from(filesInput);
    }
    
    if (files.length === 0) return;

    setSelectedFiles((prev) => {
      const currentLength = prev.length;
      const spaceLeft = 5 - currentLength;
      
      if (spaceLeft <= 0) {
        addToast('You can only upload up to 5 files at a time.', 'error');
        return prev;
      }
      
      // Calculate current total size of already queued files
      let currentTotalSize = prev.reduce((sum, f) => sum + f.size, 0);
      const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB total limit
      
      const newFilesToAdd = [];
      let sizeErrorShown = false;
      let zeroSizeErrorShown = false;
      let totalSizeErrorShown = false;

      for (const file of files) {
        if (newFilesToAdd.length + currentLength >= 5) {
          addToast('Limit reached. Max 5 files can be queued.', 'warning');
          break;
        }
        
        // Exceed individual max size: 20MB
        if (file.size > 20 * 1024 * 1024) {
          if (!sizeErrorShown) {
            addToast(`"${file.name}" exceeds the 20 MB maximum size limit.`, 'error');
            sizeErrorShown = true;
          }
          continue;
        }

        // Exceed total batch size limit (20MB)
        if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
          if (!totalSizeErrorShown) {
            const availableSpaceMB = ((MAX_TOTAL_SIZE - currentTotalSize) / (1024 * 1024)).toFixed(2);
            addToast(`Total batch size exceeds 20 MB limit. Available space: ${availableSpaceMB} MB.`, 'error');
            totalSizeErrorShown = true;
          }
          continue;
        }
        
        // Exceed min size requirement: 0 bytes is invalid
        if (file.size === 0) {
          if (!zeroSizeErrorShown) {
            addToast(`"${file.name}" is empty and cannot be uploaded.`, 'error');
            zeroSizeErrorShown = true;
          }
          continue;
        }

        // Avoid duplicate selection
        if (prev.some((f) => f.name === file.name && f.size === file.size)) {
          continue;
        }
        
        newFilesToAdd.push(file);
        currentTotalSize += file.size; // Update running sum
      }
      
      if (newFilesToAdd.length > 0) {
        addToast(`${newFilesToAdd.length} file(s) added to upload queue.`, 'success');
      }
      
      return [...prev, ...newFilesToAdd];
    });
  };

  // Upload attachment files in batch (sequentially)
  const handleMultipleFilesUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadingIndex(i);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await api.post(`/api/v1/tasks/${task.id}/attachments`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          },
        });
        
        setAttachments((prev) => {
          if (prev.some((a) => a.id === response.data.id)) return prev;
          return [response.data, ...prev];
        });
        successCount++;
      } catch (err) {
        console.error(`Upload failed for file "${file.name}":`, err);
        addToast(`Failed to upload "${file.name}": ${err.response?.data?.message || 'Server error'}`, 'error');
      }
    }

    setIsUploading(false);
    setUploadingIndex(-1);
    setUploadProgress(0);
    
    if (successCount > 0) {
      addToast(`Successfully uploaded ${successCount} file(s)!`, 'success');
      fetchFullTaskDetails();
    }
    
    setSelectedFiles([]);
  };

  // Delete attachment file
  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await api.delete(`/api/v1/attachments/${attachmentId}`);
      addToast('Attachment deleted successfully.', 'success');
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      fetchFullTaskDetails();
    } catch (err) {
      console.error('Delete failed:', err);
      addToast(err.response?.data?.message || 'Delete failed.', 'error');
    }
  };

  // Download signed URL download trigger
  const handleDownloadAttachment = (attachment) => {
    const token = sessionStorage.getItem('taskflow_token');
    const downloadUrl = `${api.defaults.baseURL || ''}/api/v1/attachments/${attachment.id}/download?token=${token}`;
    window.open(downloadUrl, '_blank');
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
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-slate-400 bg-[#1e1e1f] border-slate-800';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return 'avatar-initials-purple';
      case 'PROJECT_MANAGER':
        return 'avatar-initials-blue';
      default:
        return 'avatar-initials-violet';
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

  const formatDueDate = (dateString) => {
    if (!dateString) return 'No Due Date';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Right Panel */}
      <div className="relative w-full max-w-lg md:max-w-xl bg-[#252526] border-l border-slate-850 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 select-none">
        
        {/* Header Action Bar */}
        <div className="p-5 border-b border-slate-850 flex items-center justify-between flex-shrink-0 bg-[#252526]">
          <div className="flex items-center space-x-3">
            {/* Mark Complete Button / Status Badge */}
            {localTask.status === 'COMPLETED' ? (
              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span>Completed</span>
              </span>
            ) : (
              <button
                onClick={handleMarkComplete}
                disabled={!canChangeStatus || isSaving}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Mark Complete</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {canEditTask && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveTask}
                      disabled={isSaving}
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-600 transition-colors cursor-pointer"
                      title="Save Changes"
                    >
                      {isSaving ? <Clock className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        fetchFullTaskDetails();
                      }}
                      className="p-1.5 rounded-lg bg-slate-905 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Cancel Edit"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 rounded-lg bg-slate-905 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Edit Task"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleDeleteTask}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-600 text-rose-400 hover:text-white transition-colors cursor-pointer"
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-905 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Task Title */}
          <div className="space-y-1.5">
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#1e1e1f] border border-slate-800 focus:outline-none focus:border-violet-500 rounded-xl text-base font-bold text-white"
                placeholder="Task Title"
              />
            ) : (
              <h2 className="text-xl font-extrabold text-white leading-snug tracking-tight">
                {localTask.title}
              </h2>
            )}
          </div>

          {/* Status Badge Selection */}
          <div className="flex items-center space-x-2 border-b border-slate-850 pb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status:</span>
            {canChangeStatus && localTask.status !== 'COMPLETED' ? (
              <select
                value={localTask.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1e1e1f] border border-slate-800 text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            ) : (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(localTask.status)}`}>
                {localTask.status?.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Information Section Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
            {/* Project Name */}
            <div className="flex items-center space-x-3 text-sm">
              <Layers className="h-4 w-4 text-slate-500" />
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Project</span>
                <span className="text-white font-medium">
                  {localTask.project?.name || 'General Tasks'}
                </span>
              </div>
            </div>

            {/* Created By */}
            <div className="flex items-center space-x-3 text-sm">
              <User className="h-4 w-4 text-slate-500" />
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Created By</span>
                <span className="text-white font-medium">
                  {localTask.createdBy?.name || 'System Admin'}
                </span>
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center space-x-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-slate-500" />
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Priority</span>
                {isEditing ? (
                  <select
                    value={editedPriority}
                    onChange={(e) => setEditedPriority(e.target.value)}
                    className="px-2 py-0.5 bg-[#1e1e1f] border border-slate-800 rounded-lg text-xs text-slate-200 mt-0.5"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                ) : (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getPriorityColor(localTask.priority)}`}>
                    {localTask.priority}
                  </span>
                )}
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-center space-x-3 text-sm">
              <Calendar className="h-4 w-4 text-slate-500" />
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Due Date</span>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedDueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEditedDueDate(e.target.value)}
                    className="px-2 py-0.5 bg-[#1e1e1f] border border-slate-800 rounded-lg text-xs text-slate-200 mt-0.5"
                  />
                ) : (
                  <span className="text-white font-medium">
                    {formatDueDate(localTask.dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Assignees Section */}
          <div className="space-y-2 pt-1">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              Assignees <span className="text-rose-500">*</span>
            </h3>
            {isEditing ? (
              loadingMembers ? (
                <div className="text-slate-500 text-xs py-2 flex items-center gap-1.5 animate-pulse">
                  <Clock className="h-3.5 w-3.5 animate-spin text-violet-500" /> Loading project members...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-900/20 border border-slate-850 rounded-xl">
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
                            ? 'bg-violet-600/10 border-violet-500/50 text-violet-300'
                            : 'bg-[#1e1e1f] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="accent-violet-500 pointer-events-none"
                        />
                        <div className="min-w-0 text-xs">
                          <p className="font-bold truncate text-white">{member.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{member.role?.replace('_', ' ')}</p>
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
                    const role = userObj.role || 'COLLABORATOR';
                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${
                          role === 'SUPER_ADMIN' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          role === 'ADMIN' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                          role === 'PROJECT_MANAGER' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                          'bg-slate-500/10 border-slate-600/20 text-slate-350'
                        }`}
                        title={userObj.name}
                      >
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black uppercase shrink-0 border ${
                          role === 'SUPER_ADMIN' ? 'avatar-initials-amber' :
                          role === 'ADMIN' ? 'avatar-initials-purple' :
                          role === 'PROJECT_MANAGER' ? 'avatar-initials-blue' :
                          'avatar-initials-violet'
                        }`}>
                          {initials}
                        </div>
                        <span className="text-white">{userObj.name}</span>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-slate-500 text-xs italic">Unassigned</span>
                )}
              </div>
            )}
          </div>

          {/* Labels/Tags Section */}
          <div className="space-y-2 border-t border-slate-850 pt-4 pb-1">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Tags / Labels
            </h3>
            {isEditing ? (
              <div className="flex flex-wrap gap-2 items-center">
                {availableLabels.map((lbl) => {
                  const isSelected = editedLabels.includes(lbl);
                  return (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => toggleLabel(lbl)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-violet-600 border-violet-500 text-white shadow shadow-violet-600/30'
                          : 'bg-[#1e1e1f] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {lbl}
                    </button>
                  );
                })}

                {/* Inline Add Custom Label Input and Button */}
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    placeholder="Custom tag..."
                    value={newLabelInput}
                    onChange={(e) => setNewLabelInput(e.target.value)}
                    className="px-2.5 py-1.5 bg-[#1e1e1f] border border-slate-800 rounded-lg text-[10px] font-bold text-slate-250 outline-none focus:border-violet-500 w-24 placeholder:text-slate-650"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewLabel();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewLabel}
                    className="p-1.5 bg-[#1e1e1f] border border-slate-800 text-slate-450 hover:text-white hover:border-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    title="Add Custom Tag"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {localTask.labels && localTask.labels.length > 0 ? (
                  localTask.labels.map((lbl) => (
                    <span
                      key={lbl.id || lbl.name}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-violet-600/10 border border-violet-500/20 text-violet-300"
                    >
                      {lbl.name}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs italic">No labels assigned</span>
                )}
              </div>
            )}
          </div>

          {/* Task Description */}
          <div className="space-y-2 border-t border-slate-850 pt-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</h3>
            {isEditing ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full px-4 py-3 bg-[#1e1e1f] border border-slate-800 focus:outline-none focus:border-violet-500 rounded-xl text-xs text-white h-24 resize-none"
                placeholder="Task description details..."
              />
            ) : (
              <p className="text-xs text-slate-300 bg-slate-900/30 p-4 rounded-xl border border-slate-850 leading-relaxed whitespace-pre-wrap">
                {localTask.description || 'No description provided.'}
              </p>
            )}
          </div>

          {/* Attachments Section */}
          <div className="space-y-4 border-t border-slate-850 pt-6">
            <div className="flex items-center space-x-2 text-slate-400">
              <Paperclip className="h-4 w-4 text-violet-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider">Attachments ({attachments.length})</h3>
            </div>

            {/* Drag and Drop File area / Selected Files Queue Container */}
            {selectedFiles.length === 0 ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragActive(false);
                  if (e.dataTransfer.files) {
                    handleFileSelect(e.dataTransfer.files);
                  }
                }}
                className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors duration-150 ${
                  isDragActive 
                    ? 'border-violet-500 bg-violet-950/15' 
                    : 'border-slate-800 bg-[#1e1e1f] hover:border-slate-700'
                }`}
              >
                <Upload className={`h-5 w-5 ${isDragActive ? 'text-violet-400 animate-bounce' : 'text-slate-500'}`} />
                <div className="text-center">
                  <label className="text-xs font-bold text-violet-400 hover:text-violet-300 cursor-pointer">
                    Click to upload
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileSelect(e.target.files);
                        }
                      }}
                    />
                  </label>
                  <span className="text-[10px] text-slate-500 block mt-0.5">or drag & drop files here (Max 5 files, 20MB each)</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-[#1e1e1f] rounded-xl border border-violet-500/35 flex flex-col gap-3.5 transition-all">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload Queue ({selectedFiles.length}/5)</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    disabled={isUploading}
                    className="text-[10px] text-rose-450 hover:text-rose-450 font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850 text-xs">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Paperclip className={`h-3.5 w-3.5 shrink-0 ${uploadingIndex === idx ? 'text-violet-400 animate-pulse' : 'text-slate-500'}`} />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate" title={file.name}>{file.name}</p>
                          <p className="text-[9px] text-slate-500">
                            {file.size > 1024 * 1024 
                              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
                              : `${(file.size / 1024).toFixed(1)} KB`}
                          </p>
                        </div>
                      </div>
                      
                      {uploadingIndex === idx ? (
                        <span className="text-[9px] font-bold text-violet-400 animate-pulse">Uploading...</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={isUploading}
                          className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {selectedFiles.length < 5 && (
                  <label
                    onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragActive(false);
                      if (e.dataTransfer.files) {
                        handleFileSelect(e.dataTransfer.files);
                      }
                    }}
                    className={`border border-dashed rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors duration-150 ${
                      isDragActive 
                        ? 'border-violet-500 bg-violet-950/15' 
                        : 'border-slate-850 hover:border-slate-700 bg-slate-900/30 hover:bg-[#1e1e1f] text-slate-450 hover:text-white'
                    }`}
                  >
                    <Plus className="h-4 w-4 text-violet-400" />
                    <span className="text-[10px] font-bold">Add more files (drag & drop or click)</span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      disabled={isUploading}
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileSelect(e.target.files);
                        }
                      }}
                    />
                  </label>
                )}

                <button
                  type="button"
                  onClick={handleMultipleFilesUpload}
                  disabled={isUploading}
                  className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-violet-550/10"
                >
                  {isUploading ? (
                    <>
                      <Loader className="h-3.5 w-3.5 animate-spin" />
                      Uploading ({uploadingIndex + 1}/{selectedFiles.length})...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Uploading progress bar */}
            {isUploading && uploadingIndex >= 0 && (
              <div className="space-y-1 bg-slate-900/50 p-2.5 rounded-xl border border-slate-850">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1.5 truncate max-w-[75%]">
                    <Loader className="h-3 w-3 animate-spin text-violet-500 shrink-0" />
                    Uploading "{selectedFiles[uploadingIndex]?.name}"
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-violet-600 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* List of Attachments */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {isLoadingAttachments ? (
                <div className="py-4 flex items-center justify-center text-slate-500 text-xs">
                  <Loader className="h-4 w-4 animate-spin mr-2 text-violet-500" />
                  Loading attachments...
                </div>
              ) : attachments.length > 0 ? (
                attachments.map((att) => {
                  const ext = att.fileName.split('.').pop()?.toLowerCase();
                  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
                  const isPdf = ext === 'pdf';
                  
                  const sizeKB = (att.size / 1024).toFixed(1);
                  const sizeMB = (att.size / (1024 * 1024)).toFixed(1);
                  const sizeLabel = att.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

                  return (
                    <div key={att.id} className="p-3 bg-[#1e1e1f] rounded-xl border border-slate-850 flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-905 border border-slate-800 text-slate-400 shrink-0">
                            {isImage ? (
                              <FileImage className="h-4 w-4 text-violet-400" />
                            ) : isPdf ? (
                              <FileText className="h-4 w-4 text-rose-400" />
                            ) : ext === 'zip' ? (
                              <FileArchive className="h-4 w-4 text-amber-400" />
                            ) : ext === 'xlsx' || ext === 'xls' ? (
                              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <File className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 text-xs">
                            <p className="font-bold text-white truncate" title={att.fileName}>{att.fileName}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <span>{sizeLabel}</span>
                              <span>•</span>
                              <span>By {att.uploader?.name || 'User'}</span>
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => handleDownloadAttachment(att)}
                            className="p-1.5 rounded-lg bg-slate-905 border border-slate-800 text-slate-450 hover:text-white cursor-pointer transition-colors"
                            title="Download file"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || att.uploadedBy === user?.id || localTask.project?.ownerId === user?.id) && (
                            <button
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-600 text-rose-450 hover:text-white cursor-pointer transition-colors"
                              title="Delete file"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Image Preview */}
                      {isImage && (
                        <div className="relative rounded-lg overflow-hidden border border-slate-850/80 max-h-32 flex justify-center bg-slate-950/20">
                          <img
                            src={`${api.defaults.baseURL || ''}/api/v1/attachments/${att.id}/download?token=${sessionStorage.getItem('taskflow_token')}`}
                            alt={att.fileName}
                            className="object-contain max-h-32 max-w-full"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* PDF Preview Frame */}
                      {isPdf && (
                        <div className="rounded-lg overflow-hidden border border-slate-850 h-36 bg-slate-905/10">
                          <iframe
                            src={`${api.defaults.baseURL || ''}/api/v1/attachments/${att.id}/download?token=${sessionStorage.getItem('taskflow_token')}#toolbar=0`}
                            title={att.fileName}
                            className="w-full h-full border-0 opacity-80"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-550 text-xs text-center py-4 italic">No files attached.</p>
              )}
            </div>
          </div>


          {/* Comments Section */}
          <div className="space-y-4 border-t border-slate-850 pt-6">
            <div className="flex items-center space-x-2 text-slate-400">
              <MessageSquare className="h-4 w-4 text-violet-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider">Comments ({comments.length})</h3>
            </div>

            {/* Comment Form input */}
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmittingComment}
                className="flex-1 px-4 py-2.5 bg-[#1e1e1f] border border-slate-800 focus:outline-none focus:border-violet-500 rounded-xl text-xs placeholder-slate-500 text-white transition-colors"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmittingComment ? (
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </form>

            {/* Scrollable Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {isLoadingComments ? (
                <div className="py-6 flex items-center justify-center text-slate-500 text-xs">
                  <Clock className="h-4 w-4 animate-spin mr-2 text-violet-500" />
                  Loading comments...
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => {
                  const author = comment.author || { name: 'Unknown User', role: 'COLLABORATOR' };
                  const initials = author.name?.split(' ').map(n => n[0]).join('') || 'U';
                  return (
                    <div key={comment.id} className="p-3 bg-[#1e1e1f] rounded-xl border border-slate-850 flex items-start space-x-3 text-xs">
                      <div className={`h-8 w-8 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${getRoleBadgeColor(author.role)}`}>
                        {initials}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white truncate">{author.name}</span>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed break-words text-[11px]">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-550 text-xs text-center py-6 italic">No comments posted yet.</p>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-4 border-t border-slate-850 pt-6 pb-2">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Activity Timeline</h3>
            <div className="space-y-3.5">
              {localTask.activities && localTask.activities.length > 0 ? (
                [...localTask.activities].reverse().map((act) => (
                  <div key={act.id} className="flex items-start space-x-3 text-[11px]">
                    <div className="h-5.5 w-5.5 rounded-full avatar-initials-violet flex items-center justify-center font-bold text-[8px] uppercase shrink-0 mt-0.5 border">
                      {act.userName?.split(' ').map(n => n[0]).join('') || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-300">
                        {act.action.startsWith(act.userName) ? (
                          <>
                            <span className="text-white font-bold">{act.userName}</span>
                            {act.action.slice(act.userName.length)}
                          </>
                        ) : (
                          <>
                            <span className="text-white font-bold">{act.userName}</span> {act.action}
                          </>
                        )}
                      </p>
                      <p className="text-[9px] text-slate-550 mt-0.5">
                        {formatRelativeTime(act.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-550 text-xs italic">No activities logged yet.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
