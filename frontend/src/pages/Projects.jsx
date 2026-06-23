import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  FolderKanban, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Loader2, 
  Users, 
  Activity, 
  Info, 
  UserPlus, 
  UserMinus,
  Search,
  Calendar,
  Clock
} from 'lucide-react';

export default function Projects() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals/Forms State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/v1/projects');
      setProjects(response.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
      addToast('Failed to retrieve projects.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      await api.post('/api/v1/projects', { name, description });
      addToast('Project created successfully!', 'success');
      setName('');
      setDescription('');
      setIsCreateOpen(false);
      fetchProjects();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create project.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !activeProject) return;

    try {
      setSubmitting(true);
      await api.put(`/api/v1/projects/${activeProject.id}`, { name, description });
      addToast('Project updated successfully!', 'success');
      setName('');
      setDescription('');
      setIsEditOpen(false);
      setActiveProject(null);
      fetchProjects();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update project.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will be permanently removed.')) {
      return;
    }

    try {
      await api.delete(`/api/v1/projects/${projectId}`);
      addToast('Project deleted successfully.', 'success');
      fetchProjects();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete project.', 'error');
    }
  };

  const openEditModal = (proj) => {
    setActiveProject(proj);
    setName(proj.name);
    setDescription(proj.description || '');
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Projects</h1>
          <p className="text-slate-500 text-sm mt-1">Manage project portfolios, status tracking, and resource allocation.</p>
        </div>
        
        {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
          <button 
            onClick={() => {
              setName('');
              setDescription('');
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/15 transition-all duration-200 flex items-center space-x-2 text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-550 text-sm animate-pulse">Loading active projects...</div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center bg-slate-950/20 border border-slate-900 border-dashed rounded-3xl">
          <FolderKanban className="h-10 w-10 text-slate-705 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No active projects found.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedProjectDetails(project)}
              className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[190px] relative group cursor-pointer"
            >
              {/* Top Section */}
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                  <FolderKanban className="h-5 w-5" />
                </div>
                
                {/* PM / Admin controls */}
                {(user?.role === 'ADMIN' || project.ownerId === user?.id) && (
                  <div 
                    className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      onClick={() => openEditModal(project)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                      title="Edit project"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(project.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-100 transition-colors cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Title / Description */}
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-800 leading-tight truncate">
                  {project.name}
                </h3>
                <p className="text-slate-550 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 font-bold border-t border-slate-100 pt-3 uppercase tracking-wider">
                <span>Owner: {project.owner?.name || 'Unknown'}</span>
                <span>{project._count?.tasks || 0} Tasks</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProjectDetails && (
        <ProjectDetailsModal
          project={selectedProjectDetails}
          onClose={() => setSelectedProjectDetails(null)}
        />
      )}

      {/* Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="fixed inset-0 bg-transparent" onClick={() => setIsCreateOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setIsCreateOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Project Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-3 py-2 bg-white border border-slate-350 focus:outline-none focus:ring-1 focus:ring-violet-650 rounded-xl text-sm text-slate-800"
                  placeholder="e.g. Acme Redesign"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full px-3 py-2 bg-white border border-slate-350 focus:outline-none focus:ring-1 focus:ring-violet-650 rounded-xl text-sm text-slate-800 h-24 resize-none"
                  placeholder="Describe project details..."
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="fixed inset-0 bg-transparent" onClick={() => setIsEditOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setIsEditOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Edit Project</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Project Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-3 py-2 bg-white border border-slate-350 focus:outline-none focus:ring-1 focus:ring-violet-650 rounded-xl text-sm text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full px-3 py-2 bg-white border border-slate-350 focus:outline-none focus:ring-1 focus:ring-violet-650 rounded-xl text-sm text-slate-800 h-24 resize-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- PROJECT DETAILS OVERLAY MODAL ---
function ProjectDetailsModal({ project, onClose }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('about'); // 'about', 'members', 'timeline'
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  
  // Search to Add Members
  const [userQuery, setUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const fetchMembersAndTimeline = async () => {
    setLoadingDetails(true);
    try {
      const [membersRes, timelineRes] = await Promise.all([
        api.get(`/api/v1/projects/${project.id}/members`),
        api.get(`/api/v1/projects/${project.id}/activities`)
      ]);
      setMembers(membersRes.data || []);
      setActivities(timelineRes.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load project details.', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchMembersAndTimeline();
  }, [project.id]);

  // Debounced search for users to add
  useEffect(() => {
    if (!userQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await api.get(`/api/v1/search?q=${encodeURIComponent(userQuery)}`);
        // Filter out users who are already members
        const filtered = (response.data.users || []).filter(
          (u) => !members.some((m) => m.id === u.id)
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [userQuery, members]);

  const handleAddMember = async (targetUserId) => {
    try {
      await api.post(`/api/v1/projects/${project.id}/members`, { userId: targetUserId });
      addToast('Member added successfully.', 'success');
      setUserQuery('');
      setSearchResults([]);
      fetchMembersAndTimeline();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to add member.', 'error');
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm('Remove this user from the project?')) return;
    try {
      await api.delete(`/api/v1/projects/${project.id}/members/${targetUserId}`);
      addToast('Member removed successfully.', 'success');
      fetchMembersAndTimeline();
    } catch (err) {
      console.error(err);
      addToast('Failed to remove member.', 'error');
    }
  };

  const isOwnerOrAdmin = user?.role === 'ADMIN' || project.ownerId === user?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="fixed inset-0 bg-transparent" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest block">Project Dashboard</span>
            <h2 className="text-xl font-extrabold text-slate-800 mt-1">{project.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-white px-4">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'about' 
                ? 'border-violet-600 text-violet-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> About</span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'members' 
                ? 'border-violet-600 text-violet-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Members ({members.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'timeline' 
                ? 'border-violet-600 text-violet-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Activity Timeline</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
              <span className="text-xs font-bold">Syncing project workspace...</span>
            </div>
          ) : (
            <>
              {/* ABOUT TAB */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Portfolio Description</h4>
                    <p className="text-sm text-slate-650 mt-2 bg-slate-50 border border-slate-100 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block">Portfolio Owner</span>
                      <span className="text-slate-700 font-semibold mt-1 block">{project.owner?.name || 'Unknown Manager'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Access Scope Code</span>
                      <span className="text-slate-750 font-mono mt-1 block">{project.id}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* MEMBERS TAB */}
              {activeTab === 'members' && (
                <div className="space-y-6">
                  {/* Search and Add User form */}
                  {isOwnerOrAdmin && (
                    <div className="space-y-2 relative">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Add Team Member</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search active users by name or email..."
                          value={userQuery}
                          onChange={(e) => setUserQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-600 text-slate-800"
                        />
                      </div>
                      
                      {/* Search Results Dropdown */}
                      {userQuery && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1.5 divide-y divide-slate-50">
                          {searchingUsers ? (
                            <div className="py-4 text-center text-xs text-slate-400">Searching active members...</div>
                          ) : searchResults.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-400">No active users found.</div>
                          ) : (
                            searchResults.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => handleAddMember(u.id)}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer"
                              >
                                <div>
                                  <span className="font-bold">{u.name}</span>
                                  <span className="text-slate-400 ml-2">({u.email})</span>
                                </div>
                                <UserPlus className="h-4 w-4 text-violet-600" />
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Members list */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Portfolio Members</h4>
                    {members.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">No members registered in this project.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                        {members.map((member) => {
                          const initials = member.name?.split(' ').map(n => n[0]).join('') || 'U';
                          return (
                            <div key={member.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div className="flex items-center space-x-3 text-xs">
                                <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-700">
                                  {initials}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-700">{member.name}</span>
                                  <span className="text-[10px] bg-slate-200/60 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded ml-2 uppercase font-bold tracking-wide">
                                    {member.role?.replace('_', ' ')}
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{member.email}</p>
                                </div>
                              </div>
                              
                              {isOwnerOrAdmin && member.id !== project.ownerId && (
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                                  title="Remove Member"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Activities Feed</h4>
                  {activities.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No activities recorded yet.</p>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                      {activities.map((act) => {
                        const actInitials = act.user?.name?.split(' ').map(n => n[0]).join('') || 'U';
                        return (
                          <div key={act.id} className="relative group">
                            {/* Dot indicator */}
                            <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-white bg-violet-600 ring-4 ring-violet-50 flex items-center justify-center" />
                            
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 hover:shadow-sm transition-all duration-200">
                              <div className="flex items-start justify-between gap-4">
                                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                                  {act.action}
                                </p>
                                <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap flex items-center mt-0.5">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(act.createdAt).toLocaleDateString()} {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-slate-400">
                                <span className="h-4 w-4 rounded bg-slate-200 flex items-center justify-center font-bold text-[8px] text-slate-600 uppercase">
                                  {actInitials}
                                </span>
                                <span>by {act.user?.name || 'System'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
