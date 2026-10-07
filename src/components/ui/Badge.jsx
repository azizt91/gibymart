/**
 * Reusable Badge component for status tags
 * Variants / Colors matched with design tokens
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = ''
}) {
  const variantStyles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    orange: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    gray: 'bg-slate-100 text-slate-600 border-slate-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const dotColors = {
    green: 'bg-emerald-500',
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    orange: 'bg-amber-500',
    purple: 'bg-purple-500',
    red: 'bg-rose-500',
    gray: 'bg-slate-400',
    default: 'bg-slate-500',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-colors ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`}
        />
      )}
      {children}
    </span>
  );
}
