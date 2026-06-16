import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

/**
 * Toast type → visual config map
 */
const TOAST_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-950/90',
    border: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    progressColor: 'bg-emerald-500',
    textColor: 'text-emerald-100',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-red-950/90',
    border: 'border-red-500/30',
    iconColor: 'text-red-400',
    progressColor: 'bg-red-500',
    textColor: 'text-red-100',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-950/90',
    border: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    progressColor: 'bg-amber-500',
    textColor: 'text-amber-100',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-950/90',
    border: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    progressColor: 'bg-blue-500',
    textColor: 'text-blue-100',
  },
};

/**
 * Individual Toast component
 */
function ToastItem({ toast }) {
  const { dismissToast } = useToast();
  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
  const IconComponent = config.icon;

  return (
    <div
      className={`relative flex items-start gap-3 px-4 py-3.5 rounded-xl border backdrop-blur-md shadow-2xl min-w-[320px] max-w-[420px] overflow-hidden ${
        config.bg
      } ${config.border} ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}
      role="alert"
    >
      {/* Icon */}
      <IconComponent className={`h-5 w-5 mt-0.5 shrink-0 ${config.iconColor}`} />

      {/* Message */}
      <p className={`text-sm font-medium leading-snug flex-1 ${config.textColor}`}>
        {toast.message}
      </p>

      {/* Close Button */}
      <button
        onClick={() => dismissToast(toast.id)}
        className="p-0.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
        <div
          className={`h-full toast-progress ${config.progressColor} opacity-60`}
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      </div>
    </div>
  );
}

/**
 * ToastContainer — Renders all active toasts, fixed top-right.
 * Place once at root level (App.jsx).
 */
export default function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-3 pointer-events-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
