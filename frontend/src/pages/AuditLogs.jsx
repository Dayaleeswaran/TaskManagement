import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2, Calendar, ClipboardList, Info } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const { addToast } = useToast();

  const searchRef = useRef('');
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/users/audit-logs?page=${page}&limit=10&search=${encodeURIComponent(searchRef.current)}`);
      setLogs(response.data.logs || []);
      setTotal(response.data.pagination?.total || 0);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      addToast('Failed to load compliance audit logs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 0);
    return () => clearTimeout(timer);
  }, [page, fetchLogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            System Audit Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track user administrative actions, compliance reports, and security events.
          </p>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action or performer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-800 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-sm cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="text-xs text-slate-500 font-semibold">
          Total actions recorded: <span className="text-slate-800">{total}</span>
        </div>
      </div>

      {/* Grid List View */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
            <span className="text-sm font-semibold">Retrieving system logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-slate-500 flex flex-col items-center justify-center space-y-3">
            <ClipboardList className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold">No audit logs found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Performed By</th>
                  <th className="px-6 py-4">Target Entity ID</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{formatDate(log.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 uppercase tracking-wide">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{log.performer?.name || 'System'}</span>
                        <span className="text-xs text-slate-400">{log.performer?.email || ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {log.targetId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.metadata ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-violet-50 text-slate-400 hover:text-violet-600 border border-slate-200 hover:border-violet-200 transition-all cursor-pointer"
                          title="Inspect Metadata JSON"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">
              Showing page <span className="font-semibold text-slate-700">{page}</span> of{' '}
              <span className="font-semibold text-slate-700">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
                <span>Inspect Event Metadata</span>
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Event Action: {selectedLog.action}</span>
                <span>{formatDate(selectedLog.createdAt)}</span>
              </div>
              <pre className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 overflow-x-auto max-h-[300px]">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
