import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import GlobalSearch from './GlobalSearch';
import api from '../services/api';
import WorkNestLogo from './WorkNestLogo';
import {
  Home,
  Bell,
  CheckCircle,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Plus,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Users,
  ClipboardList as AuditIcon,
  User
} from 'lucide-react';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [projects, setProjects] = useState([]);
  const [workExpanded, setWorkExpanded] = useState(true);

  const isActive = (path) => location.pathname === path;

  const getAvatarClass = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'avatar-initials-amber';
      case 'ADMIN': return 'avatar-initials-purple';
      case 'PROJECT_MANAGER': return 'avatar-initials-blue';
      default: return 'avatar-initials-violet';
    }
  };

  // Fetch active projects for sidebar safely inside useEffect
  useEffect(() => {
    let active = true;
    if (user) {
      api.get('/api/v1/projects')
        .then(response => {
          if (active) {
            setProjects(response.data || []);
          }
        })
        .catch(err => {
          console.error('Failed to fetch sidebar projects:', err);
        });
    }
    return () => {
      active = false;
    };
  }, [user]);

  // Open mobile sidebar
  const openSidebar = useCallback(() => {
    setMobileSidebarOpen(true);
    setIsClosing(false);
    document.body.classList.add('sidebar-open');
  }, []);

  // Close mobile sidebar with exit animation
  const closeSidebar = useCallback(() => {
    setIsClosing(true);
    document.body.classList.remove('sidebar-open');
    setTimeout(() => {
      setMobileSidebarOpen(false);
      setIsClosing(false);
    }, 250);
  }, []);

  useEffect(() => {
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, []);

  const handleNewProjectClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/projects', { state: { openCreateModal: true } });
  };

  const projectIcons = [
    { icon: ClipboardList, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { icon: ClipboardList, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { icon: ClipboardList, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { icon: ClipboardList, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
  ];

  const renderSidebarContent = (onClickCallback) => {
    return (
      <div className="h-full flex flex-col justify-between bg-slate-900 border-r border-slate-850 w-64 select-none">
        <div className="flex-1 overflow-y-auto">
          {/* Logo / Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-850">
            <Link to="/dashboard" onClick={onClickCallback} className="flex items-center">
              <WorkNestLogo size={36} showText={true} lightText={true} />
            </Link>
            {mobileSidebarOpen && (
              <button
                onClick={closeSidebar}
                className="p-1 rounded-lg hover:bg-slate-950 text-slate-500 hover:text-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Section 1: Main Dashboard Links */}
          <div className="px-3 pt-4 pb-2 space-y-1">
            <Link
              to="/dashboard"
              onClick={onClickCallback}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive('/dashboard') ? 'bg-slate-905 text-white font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-slate-905/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Home className={`h-4.5 w-4.5 ${isActive('/dashboard') ? 'text-white' : 'text-slate-700'}`} />
                <span>Home</span>
              </div>
            </Link>

            <Link
              to="/notifications"
              onClick={onClickCallback}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive('/notifications') ? 'bg-slate-905 text-white font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-slate-905/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Bell className={`h-4.5 w-4.5 ${isActive('/notifications') ? 'text-white' : 'text-slate-700'}`} />
                <span>Inbox</span>
              </div>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-600/15 text-blue-400 border border-blue-500/20">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>

          <div className="px-4 py-1">
            <div className="border-t border-slate-850"></div>
          </div>

          {/* Section 2: Task and Projects Management */}
          <div className="px-3 py-2 space-y-1">
            {user?.role === 'COLLABORATOR' ? (
              <Link
                to="/my-tasks"
                onClick={onClickCallback}
                className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive('/my-tasks') ? 'bg-slate-905 text-white font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-slate-905/40'
                }`}
              >
                <CheckCircle className={`h-4.5 w-4.5 ${isActive('/my-tasks') ? 'text-white' : 'text-slate-700'}`} />
                <span>My tasks</span>
              </Link>
            ) : (
              <Link
                to="/tasks"
                onClick={onClickCallback}
                className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive('/tasks') ? 'bg-slate-905 text-white font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-slate-905/40'
                }`}
              >
                <CheckCircle className={`h-4.5 w-4.5 ${isActive('/tasks') ? 'text-white' : 'text-slate-700'}`} />
                <span>Tasks</span>
              </Link>
            )}

            <Link
              to="/projects"
              onClick={onClickCallback}
              className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive('/projects') ? 'bg-slate-905 text-white font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-slate-905/40'
              }`}
            >
              <ClipboardList className={`h-4.5 w-4.5 ${isActive('/projects') ? 'text-white' : 'text-slate-700'}`} />
              <span>{user?.role === 'COLLABORATOR' ? 'My Projects' : 'Projects'}</span>
            </Link>
          </div>

          {/* Section 3: Admin Actions & Settings */}
          <>
            <div className="px-4 py-1">
              <div className="border-t border-slate-850"></div>
            </div>
            <div className="px-3 py-2 space-y-1">
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'PROJECT_MANAGER') && (
                <Link
                  to="/users"
                  onClick={onClickCallback}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive('/users') ? 'bg-slate-905 text-white font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-slate-905/40'
                  }`}
                >
                  <Users className={`h-4.5 w-4.5 ${isActive('/users') ? 'text-white' : 'text-slate-700'}`} />
                  <span>Users Directory</span>
                </Link>
              )}

              {user?.role === 'SUPER_ADMIN' && (
                <Link
                  to="/audit-logs"
                  onClick={onClickCallback}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive('/audit-logs') ? 'bg-slate-905 text-white font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-slate-905/40'
                  }`}
                >
                  <AuditIcon className={`h-4.5 w-4.5 ${isActive('/audit-logs') ? 'text-white' : 'text-slate-700'}`} />
                  <span>Audit Logs</span>
                </Link>
              )}

              <Link
                to="/profile"
                onClick={onClickCallback}
                className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive('/profile') ? 'bg-slate-905 text-white font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-slate-905/40'
                }`}
              >
                <User className={`h-4.5 w-4.5 ${isActive('/profile') ? 'text-white' : 'text-slate-700'}`} />
                <span>Profile Settings</span>
              </Link>
            </div>
          </>

          <div className="px-4 py-1">
            <div className="border-t border-slate-850"></div>
          </div>

          {/* Section 4: Collapsible Work Section */}
          <div className="px-3 py-2">
            <div 
              className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer group"
              onClick={() => setWorkExpanded(!workExpanded)}
            >
              <div className="flex items-center space-x-1.5">
                {workExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <span>Work</span>
              </div>
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'PROJECT_MANAGER') && (
                <button
                  onClick={handleNewProjectClick}
                  className="p-0.5 rounded hover:bg-slate-905/60 text-slate-500 hover:text-white cursor-pointer"
                  title="Create Project"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {workExpanded && (
              <div className="mt-1 space-y-0.5">
                {projects.length === 0 ? (
                  <div className="px-6 py-2 text-xs text-slate-550 italic">No projects found</div>
                ) : (
                  projects.map((proj, idx) => {
                    const iconStyle = projectIcons[idx % projectIcons.length];
                    const ProjectIcon = iconStyle.icon;
                    return (
                      <Link
                        key={proj.id}
                        to="/projects"
                        state={{ selectProjectId: proj.id }}
                        onClick={onClickCallback}
                        className="flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-100 hover:bg-slate-905/40 transition-all duration-150"
                      >
                        <div className={`h-5 w-5 rounded-md flex items-center justify-center border shrink-0 ${iconStyle.color}`}>
                          <ProjectIcon className="h-3 w-3" />
                        </div>
                        <span className="truncate">{proj.name}</span>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Search, User profile card and Sign out */}
        <div className="p-4 border-t border-slate-850 space-y-4">
          <div className="px-1">
            <GlobalSearch />
          </div>

          <div className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className={`h-8.5 w-8.5 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${getAvatarClass(user?.role)}`}>
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-rose-50/10 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <div className="text-[9px] text-slate-700 flex items-center justify-between px-1">
            <span>Secure Portals v1.0</span>
            <ShieldCheck className="h-3 w-3 text-emerald-500/40" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Mobile Top Header (Visible only on mobile screen widths) */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-850 px-4 py-3 flex md:hidden items-center justify-between">
        <button
          onClick={openSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-100 hover:bg-slate-950 transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/dashboard" className="flex items-center">
          <WorkNestLogo size={32} showText={true} lightText={true} />
        </Link>
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-100 hover:bg-slate-950 transition-colors cursor-pointer flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white ring-2 ring-slate-900 shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Fixed) */}
        <aside className="hidden md:block w-64 bg-slate-900 border-r border-slate-850 flex-shrink-0">
          {renderSidebarContent()}
        </aside>

        {/* Mobile Slide-out Drawer Sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className={`fixed inset-0 bg-black/60 backdrop-blur-sm ${isClosing ? 'sidebar-backdrop-exit' : 'sidebar-backdrop-enter'}`}
              onClick={closeSidebar}
            ></div>
            <div className={`relative flex flex-col w-64 bg-slate-900 border-r border-slate-850 h-full shadow-2xl z-10 ${isClosing ? 'sidebar-drawer-exit' : 'sidebar-drawer-enter'}`}>
              {renderSidebarContent(closeSidebar)}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
