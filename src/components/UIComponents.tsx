import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, User } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="text-red-600" size={24} />,
          bg: 'bg-red-50',
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="text-amber-600" size={24} />,
          bg: 'bg-amber-50',
          button: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
      default:
        return {
          icon: <AlertTriangle className="text-primary" size={24} />,
          bg: 'bg-primary/10',
          button: 'btn-primary'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6 text-center">
              <div className={`w-16 h-16 ${styles.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {styles.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
            </div>

            <div className="p-6 bg-slate-50 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-4 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm ${styles.button}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-600 text-white';
      case 'error':
        return 'bg-rose-600 text-white';
      default:
        return 'bg-slate-800 text-white';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 50, x: '-50%' }}
      className={`fixed bottom-8 left-1/2 z-[110] px-6 py-3 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-3 min-w-[280px] justify-center ${getStyles()}`}
    >
      {message}
    </motion.div>
  );
};

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  iconSize?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  src, 
  name, 
  className = '', 
  size = 'md', 
  iconSize 
}) => {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const calcIconSize = iconSize || (size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 18 : size === 'lg' ? 22 : 28);
  const initials = name ? name.trim().split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() : '';

  if (src && src.trim() !== '' && !imageError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`object-cover rounded-full ${className || sizeClasses[size]}`}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className={`rounded-full bg-primary-100 text-primary font-bold flex items-center justify-center shrink-0 border border-primary-200/50 ${className || sizeClasses[size]}`}>
      {initials ? initials : <User size={calcIconSize} />}
    </div>
  );
};
