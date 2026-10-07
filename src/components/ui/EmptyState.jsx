import { FolderOpen } from 'lucide-react';
import Button from './Button';

/**
 * Reusable Empty State component when tables or lists have no data
 */
export default function EmptyState({
  title = 'Tidak Ada Data',
  description = 'Belum ada data yang tersedia untuk ditampilkan.',
  icon: Icon = FolderOpen,
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`py-6 sm:py-8 px-4 text-center flex flex-col items-center justify-center ${className}`}>
      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
        <Icon className="w-5 h-5" />
      </div>

      <h4 className="text-sm font-bold text-text-dark mb-1">{title}</h4>
      <p className={`text-xs text-text-muted max-w-sm ${actionLabel && onAction ? 'mb-4' : 'mb-0'}`}>{description}</p>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
