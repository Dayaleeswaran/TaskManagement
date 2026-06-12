import { FolderKanban, Plus, ExternalLink, Users as UsersIcon } from 'lucide-react';

export default function Projects() {
  const mockProjects = [
    { id: 1, name: 'Task Management System SPA', progress: 68, teamSize: 5, status: 'Active' },
    { id: 2, name: 'Real-time Websocket Sync Server', progress: 90, teamSize: 3, status: 'In Review' },
    { id: 3, name: 'Client Marketing Portal API', progress: 15, teamSize: 8, status: 'Planning' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">Active</span>;
      case 'In Review':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">In Review</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">Planning</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">Manage project portfolios, status tracking, and resource allocation.</p>
        </div>
        
        <button className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/15 transition-all duration-200 flex items-center space-x-2 text-sm cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProjects.map((project) => (
          <div
            key={project.id}
            className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between h-[190px] relative group"
          >
            {/* Top section */}
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <FolderKanban className="h-5 w-5" />
              </div>
              {getStatusBadge(project.status)}
            </div>

            {/* Title / Info */}
            <div className="mt-4">
              <h3 className="text-base font-bold text-white leading-tight flex items-center">
                <span>{project.name}</span>
                <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-opacity" />
              </h3>
              
              {/* Progress bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-violet-400">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                  <div
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 h-full rounded-full"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Footer metrics */}
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-900 pt-3">
              <span className="flex items-center">
                <UsersIcon className="h-3.5 w-3.5 mr-1" /> {project.teamSize} Members
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
