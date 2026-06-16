import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FolderKanban,
  ClipboardList,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Define navigation items configuration
  const navigationConfig = {
    ADMIN: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Users', path: '/users', icon: Users },
      { name: 'Tasks', path: '/tasks', icon: CheckSquare },
      { name: 'Notifications', path: '/notifications', icon: Bell },
    ],
    PROJECT_MANAGER: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Projects', path: '/projects', icon: FolderKanban },
      { name: 'Tasks', path: '/tasks', icon: CheckSquare },
      { name: 'Notifications', path: '/notifications', icon: Bell },
    ],
    COLLABORATOR: [
      { name: 'My Tasks', path: '/my-tasks', icon: ClipboardList },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Profile', path: '/profile', icon: User },
    ],
  };

  const menuItems = navigationConfig[user?.role] || [];

  // Standardized role badge colors: ADMIN=purple, PM=blue, COLLABORATOR=gray
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'PROJECT_MANAGER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-600/30';
    }
  };

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

  // Clean up body class on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, []);

  const renderNavLinks = (onClickCallback) => (
    <div className="space-y-1.5 px-3 py-4">
      {menuItems.map((item) => {
        const IconComponent = item.icon;
        const active = isActive(item.path);
        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={onClickCallback}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group text-sm cursor-pointer ${
              active
                ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/10 border-l-4 border-violet-500 text-white shadow shadow-violet-600/5'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <IconComponent
              className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'
              }`}
            />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={openSidebar}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20">
              TF
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </div>
        </div>

        {/* User profile details & Logout */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <NotificationPanel />
          <div className="flex items-center space-x-3 border-r border-slate-900 pr-3 sm:pr-4">
            {/* User Avatar with Initials */}
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-xs text-white shadow shadow-violet-500/10">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">{user?.name}</div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getRoleBadgeStyle(user?.role)}`}>
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 sm:py-2 sm:px-3.5 rounded-xl bg-slate-900 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-800/80 hover:border-rose-900/40 text-slate-400 transition-all duration-200 flex items-center space-x-1.5 text-xs font-semibold cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Fixed) */}
        <aside className="hidden md:block w-64 bg-slate-950 border-r border-slate-900 flex-shrink-0">
          <div className="h-full flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto">
              {renderNavLinks()}
            </div>
            <div className="p-4 border-t border-slate-900 text-[10px] text-slate-600 flex items-center justify-between">
              <span>Secure Shell v1.0</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/60" />
            </div>
          </div>
        </aside>

        {/* Mobile Slide-out Drawer Sidebar (Overlay with animation) */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className={`fixed inset-0 bg-black/60 backdrop-blur-sm ${isClosing ? 'sidebar-backdrop-exit' : 'sidebar-backdrop-enter'}`}
              onClick={closeSidebar}
            ></div>

            {/* Sidebar drawer content with slide animation */}
            <div className={`relative flex flex-col w-64 max-w-xs bg-slate-950 border-r border-slate-900 h-full shadow-2xl z-10 ${isClosing ? 'sidebar-drawer-exit' : 'sidebar-drawer-enter'}`}>
              <div className="p-4 flex items-center justify-between border-b border-slate-900">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-white shadow shadow-violet-500/20 text-sm">
                    TF
                  </div>
                  <span className="text-sm font-bold text-white">Menu Navigation</span>
                </div>
                <button
                  onClick={closeSidebar}
                  className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {renderNavLinks(closeSidebar)}
              </div>

              <div className="p-4 border-t border-slate-900 text-[10px] text-slate-600 flex items-center justify-between">
                <span>Secure Mobile Shell</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/60" />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
