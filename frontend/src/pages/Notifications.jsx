import { Bell, Info, Calendar, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Notifications() {
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'System', message: 'Auth token generated successfully from sessionStorage.', time: 'Just now' },
    { id: 2, type: 'Release', message: 'Vite build configurations and Axios service instance optimized.', time: '1 hour ago' },
    { id: 3, type: 'Alert', message: 'Welcome to TaskFlow! Enjoy the premium protected application shell.', time: '2 hours ago' },
  ]);

  const clearAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">Review active system events and message logs.</p>
        </div>
        
        {alerts.length > 0 && (
          <button
            onClick={() => setAlerts([])}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors border border-rose-500/20 px-3 py-1.5 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-slate-700/80 transition-all duration-200 flex items-start justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="mt-1 h-9 w-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Bell className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-violet-600/20 text-violet-300 border border-violet-500/20">
                      {alert.type}
                    </span>
                    <span className="text-slate-500 text-xs flex items-center">
                      <Calendar className="h-3 w-3 mr-1" /> {alert.time}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200 mt-2 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => clearAlert(alert.id)}
                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/5 transition-all duration-200 cursor-pointer"
                title="Dismiss Alert"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="p-8 rounded-2xl bg-slate-950/20 border border-slate-800 border-dashed text-center">
            <Info className="h-8 w-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No system notifications to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}
