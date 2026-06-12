import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-slate-800 border-t-violet-500 animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium animate-pulse">Loading secure session...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and keep the current URL they tried to access
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
