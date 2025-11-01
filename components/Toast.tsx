import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { ToastMessage } from '../types.ts';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const icons = {
  success: <CheckCircle className="text-green-400" />,
  error: <AlertTriangle className="text-red-400" />,
  info: <Info className="text-blue-400" />,
};

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, onClose]);

  return (
    <div
      className="glass-pane rounded-lg shadow-2xl p-4 flex items-center gap-4 animate-fade-in border border-gray-700/50 w-full"
      role="alert"
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <div className="flex-1 text-sm text-gray-200">{toast.message}</div>
      <button onClick={() => onClose(toast.id)} className="text-gray-500 hover:text-white">
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
