import TaskBoard from '../components/TaskBoard';

/**
 * Tasks Page: Main route wrapper for rendering the Kanban Task Board
 */
export default function Tasks() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Project Tasks Board
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Drag and drop cards to update statuses, search titles, and manage sprints in real-time.
        </p>
      </div>

      {/* Main Kanban Board component */}
      <TaskBoard />
    </div>
  );
}
