import { useAuth } from '../context/AuthContext';
import { User, Shield, Mail, Key, ShieldAlert } from 'lucide-react';

export default function Profile() {
  const { user, token } = useAuth();

  // Standardized role badge colors: ADMIN=purple, PM=blue, COLLABORATOR=gray
  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'from-purple-500/20 to-purple-600/20 text-purple-300 border-purple-500/30';
      case 'PROJECT_MANAGER':
        return 'from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-500/30';
      default:
        return 'from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-600/30';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Review your login credentials, role assignments, and system session info.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-6 relative overflow-hidden">
            {/* Header profile info */}
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center font-bold text-2xl text-violet-400">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">{user?.name || 'Loading User...'}</h2>
                <p className="text-sm text-slate-400 mt-1">{user?.email}</p>
              </div>
            </div>

            {/* Info table list */}
            <div className="border-t border-slate-900 pt-5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center"><User className="h-4 w-4 mr-2 text-slate-500" /> Full Name</span>
                <span className="font-semibold text-white">{user?.name}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center"><Mail className="h-4 w-4 mr-2 text-slate-500" /> Email Address</span>
                <span className="font-semibold text-white">{user?.email}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center"><Shield className="h-4 w-4 mr-2 text-slate-500" /> System Access Role</span>
                <span className={`px-2.5 py-1 rounded bg-gradient-to-r ${getRoleColor(user?.role)} text-xs font-bold border`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Session details */}
          <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center uppercase tracking-wider">
              <Key className="h-4 w-4 mr-2 text-violet-400" /> Token Credentials
            </h3>
            
            <div className="space-y-2">
              <p className="text-xs text-slate-500 leading-relaxed">
                Active JWT Bearer Token stored in <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-300">sessionStorage</code>:
              </p>
              <pre className="p-3 text-[10px] font-mono leading-relaxed bg-slate-900 border border-slate-800 text-slate-400 rounded-lg overflow-x-auto select-all break-all max-h-[80px]">
                {token || 'No token found in current session'}
              </pre>
            </div>
          </div>
        </div>

        {/* Access Rights Box */}
        <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-4 h-fit">
          <h3 className="text-sm font-bold text-slate-300 flex items-center uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4 mr-2 text-fuchsia-400" /> Access Rights
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your account role assigns you the following dashboard and operations privileges:
          </p>
          <ul className="text-xs text-slate-300 space-y-2 pt-2">
            {user?.role === 'ADMIN' && (
              <>
                <li className="flex items-start">✓ Full System Administration</li>
                <li className="flex items-start">✓ Access to Users Dashboard (`/users`)</li>
                <li className="flex items-start">✓ Manage all Tasks (`/tasks`)</li>
                <li className="flex items-start">✓ Soft Delete and User Role updates</li>
              </>
            )}
            {user?.role === 'PROJECT_MANAGER' && (
              <>
                <li className="flex items-start">✓ Project Scope Planning</li>
                <li className="flex items-start">✓ Access to Projects Overview (`/projects`)</li>
                <li className="flex items-start">✓ Create and Assign Tasks (`/tasks`)</li>
                <li className="flex items-start">✓ Track Sprint boards</li>
              </>
            )}
            {user?.role === 'COLLABORATOR' && (
              <>
                <li className="flex items-start">✓ View personal task logs</li>
                <li className="flex items-start">✓ Access to My Tasks Dashboard (`/my-tasks`)</li>
                <li className="flex items-start">✓ Mark task statuses and logs</li>
                <li className="flex items-start">✓ Edit profile details</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
