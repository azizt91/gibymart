import { useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

/**
 * Toast Provider Component
 * Manages toast stack automatically with auto-dismiss and deduplication
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    if (!message) return;

    setToasts((prev) => {
      // Prevent duplicate toasts with identical message and type
      if (prev.some((t) => t.message === message && t.type === type)) {
        return prev;
      }
      const id = Date.now() + Math.random().toString();
      return [...prev, { id, message, type, duration }];
    });

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.message !== message));
      }, duration);
    }
  }, []);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}

      {/* Floating Toast Container (Bottom Right) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const configs = {
    success: {
      bg: 'bg-white border-emerald-200 text-slate-800 shadow-lg shadow-emerald-500/10',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500'
    },
    error: {
      bg: 'bg-white border-rose-200 text-slate-800 shadow-lg shadow-rose-500/10',
      icon: AlertCircle,
      iconColor: 'text-rose-500'
    },
    warning: {
      bg: 'bg-white border-amber-200 text-slate-800 shadow-lg shadow-amber-500/10',
      icon: AlertTriangle,
      iconColor: 'text-amber-500'
    },
    info: {
      bg: 'bg-white border-blue-200 text-slate-800 shadow-lg shadow-blue-500/10',
      icon: Info,
      iconColor: 'text-blue-500'
    }
  };

  const config = configs[toast.type] || configs.info;
  const Icon = config.icon;

  return (
    <div
      className={`
        pointer-events-auto p-3.5 rounded-xl border flex items-start gap-3
        transition-all duration-300 animate-slide-up ${config.bg}
      `}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <p className="text-xs font-semibold leading-relaxed flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
