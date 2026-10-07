/**
 * Reusable Skeleton loader for placeholder loading states
 */
export function Skeleton({ className = '', variant = 'text' }) {
  const variantStyles = {
    text: 'h-4 rounded-md',
    title: 'h-6 rounded-md',
    avatar: 'w-10 h-10 rounded-full',
    card: 'h-32 rounded-xl',
    button: 'h-10 rounded-lg'
  };

  return (
    <div
      className={`bg-slate-200 animate-pulse ${variantStyles[variant] || variantStyles.text} ${className}`}
    />
  );
}

/**
 * Table Skeleton loading placeholder
 */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <Skeleton key={cIdx} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * StatCard Skeleton loading placeholder
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton variant="text" className="w-24" />
        <Skeleton variant="avatar" className="w-8 h-8" />
      </div>
      <Skeleton variant="title" className="w-16 h-8" />
      <Skeleton variant="text" className="w-32" />
    </div>
  );
}

export default Skeleton;
