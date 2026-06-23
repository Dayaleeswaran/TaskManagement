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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto kanban-scroll-container">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
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
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/15 transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
