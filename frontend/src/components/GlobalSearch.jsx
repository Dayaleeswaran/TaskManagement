import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Folder, CheckSquare, User, Loader2, X } from 'lucide-react';
import api from '../services/api';
import TaskDetailModal from './TaskDetailModal';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], projects: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic
  useEffect(() => {
    if (!query.trim()) {
      Promise.resolve().then(() => {
        setResults({ users: [], projects: [], tasks: [] });
        setLoading(false);
      });
      return;
    }

    Promise.resolve().then(() => {
      setLoading(true);
    });
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await api.get(`/api/v1/search?q=${encodeURIComponent(query)}`);
        setResults(response.data);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const hasResults =
    results.tasks.length > 0 ||
    results.projects.length > 0 ||
    results.users.length > 0;

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setOpen(false);
    setQuery('');
  };

  const handleProjectClick = () => {
    navigate('/projects');
    setOpen(false);
    setQuery('');
  };

  const handleUserClick = () => {
    navigate('/users');
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Global search (tasks, projects...)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-200/80 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-violet-600 transition-all font-medium text-slate-800"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (query.trim() || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-[420px] overflow-y-auto z-50 p-2 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-500 space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
              <span className="text-sm font-medium">Searching records...</span>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-8 text-slate-500 text-sm font-medium">
              No matching records found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Tasks Results */}
              {results.tasks.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckSquare className="h-3 w-3 text-indigo-500" />
                    <span>Tasks</span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {results.tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors flex flex-col cursor-pointer"
                      >
                        <span className="text-sm font-semibold text-slate-800 line-clamp-1">
                          {task.title}
                        </span>
                        {task.project && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Project: {task.project.name}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Results */}
              {results.projects.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Folder className="h-3 w-3 text-sky-500" />
                    <span>Projects</span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {results.projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectClick(project)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors flex flex-col cursor-pointer"
                      >
                        <span className="text-sm font-semibold text-slate-800 line-clamp-1">
                          {project.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium line-clamp-1">
                          {project.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Results */}
              {results.users.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <User className="h-3 w-3 text-purple-500" />
                    <span>Users</span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {results.users.map((u) => (
                      <button
                        key={u.id}
                        onClick={handleUserClick}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors flex items-center space-x-2.5 cursor-pointer"
                      >
                        <div className="h-6 w-6 rounded-full bg-violet-100 flex items-center justify-center font-bold text-[10px] text-violet-700">
                          {u.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800">
                            {u.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {u.email}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Task Details Modal Overlay */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onCommentAdded={() => {}}
          onTaskUpdated={() => {}}
          onTaskDeleted={() => {}}
        />
      )}
    </div>
  );
}
