import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Toast, ToastType } from '@/types';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

const TOAST_STYLES: Record<ToastType, { bg: string; icon: typeof CheckCircle; border: string }> = {
  success: { bg: 'bg-turquoise/20', icon: CheckCircle, border: 'border-turquoise/40' },
  error: { bg: 'bg-coral/20', icon: XCircle, border: 'border-coral/40' },
  info: { bg: 'bg-purple/20', icon: Info, border: 'border-purple/40' },
  warning: { bg: 'bg-yellow/20', icon: AlertTriangle, border: 'border-yellow/40' },
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: 'text-turquoise',
  error: 'text-coral',
  info: 'text-purple',
  warning: 'text-yellow',
};

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type];
        const Icon = style.icon;
        return (
          <div
            key={toast.id}
            className={`glass ${style.bg} border ${style.border} rounded-2xl px-4 py-3 flex items-center gap-3 animate-slide-up shadow-soft pointer-events-auto`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${TOAST_ICONS[toast.type]}`} />
            <p className="text-sm font-semibold flex-1">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
