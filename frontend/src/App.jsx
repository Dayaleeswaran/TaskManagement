import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import ToastContainer from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';


// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Users from './pages/Users';
import Tasks from './pages/Tasks';
import MyTasks from './pages/MyTasks';
import Projects from './pages/Projects';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';
import AuditLogs from './pages/AuditLogs';

import { X } from 'lucide-react';

// Redirect helper component for `/dashboard` or root entry points
function DashboardRedirect() {
  const { role } = useAuth();

  if (role === 'ADMIN') {
    return <Navigate to="/users" replace />;
  } else if (role === 'PROJECT_MANAGER') {
    return <Navigate to="/tasks" replace />;
  } else if (role === 'COLLABORATOR') {
    return <Navigate to="/my-tasks" replace />;
  } else {
    return <Navigate to="/profile" replace />;
  }
}

function AppContent() {
  const { notifications, dismissNotification } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Simulation Notifications Banner for Offline Mock testing */}
      {notifications.length > 0 && (
        <div className="bg-slate-950 border-b border-violet-900/40 px-6 py-2 space-y-2 z-50">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="max-w-7xl mx-auto flex items-center justify-between p-3 rounded-lg bg-violet-950/40 border border-violet-500/30 text-violet-200 text-sm"
            >
              <div className="flex items-center space-x-2">
                <span className="font-semibold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 text-xs">System Alert</span>
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

      {/* Routes Map */}
      <div className="flex-1 flex flex-col">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
                <Login />
              </div>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
                <ForgotPassword />
              </div>
            }
          />
          <Route
            path="/reset-password"
            element={
              <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
                <ResetPassword />
              </div>
            }
          />

          {/* Protected Shell Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard path renders the main stats dashboard view */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/change-password" element={<ChangePassword />} />
            
            {/* Access control pages */}
            <Route
              path="/users"
              element={
                <ProtectedRoute role="ADMIN">
                  <Users />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute role="ADMIN">
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tasks"
              element={
                <ProtectedRoute role={['ADMIN', 'PROJECT_MANAGER']}>
                  <Tasks />
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <ProtectedRoute role={['ADMIN', 'PROJECT_MANAGER']}>
                  <Projects />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-tasks"
              element={
                <ProtectedRoute role="COLLABORATOR">
                  <MyTasks />
                </ProtectedRoute>
              }
            />

            {/* General authenticated user screens */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <ToastContainer />
              <AppContent />
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
