import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Tasks from './pages/Tasks';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
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

          <div className="flex items-center space-x-6">
            <Link 
              to="/dashboard" 
              className="text-slate-300 hover:text-white transition-colors duration-200 font-medium"
            >
              Dashboard
            </Link>
            <Link 
              to="/tasks" 
              className="text-slate-300 hover:text-white transition-colors duration-200 font-medium"
            >
              Tasks
            </Link>
            <Link 
              to="/users" 
              className="text-slate-300 hover:text-white transition-colors duration-200 font-medium"
            >
              Users
            </Link>
            <Link 
              to="/login" 
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium shadow-md shadow-violet-600/10 hover:shadow-violet-600/20 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          <div className="bg-slate-950/40 rounded-2xl border border-slate-800/60 p-8 shadow-2xl backdrop-blur-sm">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 border-t border-slate-800 text-center text-sm text-slate-500">
          <p>© 2026 TaskFlow System. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}
