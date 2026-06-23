import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  User, 
  TrendingUp, 
  FolderKanban, 
  ClipboardList,
  Users as UsersIcon,
  Activity,
  CheckCircle,
  BarChart2,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const promises = [
          api.get('/api/v1/tasks?limit=100'),
          api.get('/api/v1/projects'),
          api.get('/api/v1/analytics/dashboard')
        ];

        if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
          promises.push(api.get('/api/v1/users?limit=100'));
        }

        const results = await Promise.all(promises);

        const tasksRes = results[0];
        const projectsRes = results[1];
        const analyticsRes = results[2];
        const usersRes = results[3]; // undefined if not ADMIN

        const tasksData = tasksRes.data.tasks || tasksRes.data || [];
        const projectsData = projectsRes.data || [];
        const analyticsData = analyticsRes.data;
        const usersData = usersRes ? (usersRes.data.users || usersRes.data || []) : [];

        setTasks(tasksData);
        setProjects(projectsData);
        setAnalytics(analyticsData);
        setUsers(usersData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Compute common values
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter(t => t.status === 'TODO').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Enforce badge styles
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'PROJECT_MANAGER':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-300';
    }
  };

  // --- COLLABORATOR VIEW ---
  const renderCollaboratorView = () => {
    const collAnalytics = analytics || { myTasks: totalTasks, dueToday: 0, overdue: 0, completedThisMonth: 0 };
    return (
      <div className="space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Assigned Tasks</p>
              <p className="text-3xl font-black text-slate-800">{collAnalytics.myTasks}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <ClipboardList className="h-5 w-5 text-blue-500" />
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Today</p>
              <p className="text-3xl font-black text-slate-800">{collAnalytics.dueToday}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-amber-500">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Tasks</p>
              <p className="text-3xl font-black text-red-600">{collAnalytics.overdue}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed This Month</p>
              <p className="text-3xl font-black text-slate-800">{collAnalytics.completedThisMonth}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-500">
              <CheckSquare className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Visual Charts section */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-violet-600" />
            Task Status & Completion Charts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* SVG Donut Chart */}
            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="relative flex items-center justify-center h-32 w-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600 transition-all duration-1000 ease-out"
                    strokeDasharray={`${completionRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-800">{completionRate}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Done</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 mt-3 text-center">Overall Task Completion Rate</span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="md:col-span-2 space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">My Task Status Distribution</span>
              
              {/* TO DO bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>To Do</span>
                  <span>{todoTasks} tasks</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* IN PROGRESS bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>In Progress</span>
                  <span>{inProgressTasks} tasks</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* COMPLETED bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Completed</span>
                  <span>{completedTasks} tasks</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Grid: Projects & Tasks lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Projects */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-violet-600" />
              My Active Projects ({projects.length})
            </h3>
            {projects.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">No active projects found.</div>
            ) : (
              <div className="space-y-4">
                {projects.map(proj => (
                  <div key={proj.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{proj.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{proj.description || 'No description provided.'}</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task Feed */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-violet-600" />
                My Active Tasks
              </h3>
              <Link to="/my-tasks" className="text-xs font-bold text-violet-600 hover:underline">View tasks board &rarr;</Link>
            </div>
            {tasks.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">No tasks assigned yet.</div>
            ) : (
              <div className="space-y-3.5">
                {tasks.slice(0, 4).map(task => (
                  <div key={task.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-800 truncate">{task.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                      task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-55 text-blue-700 border-blue-100' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- PROJECT MANAGER VIEW ---
  const renderPMView = () => {
    const pmAnalytics = analytics || { activeProjects: projects.length, teamMembers: 0, tasksCompleted: 0, overdueTasks: 0 };
    
    // Compile PM collaborator task list
    const teamAssignments = [];
    tasks.forEach(task => {
      task.assignments?.forEach(assign => {
        const u = assign.user || assign;
        if (u && u.id && u.name) {
          teamAssignments.push({
            id: `${task.id}-${u.id}`,
            collaboratorName: u.name,
            taskTitle: task.title,
            status: task.status,
            priority: task.priority
          });
        }
      });
    });

    return (
      <div className="space-y-8">
        {/* PM stats summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Active Projects</p>
              <p className="text-3xl font-black text-slate-800">{pmAnalytics.activeProjects}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-slate-55 border border-slate-100 flex items-center justify-center text-slate-400">
              <FolderKanban className="h-5 w-5 text-blue-500" />
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Team Members</p>
              <p className="text-3xl font-black text-slate-800">{pmAnalytics.teamMembers}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-violet-400">
              <UsersIcon className="h-5 w-5 text-violet-600" />
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasks Completed</p>
              <p className="text-3xl font-black text-slate-800">{pmAnalytics.tasksCompleted}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-400">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Tasks</p>
              <p className="text-3xl font-black text-red-600">{pmAnalytics.overdueTasks}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>

        {/* Visual Charts section */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-violet-600" />
            Control Scope Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">Completion Rate Progress</span>
              <div className="w-full bg-slate-200 h-6 rounded-full overflow-hidden relative flex items-center justify-center">
                <div
                  className="bg-blue-600 h-full absolute left-0 top-0 transition-all duration-1000"
                  style={{ width: `${completionRate}%` }}
                ></div>
                <span className="z-10 text-xs font-extrabold text-white text-shadow-sm">{completionRate}% Done ({completedTasks}/{totalTasks} tasks)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Team Workload Distribution</span>
              <div className="flex gap-4 items-center">
                <div className="flex items-center space-x-1.5">
                  <div className="h-3 w-3 bg-amber-400 rounded-full" />
                  <span className="text-[11px] font-semibold text-slate-500">{todoTasks} To Do</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="h-3 w-3 bg-blue-600 rounded-full" />
                  <span className="text-[11px] font-semibold text-slate-500">{inProgressTasks} In Progress</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="h-3 w-3 bg-emerald-500 rounded-full" />
                  <span className="text-[11px] font-semibold text-slate-500">{completedTasks} Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PM content view */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects lists */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-violet-600" />
                My Projects
              </h3>
              <Link to="/projects" className="text-xs font-bold text-violet-600 hover:underline">Manage &rarr;</Link>
            </div>
            {projects.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">No projects created yet.</div>
            ) : (
              <div className="space-y-3.5">
                {projects.map(proj => (
                  <div key={proj.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <h4 className="font-bold text-sm text-slate-800">{proj.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{proj.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Task Collaborators Breakdown */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-violet-600" />
              Collaborator Assigned Task Workloads
            </h3>
            {teamAssignments.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">No tasks assigned to collaborators yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-500">
                      <th className="pb-3">Collaborator</th>
                      <th className="pb-3">Task Title</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamAssignments.map((assign) => (
                      <tr key={assign.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-bold text-slate-700">{assign.collaboratorName}</td>
                        <td className="py-3 max-w-[200px] truncate text-slate-500">{assign.taskTitle}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            assign.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            assign.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {assign.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            assign.priority === 'HIGH' ? 'text-rose-600 bg-rose-50' :
                            assign.priority === 'MEDIUM' ? 'text-amber-600 bg-amber-50' :
                            'text-slate-500 bg-slate-50'
                          }`}>
                            {assign.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- ADMINISTRATOR VIEW ---
  const renderAdminView = () => {
    const managersList = users.filter(u => u.role === 'PROJECT_MANAGER');
    const collaboratorsList = users.filter(u => u.role === 'COLLABORATOR');
    const adminAnalytics = analytics || { totalUsers: users.length, activeUsers: users.filter(u => u.isActive).length, projects: projects.length, tasks: totalTasks, completionRate: completionRate, overdueTasks: 0 };

    return (
      <div className="space-y-8">
        {/* Global Admin Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Projects</p>
              <p className="text-3xl font-black text-slate-800">{adminAnalytics.projects}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-slate-55 border border-slate-100 flex items-center justify-center text-slate-400">
              <FolderKanban className="h-5 w-5 text-blue-500" />
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Tasks</p>
              <p className="text-3xl font-black text-slate-800">{adminAnalytics.tasks}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-violet-400">
              <ClipboardList className="h-5 w-5 text-violet-600" />
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Tasks</p>
              <p className="text-3xl font-black text-red-650">{adminAnalytics.overdueTasks || 0}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Managers</p>
              <p className="text-3xl font-black text-slate-800">{managersList.length}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-500">
              <UsersIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collaborators</p>
              <p className="text-3xl font-black text-slate-800">{collaboratorsList.length}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-400">
              <User className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Visual Charts section */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-violet-600" />
            Global System Compliance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">Overall System Task Completion Rate</span>
              <div className="w-full bg-slate-200 h-6 rounded-full overflow-hidden relative flex items-center justify-center">
                <div
                  className="bg-emerald-500 h-full absolute left-0 top-0 transition-all duration-1000"
                  style={{ width: `${adminAnalytics.completionRate}%` }}
                ></div>
                <span className="z-10 text-xs font-extrabold text-white">{adminAnalytics.completionRate}% (Completed / Total)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">User Directory Activation Ratio</span>
              <div className="w-full bg-slate-200 h-6 rounded-full overflow-hidden relative flex items-center justify-center">
                <div
                  className="bg-indigo-600 h-full absolute left-0 top-0 transition-all"
                  style={{ width: `${adminAnalytics.totalUsers > 0 ? (adminAnalytics.activeUsers / adminAnalytics.totalUsers) * 100 : 0}%` }}
                ></div>
                <span className="z-10 text-xs font-extrabold text-white">
                  {adminAnalytics.activeUsers} Active of {adminAnalytics.totalUsers} registered users
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Structured Manager and User details view */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Project Managers Table */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-blue-500" />
                Project Managers
              </h3>
              <Link to="/users" className="text-xs font-bold text-violet-600 hover:underline">User management &rarr;</Link>
            </div>
            {managersList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">No project managers registered.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-slate-650">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-500">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-550">
                    {managersList.map(mgr => (
                      <tr key={mgr.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-bold text-slate-850">{mgr.name}</td>
                        <td className="py-3 font-mono text-slate-500">{mgr.email}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            mgr.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {mgr.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Collaborators Table */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-500" />
                Collaborators
              </h3>
              <Link to="/users" className="text-xs font-bold text-violet-600 hover:underline">User management &rarr;</Link>
            </div>
            {collaboratorsList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">No collaborators registered.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-slate-650">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-500">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-550">
                    {collaboratorsList.map(col => (
                      <tr key={col.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-bold text-slate-850">{col.name}</td>
                        <td className="py-3 font-mono text-slate-500">{col.email}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            col.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {col.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header welcome banner */}
      <div className="bg-gradient-to-r from-slate-900/60 to-purple-950/20 border border-slate-800/80 rounded-3xl p-8 relative overflow-hidden backdrop-blur-md">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-fuchsia-600/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getRoleBadgeStyle(user?.role)}`}>
            {user?.role?.replace('_', ' ')} Panel
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mt-2">
            Welcome back, <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{user?.name || 'User'}</span>!
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Central monitoring panel for task statistics, project progress, and active workloads.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
          <Activity className="h-8 w-8 text-violet-500 animate-pulse" />
          <p className="text-sm text-slate-500 font-medium">Loading secure panel details...</p>
        </div>
      ) : (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? (
        renderAdminView()
      ) : user?.role === 'PROJECT_MANAGER' ? (
        renderPMView()
      ) : (
        renderCollaboratorView()
      )}
    </div>
  );
}
