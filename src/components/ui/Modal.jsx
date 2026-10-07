import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Reusable Modal / Dialog Component
 * Uses createPortal into document.body to ensure it is always attached to true viewport,
 * never clipped by parent transform or overflow-hidden containers.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  closeOnBackdrop = true,
  className = ''
}) {
  // Handle ESC key press and scroll locking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-4xl'
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ zIndex: 99999 }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Modal Card */}
      <div
        className={`
          relative w-full ${sizeStyles[size] || sizeStyles.md} bg-white rounded-2xl text-left
          shadow-2xl border border-slate-200/90 z-10 my-auto overflow-hidden animate-scale-up
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-slate-100 bg-white"
          style={{ padding: '18px 24px' }}
        >
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 leading-snug">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
              aria-label="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body with max-height and custom scrollbar */}
        <div
          className="max-h-[calc(85vh-130px)] overflow-y-auto"
          style={{ padding: '24px' }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-3 bg-slate-50/90 border-t border-slate-100 rounded-b-2xl"
            style={{ padding: '16px 24px' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
