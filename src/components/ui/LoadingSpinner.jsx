import { Loader2 } from 'lucide-react';

/**
 * Reusable Loading Spinner Component
 */
export function LoadingSpinner({ size = 'md', label = 'Memuat data...', className = '' }) {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <Loader2 className={`${sizeStyles[size] || sizeStyles.md} animate-spin text-accent-blue mb-2.5`} />
      {label && <p className="text-xs font-medium text-text-muted">{label}</p>}
    </div>
  );
}

/**
 * Full Page Loading Component
 */
export function PageLoading({ label = 'Memuat halaman...' }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}

export default LoadingSpinner;
