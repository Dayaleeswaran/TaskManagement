import { CheckSquare, Clock, AlertTriangle, Play } from 'lucide-react';

export default function MyTasks() {
  const mockTasks = [
    { id: 1, title: 'Implement protected route checks', status: 'In Progress', priority: 'High', dueDate: 'Today' },
    { id: 2, title: 'Setup Axios base interceptors', status: 'Completed', priority: 'Medium', dueDate: 'Yesterday' },
    { id: 3, title: 'Build responsive MainLayout header', status: 'Not Started', priority: 'High', dueDate: 'Tomorrow' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>;
      case 'In Progress':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">In Progress</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">Not Started</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'High') {
      return <span className="flex items-center text-rose-400 text-xs font-semibold"><AlertTriangle className="h-3.5 w-3.5 mr-1" /> High</span>;
    }
    return <span className="flex items-center text-slate-400 text-xs font-semibold"><Clock className="h-3.5 w-3.5 mr-1" /> Medium</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">My Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">Review and manage your assigned tasks and sprint tickets.</p>
        </div>
        
        <div className="flex items-center space-x-3 text-xs bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
          <span className="px-3 py-1 bg-violet-600 text-white rounded font-medium shadow shadow-violet-600/15 cursor-pointer">All Assigned</span>
          <span className="px-3 py-1 text-slate-400 hover:text-white rounded font-medium cursor-pointer">Pending</span>
        </div>
      </div>

      <div className="grid gap-4">
        {mockTasks.map((task) => (
          <div
            key={task.id}
            className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                  <span className="text-slate-400 text-xs">Due: {task.dueDate}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 self-end md:self-center">
              {getStatusBadge(task.status)}
              {task.status !== 'Completed' && (
                <button className="p-2 rounded-lg bg-slate-900 hover:bg-violet-600/20 text-slate-400 hover:text-violet-300 border border-slate-800 hover:border-violet-500/30 transition-all duration-200 cursor-pointer">
                  <Play className="h-4 w-4 fill-current" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
