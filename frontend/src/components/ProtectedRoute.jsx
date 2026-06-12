import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { ShieldAlert, ArrowLeft, Shield } from 'lucide-react';

export default function ProtectedRoute({ children, role }) {
  const { token, user, role: userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner message="Authenticating secure session..." />
      </div>
    );
  }

  // Check token presence
  if (!token) {
    // Redirect to login page and keep the current URL they tried to access
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If a role limit is specified, check access
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    
    if (!allowedRoles.includes(userRole)) {
      // Return a premium 403 view
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 max-w-md w-full shadow-2xl backdrop-blur-md relative overflow-hidden text-center">
            {/* Red accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 via-rose-500 to-red-500"></div>
            
            <div className="mx-auto h-14 w-14 rounded-xl bg-red-950/30 border border-red-500/20 flex items-center justify-center mb-5 text-red-400">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight">Access Forbidden (403)</h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Your account role (<strong className="text-slate-200">{userRole}</strong>) does not have permission to access the requested route:
            </p>
            
            <div className="my-4 p-2 bg-slate-900 border border-slate-850 rounded-lg text-xs font-mono text-slate-400 truncate">
              {location.pathname}
            </div>

            <p className="text-xs text-slate-500 leading-normal">
              Required access: <span className="font-semibold text-rose-300 font-sans">{allowedRoles.join(', ')}</span>
            </p>

            <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-center">
              <Link
                to="/dashboard"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-semibold flex items-center justify-center space-x-2 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
}
