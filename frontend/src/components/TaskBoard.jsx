import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Search, Filter, RefreshCw, Plus } from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CreateTaskModal from './CreateTaskModal';
import TaskCard from './TaskCard';
import TaskDetailModal from './TaskDetailModal';
import SkeletonCard from './SkeletonCard';
import useTaskFilters from '../hooks/useTaskFilters';
import { useToast } from '../context/ToastContext';

// Kanban Board columns config mapping to Prisma db Status enum
const COLUMNS = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'COMPLETED', title: 'Completed' }
];

/**
 * Droppable Column wrapper for DnD Kit
 */
function BoardColumn({ id, title, children, count }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className="flex flex-col bg-slate-950/30 border border-slate-900 rounded-2xl p-4 min-h-[600px] min-w-[300px] flex-1 transition-all duration-200"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-900">
        <div className="flex items-center space-x-2.5">
          <div className={`h-2.5 w-2.5 rounded-full border ${id === 'TODO' ? 'bg-slate-400 border-slate-350' : id === 'IN_PROGRESS' ? 'bg-indigo-500 border-indigo-400' : 'bg-emerald-500 border-emerald-400'}`} />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-slate-900/60 border border-slate-800 text-slate-400 text-[11px] font-bold">
          {count}
        </span>
      </div>

      {/* Droppable Area */}
      <div className="flex-1 flex flex-col gap-3 min-h-[500px]">
        {children}
      </div>
    </div>
  );
}

/**
 * Skeleton loading state for the Kanban board
 */
function BoardSkeleton() {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4 kanban-scroll-container snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-x-visible">
      {COLUMNS.map((column) => (
        <div
          key={column.id}
          className="flex flex-col bg-slate-950/30 border border-slate-900 rounded-2xl p-4 min-h-[600px] min-w-[300px] flex-1 snap-start"
        >
          {/* Column Header skeleton */}
          <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-900">
            <div className="flex items-center space-x-2.5">
              <div className="h-2.5 w-2.5 rounded-full skeleton-shimmer bg-slate-800/60" />
              <div className="h-4 w-20 rounded skeleton-shimmer bg-slate-800/60" />
            </div>
            <div className="h-5 w-6 rounded-md skeleton-shimmer bg-slate-800/60" />
          </div>

          {/* Skeleton cards */}
          <div className="flex-1 flex flex-col gap-3.5">
            <SkeletonCard />
            <SkeletonCard />
            {column.id !== 'COMPLETED' && <SkeletonCard />}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Main TaskBoard Kanban Component
 */
export default function TaskBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { addToast } = useToast();

  // Configure sensors for Drag and Drop
  // Use PointerSensor with activation constraint to prevent blocking normal click events
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Drag triggers only after 8px movement
      },
    })
  );

  // Initialize filtering hook
  const { filters, filteredTasks, updateFilter, resetFilters } = useTaskFilters(tasks);

  // Fetch tasks on mount
  const fetchTasks = async () => {
    try {
      // Pass pagination limit=100 to query most active board items
      const response = await api.get('/api/v1/tasks?limit=100');
      // API payload shape is { tasks, total, page, ... }
      setTasks(response.data.tasks || response.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      // Fallback Mock tasks for offline simulation
      setTasks([
        {
          id: 'task-1',
          title: 'Implement drag-and-drop board structure',
          description: 'Setup DndContext and SortableContext mapping columns.',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date().toISOString(),
          project: { name: 'Sprint 2 Release' },
          createdBy: { name: 'Admin User' },
          assignments: [{ userId: 'user-1', name: 'Collaborator User' }],
          comments: []
        },
        {
          id: 'task-2',
          title: 'Establish global socket hook for system notifications',
          description: 'Listen to realtime events on socket namespace.',
          status: 'TODO',
          priority: 'MEDIUM',
          dueDate: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date().toISOString(),
          project: { name: 'Core Architecture' },
          createdBy: { name: 'Project Manager' },
          assignments: [{ userId: 'user-2', name: 'Admin User' }],
          comments: []
        },
        {
          id: 'task-3',
          title: 'Axios base interceptor configurations completed',
          description: 'Authenticate with authorization tokens stored in storage.',
          status: 'COMPLETED',
          priority: 'LOW',
          dueDate: new Date(Date.now() - 172800000).toISOString(),
          createdAt: new Date().toISOString(),
          project: { name: 'Sprint 1 Tasks' },
          createdBy: { name: 'Collaborator User' },
          assignments: [],
          comments: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Avoid synchronous setState in effect
    Promise.resolve().then(() => {
      fetchTasks();
    });
  }, []);

  // Extract unique assignees dynamically from the loaded tasks list
  const uniqueAssignees = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      task.assignments?.forEach((assign) => {
        const u = assign.user || assign;
        if (u?.id && u?.name) {
          map.set(u.id, u.name);
        }
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  // Extract unique labels dynamically from loaded tasks list
  const uniqueLabels = useMemo(() => {
    const set = new Set();
    tasks.forEach((task) => {
      task.labels?.forEach((lbl) => {
        if (lbl.name) {
          set.add(lbl.name);
        }
      });
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Handle Drag End event with reordering persistence
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    let targetStatus = activeTask.status;
    let overTask = null;

    if (COLUMNS.some((col) => col.id === overId)) {
      targetStatus = overId;
    } else {
      overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    // Save previous state for rollback
    const previousTasks = [...tasks];

    // Find the tasks currently in the target column (excluding the active one if it was already there)
    const targetTasks = tasks
      .filter((t) => t.status === targetStatus && t.id !== activeId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    let updatedTargetTasks = [];
    if (overTask) {
      const overIndex = targetTasks.findIndex((t) => t.id === overId);
      updatedTargetTasks = [...targetTasks];
      updatedTargetTasks.splice(overIndex, 0, { ...activeTask, status: targetStatus });
    } else {
      updatedTargetTasks = [...targetTasks, { ...activeTask, status: targetStatus }];
    }

    // Re-index target positions
    const reindexedTargetTasks = updatedTargetTasks.map((t, idx) => ({
      ...t,
      position: idx,
    }));

    // If source column is different, update its positions too
    let reindexedSourceTasks = [];
    if (activeTask.status !== targetStatus) {
      const sourceTasks = tasks
        .filter((t) => t.status === activeTask.status && t.id !== activeId)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      reindexedSourceTasks = sourceTasks.map((t, idx) => ({
        ...t,
        position: idx,
      }));
    }

    // Combine into new state
    const newTasks = tasks.map((t) => {
      const targetMatch = reindexedTargetTasks.find((item) => item.id === t.id);
      if (targetMatch) return targetMatch;

      const sourceMatch = reindexedSourceTasks.find((item) => item.id === t.id);
      if (sourceMatch) return sourceMatch;

      if (t.id === activeId) {
        return {
          ...t,
          status: targetStatus,
          position: reindexedTargetTasks.findIndex((item) => item.id === activeId),
        };
      }
      return t;
    });

    setTasks(newTasks);

    try {
      const targetIds = reindexedTargetTasks.map((t) => t.id);
      await api.put('/api/v1/tasks/reorder', {
        projectId: activeTask.projectId,
        status: targetStatus,
        taskIds: targetIds,
      });

      if (activeTask.status !== targetStatus) {
        const sourceIds = reindexedSourceTasks.map((t) => t.id);
        await api.put('/api/v1/tasks/reorder', {
          projectId: activeTask.projectId,
          status: activeTask.status,
          taskIds: sourceIds,
        });
      }

      addToast(`Task moved successfully`, 'success');
    } catch (err) {
      console.error('Reordering failed:', err);
      setTasks(previousTasks);
      addToast('Failed to save task reordering', 'error');
    }
  };

  // Callback to increment comment count locally when comment is added in detail modal
  const handleCommentAddedLocally = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          const currentCount = task.commentsCount || task.comments?.length || 0;
          return {
            ...task,
            commentsCount: currentCount + 1,
          };
        }
        return task;
      })
    );
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setSelectedTask(null);
  };

  const handleTaskDeleted = (deletedTaskId) => {
    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== deletedTaskId));
    setSelectedTask(null);
  };

  // Group tasks by status for columns
  const getTasksByStatus = (status) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  // Manual board refresh
  const handleRefreshBoard = () => {
    setIsLoading(true);
    fetchTasks();
  };

  return (
    <div className="space-y-6">
      {/* Board Filtering Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
        <div className="flex items-center space-x-3.5 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks by title..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800/80 focus:border-violet-500 focus:outline-none rounded-xl text-sm placeholder-slate-500 text-slate-200 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Priority filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={filters.priority}
              onChange={(e) => updateFilter('priority', e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Label filter */}
          <select
            value={filters.label}
            onChange={(e) => updateFilter('label', e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
          >
            <option value="">All Labels</option>
            {uniqueLabels.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* Assignee filter */}
          <select
            value={filters.assignedTo}
            onChange={(e) => updateFilter('assignedTo', e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
          >
            <option value="">All Assignees</option>
            {uniqueAssignees.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {(filters.search || filters.priority || filters.assignedTo || filters.label) && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 border border-slate-800 rounded-xl text-xs text-violet-400 hover:text-white hover:bg-slate-950 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}

          {/* Create Task Button */}
          {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-3 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-violet-600/15 transition-all duration-200 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Task</span>
            </button>
          )}

          {/* Refresh Board */}
          <button
            onClick={handleRefreshBoard}
            disabled={isLoading}
            className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh board"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Kanban Drag-and-Drop Columns Area */}
      {isLoading ? (
        <BoardSkeleton />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4 kanban-scroll-container snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-x-visible">
            {COLUMNS.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              return (
                <BoardColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  count={columnTasks.length}
                >
                  <SortableContext
                    items={columnTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-3.5">
                      {columnTasks.map((task) => (
                        <TaskCard
                           key={task.id}
                           task={task}
                           onClick={() => setSelectedTask(task)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  {columnTasks.length === 0 && (
                    <div className="flex-1 border border-dashed border-slate-800/40 rounded-2xl flex flex-col items-center justify-center p-6 text-center select-none py-14">
                      <p className="text-xs text-slate-500 font-medium">Drop tasks here</p>
                    </div>
                  )}
                </BoardColumn>
              );
            })}
          </div>
        </DndContext>
      )}

      {/* Task Details Modal overlay */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onCommentAdded={handleCommentAddedLocally}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}

      {/* Create Task Modal overlay */}
      {isCreateOpen && (
        <CreateTaskModal
          onClose={() => setIsCreateOpen(false)}
          onTaskCreated={fetchTasks}
        />
      )}
    </div>
  );
}
