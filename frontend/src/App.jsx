import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Tasks from './pages/Tasks';
import { LogOut, X, ShieldAlert } from 'lucide-react';

function AppContent() {
  const { user, logout, notifications, dismissNotification } = useAuth();
  const location = useLocation();

  // Helper to determine if a route link is active
  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      {/* Simulation Notifications Banner */}
      {notifications.length > 0 && (
        <div className="bg-slate-950 border-b border-violet-900/40 px-6 py-2 space-y-2">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className="max-w-7xl mx-auto flex items-center justify-between p-3 rounded-lg bg-violet-950/40 border border-violet-500/30 text-violet-200 text-sm animate-pulse"
            >
              <div className="flex items-center space-x-2">
                <span className="font-semibold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 text-xs">Simulated Server</span>
                <span>{notif.message}</span>
                {notif.link && (
                  <Link 
                    to={notif.link} 
                    onClick={() => dismissNotification(notif.id)}
                    className="font-bold text-white underline hover:text-fuchsia-300 transition-colors ml-2"
                  >
                    {notif.linkText} &rarr;
                  </Link>
                )}
              </div>
              <button 
                onClick={() => dismissNotification(notif.id)} 
                className="text-violet-400 hover:text-white p-1 rounded hover:bg-violet-900/30 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20">
            TM
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </div>

        {/* Navigation Links - Protected */}
        <div className="flex items-center space-x-6">
          {user && (
            <>
              <Link 
                to="/dashboard" 
                className={`transition-colors duration-200 font-medium ${
                  isActive('/dashboard') ? 'text-violet-400 font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                to="/tasks" 
                className={`transition-colors duration-200 font-medium ${
                  isActive('/tasks') ? 'text-violet-400 font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Tasks
              </Link>
              <Link 
                to="/users" 
                className={`transition-colors duration-200 font-medium ${
                  isActive('/users') ? 'text-violet-400 font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Users
              </Link>
            </>
          )}
        </div>

        {/* User profile details / Auth state control */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4 border-l border-slate-800 pl-4">
              <div className="flex items-center space-x-3">
                {/* Custom Avatar with initials */}
                <div className="h-9 w-9 rounded-full bg-violet-600 flex items-center justify-center font-bold text-sm text-white border border-violet-400/30">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-white leading-tight">{user.name}</div>
                  <div className="text-xs text-slate-400">{user.role}</div>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-red-950/20 hover:text-red-400 border border-slate-800 hover:border-red-900/40 text-slate-400 transition-all duration-200 flex items-center space-x-1.5 text-sm cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium shadow-md shadow-violet-600/10 hover:shadow-violet-600/20 transition-all duration-200"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col justify-start">
        <div className="bg-slate-950/40 rounded-2xl border border-slate-800/60 p-8 shadow-2xl backdrop-blur-sm flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasks" 
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              } 
            />

            {/* Redirect Fallbacks */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800 text-center text-sm text-slate-500">
        <p>© 2026 TaskFlow System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
