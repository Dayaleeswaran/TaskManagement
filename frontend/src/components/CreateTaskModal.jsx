import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function CreateTaskModal({ onClose, onTaskCreated }) {
  const { addToast } = useToast();
  
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    // Default to 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [estimatedHours, setEstimatedHours] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assignedUserIds, setAssignedUserIds] = useState([]);

  const AVAILABLE_LABELS = ['BUG', 'FEATURE', 'URGENT', 'DOCUMENTATION', 'REFACTOR'];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await api.get('/api/v1/projects');
        const activeProjects = response.data.filter(p => !p.deletedAt);
        setProjects(activeProjects);
        if (activeProjects.length > 0) {
          setProjectId(activeProjects[0].id);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
        addToast('Failed to load projects list.', 'error');
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        const res = await api.get(`/api/v1/projects/${projectId}/members`);
        setProjectMembers(res.data);
        setAssignedUserIds([]);
      } catch (err) {
        console.error('Failed to load project members:', err);
        addToast('Failed to load project members.', 'error');
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, [projectId]);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Task title is required.', 'error');
      return;
    }
    if (!projectId) {
      addToast('Please select a project.', 'error');
      return;
    }
    if (assignedUserIds.length === 0) {
      addToast('At least one assignee is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        projectId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        labels: selectedLabels,
        assignedUserIds,
      };

      await api.post('/api/v1/tasks', payload);
      addToast('Task created successfully!', 'success');
      onTaskCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create task:', err);
      addToast(err.response?.data?.message || 'Failed to create task.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLabel = (label) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-850 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto kanban-scroll-container">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
          <h2 className="text-xl font-bold text-slate-100">
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-950 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadingProjects ? (
          <div className="flex items-center justify-center py-12 text-slate-400 space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            <span className="text-sm font-semibold">Loading associated projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">
              No active projects found. You must create a project before creating tasks.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Project Select */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-350">Select Project <span className="text-rose-500">*</span></label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-violet-500 cursor-pointer"
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assign To Multi-Select Project Members */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-350">Assign To <span className="text-rose-500">*</span></label>
              {loadingMembers ? (
                <div className="text-slate-400 text-xs py-2 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                  <span>Loading members...</span>
                </div>
              ) : projectMembers.length === 0 ? (
                <p className="text-rose-400 text-xs py-1">No active members found in this project.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950 border border-slate-850 rounded-xl">
                  {projectMembers.map((member) => {
                    const isSelected = assignedUserIds.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setAssignedUserIds((prev) =>
                            prev.includes(member.id)
                              ? prev.filter((id) => id !== member.id)
                              : [...prev, member.id]
                          );
                        }}
                        className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-violet-600/10 border-violet-500 text-violet-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-750'
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
                          <p className="text-[10px] text-slate-500 truncate">{member.role?.replace('_', ' ')}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Task Title */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-350">Task Title <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="Enter task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-violet-500"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-350">Description</label>
              <textarea
                placeholder="Describe the goals and details of this task..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-violet-500 resize-none"
              />
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-350">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-violet-500 cursor-pointer"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-350">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-violet-500 cursor-pointer"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            {/* Start Date & Due Date Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-350 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-violet-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-350 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-violet-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Estimated Hours Row */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-350 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Estimated Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 8.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-violet-500"
              />
            </div>

            {/* Labels Multi-Select Option */}
            <div className="space-y-2.5">
              <label className="font-semibold text-slate-350 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                Assign Tags / Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LABELS.map((lbl) => {
                  const isSelected = selectedLabels.includes(lbl);
                  return (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => toggleLabel(lbl)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-violet-600 border-violet-500 text-white shadow shadow-violet-600/30'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                      }`}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border border-slate-850 hover:bg-slate-950 text-slate-500 hover:text-slate-100 font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-650 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Create Task</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
