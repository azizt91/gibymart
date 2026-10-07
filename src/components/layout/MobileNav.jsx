import { useEffect } from 'react';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';

export default function MobileNav({ isOpen, onClose }) {
  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Dark Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-in Drawer Container */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-primary shadow-2xl flex flex-col z-10 transform transition-transform duration-300 animate-slide-up">
        {/* Close Button Header */}
        <div className="absolute top-4 right-3 z-20">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-primary-light/50 text-slate-300 hover:text-white transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Menu Component */}
        <Sidebar onItemClick={onClose} />
      </div>
    </div>
  );
}
