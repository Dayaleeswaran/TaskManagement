import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit3,
  UserCheck,
  UserX,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
} from 'lucide-react';

export default function Users() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState(initialSearch);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('COLLABORATOR');
  const [editRole, setEditRole] = useState('COLLABORATOR');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      let query = `/api/v1/users?page=${page}&limit=${limit}`;
      if (appliedSearch.trim()) {
        query += `&search=${encodeURIComponent(appliedSearch.trim())}`;
      }
      if (roleFilter) {
        query += `&role=${roleFilter}`;
      }
      if (isActiveFilter) {
        query += `&isActive=${isActiveFilter}`;
      }

      const response = await api.get(query);
      setUsers(response.data.users || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotal(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load users:', err);
      addToast('Failed to retrieve users list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedSearch, roleFilter, isActiveFilter, addToast]);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'PROJECT_MANAGER') {
      const timer = setTimeout(() => {
        fetchUsers();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, fetchUsers]);

  useEffect(() => {
    const q = searchParams.get('search') || '';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(q);
    setAppliedSearch(q);
    setPage(1);
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setSubmitting(true);
      await api.post('/api/v1/users', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      });
      addToast('User created successfully! A welcome email was triggered.', 'success');
      setName('');
      setEmail('');
      setRole('COLLABORATOR');
      setIsAddOpen(false);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create user.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (e) => {
    e.preventDefault();
    if (!activeUser) return;

    try {
      setSubmitting(true);
      await api.patch(`/api/v1/users/${activeUser.id}/role`, {
        role: editRole,
      });
      addToast('User role updated successfully.', 'success');
      setIsRoleOpen(false);
      setActiveUser(null);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update user role.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    if (targetUser.id === user.id) {
      addToast('You cannot deactivate your own account.', 'error');
      return;
    }

    const actionText = targetUser.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionText} this user?`)) {
      return;
    }

    try {
      if (targetUser.isActive) {
        // Deactivate using DELETE or PATCH /deactivate
        await api.patch(`/api/v1/users/${targetUser.id}/deactivate`);
        addToast('User account deactivated successfully.', 'success');
      } else {
        // Activate using PUT
        await api.put(`/api/v1/users/${targetUser.id}`, {
          isActive: true,
        });
        addToast('User account activated successfully.', 'success');
      }
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || `Failed to ${actionText} user.`, 'error');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === user.id) {
      addToast('You cannot delete your own account.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user ${targetUser.name}? This action is irreversible.`)) {
      return;
    }

    try {
      await api.delete(`/api/v1/users/${targetUser.id}`);
      addToast('User deleted successfully.', 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  const openRoleModal = (targetUser) => {
    setActiveUser(targetUser);
    setEditRole(targetUser.role);
    setIsRoleOpen(true);
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'PROJECT_MANAGER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-600/20';
    }
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' && user?.role !== 'PROJECT_MANAGER') {
    return (
      <div className="p-8 text-center bg-slate-950/20 border border-slate-900 rounded-3xl">
        <h2 className="text-xl font-bold text-rose-455">Unauthorized Access</h2>
        <p className="text-slate-400 text-sm mt-2">Only administrators and project managers are permitted to view user directory lists.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
            <UsersIcon className="h-8 w-8 text-violet-400" />
            User Directory
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage platform members, assign user security roles, and control active status.</p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <button
            onClick={() => {
              setName('');
              setEmail('');
              setRole('COLLABORATOR');
              setIsAddOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/15 transition-all duration-200 flex items-center justify-center space-x-2 text-sm cursor-pointer self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add New User</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center bg-slate-900 border border-slate-800 focus-within:border-violet-500 focus-within:outline-none rounded-xl px-3 py-2 text-sm text-slate-200">
          <Search className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm text-slate-200 placeholder:text-slate-500"
          />
          <button type="submit" className="hidden" />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl outline-none focus-within:border-violet-500 cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="COLLABORATOR">Collaborator</option>
            </select>

          {/* Active Status Filter */}
          <select
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* Reset Filters */}
          {(search || appliedSearch || roleFilter || isActiveFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setAppliedSearch('');
                setRoleFilter('');
                setIsActiveFilter('');
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm animate-pulse flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
          <span>Fetching system user directory...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center bg-slate-950/20 border border-slate-900 border-dashed rounded-3xl">
          <UsersIcon className="h-10 w-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No users found matching your filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-950/40 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-550 bg-slate-900/10">
                  <th className="p-4">User profile</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined Date</th>
                  {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {users.map((targetUser) => (
                  <tr key={targetUser.id} className="hover:bg-slate-900/20 transition-colors">
                    {/* User profile with initials avatar */}
                    <td 
                      onClick={() => setSelectedUserDetails(targetUser)}
                      className="p-4 flex items-center space-x-3 cursor-pointer group/user select-none"
                      title="View User Details"
                    >
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs border group-hover/user:scale-105 transition-transform ${
                        targetUser.role === 'SUPER_ADMIN' ? 'avatar-initials-amber' :
                        targetUser.role === 'ADMIN' ? 'avatar-initials-purple' :
                        targetUser.role === 'PROJECT_MANAGER' ? 'avatar-initials-blue' :
                        'avatar-initials-violet'
                      }`}>
                        {targetUser.name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-200 group-hover/user:text-violet-400 group-hover/user:underline">{targetUser.name}</div>
                        <div className="text-xs text-slate-450 font-mono mt-0.5">{targetUser.email}</div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(targetUser.role)}`}>
                        {targetUser.role?.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        targetUser.isActive
                          ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/25'
                          : 'bg-rose-500/10 text-rose-450 border-rose-500/25'
                      }`}>
                        {targetUser.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="p-4 text-slate-400 font-mono">
                      {targetUser.createdAt ? new Date(targetUser.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Action buttons */}
                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2.5">
                          <button
                            onClick={() => openRoleModal(targetUser)}
                            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Change User Role"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {targetUser.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleToggleStatus(targetUser)}
                              disabled={targetUser.id === user.id}
                              className={`p-1.5 rounded border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                targetUser.isActive
                                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-450 hover:border-rose-900/40 hover:bg-rose-950/20'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-900/40 hover:bg-emerald-950/20'
                              }`}
                              title={targetUser.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              {targetUser.isActive ? (
                                <UserX className="h-3.5 w-3.5" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                          {user?.role === 'SUPER_ADMIN' && targetUser.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleDeleteUser(targetUser)}
                              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-900/40 hover:bg-rose-950/20 transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400 select-none">
              <span>Showing Page {page} of {totalPages} ({total} Users)</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-450 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-450 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddOpen(false)}></div>
          <div className="relative w-full max-w-md bg-slate-950 border border-slate-850 rounded-2xl p-6 shadow-2xl z-10">
            <button className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer hover:bg-slate-900 p-1 rounded-lg transition-colors" onClick={() => setIsAddOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-white mb-4">Add New Platform User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-905 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-sm text-slate-200"
                  placeholder="e.g. Dayalan Sundar"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-905 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-sm text-slate-200 font-mono"
                  placeholder="e.g. dayalan@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Platform Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-905 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-sm text-slate-200 cursor-pointer"
                >
                  {user?.role === 'SUPER_ADMIN' && <option value="ADMIN">Administrator</option>}
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="COLLABORATOR">Collaborator</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Create User Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {isRoleOpen && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsRoleOpen(false); setActiveUser(null); }}></div>
          <div className="relative w-full max-w-md bg-slate-950 border border-slate-850 rounded-2xl p-6 shadow-2xl z-10">
            <button className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer hover:bg-slate-900 p-1 rounded-lg transition-colors" onClick={() => { setIsRoleOpen(false); setActiveUser(null); }}>
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-white mb-4">Edit System Security Role</h2>
            <p className="text-slate-400 text-xs mb-4">Update accessibility permissions for user <span className="text-slate-200 font-bold">{activeUser.name}</span> ({activeUser.email}).</p>
            <form onSubmit={handleRoleChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Platform Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={activeUser?.role === 'SUPER_ADMIN'}
                  className="w-full px-3 py-2 bg-slate-905 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-sm text-slate-200 cursor-pointer disabled:opacity-50"
                >
                  {activeUser?.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                  {user?.role === 'SUPER_ADMIN' && activeUser?.role !== 'SUPER_ADMIN' && <option value="ADMIN">Administrator</option>}
                  {activeUser?.role !== 'SUPER_ADMIN' && (
                    <>
                      <option value="PROJECT_MANAGER">Project Manager</option>
                      <option value="COLLABORATOR">Collaborator</option>
                    </>
                  )}
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Update Access Role'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUserDetails && (
        <UserDetailsModal 
          targetUser={selectedUserDetails} 
          onClose={() => setSelectedUserDetails(null)} 
        />
      )}
    </div>
  );
}

// --- USER DETAILS OVERLAY MODAL ---
function UserDetailsModal({ targetUser, onClose }) {
  const initials = targetUser.name?.split(' ').map(n => n[0]).join('') || 'U';
  
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'PROJECT_MANAGER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-600/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="fixed inset-0 bg-transparent" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 cursor-pointer">
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          {/* Avatar */}
          <div className={`h-20 w-20 rounded-full flex items-center justify-center font-bold text-2xl border select-none ${
            targetUser.role === 'SUPER_ADMIN' ? 'avatar-initials-amber' :
            targetUser.role === 'ADMIN' ? 'avatar-initials-purple' :
            targetUser.role === 'PROJECT_MANAGER' ? 'avatar-initials-blue' :
            'avatar-initials-violet'
          }`}>
            {initials}
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-850">{targetUser.name}</h2>
            <p className="text-sm font-mono text-slate-400 mt-1">{targetUser.email}</p>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(targetUser.role)}`}>
              {targetUser.role?.replace('_', ' ')}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              targetUser.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-red-50 text-red-700 border-red-100'
            }`}>
              {targetUser.isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>

        {/* Detailed Info Section */}
        <div className="mt-6 border-t border-slate-100 pt-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Account ID</span>
            <span className="font-mono text-slate-750">{targetUser.id}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Date Registered</span>
            <span className="text-slate-750 font-semibold">
              {targetUser.createdAt ? new Date(targetUser.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
