/**
 * Reusable Card components: StatCard & ContentCard
 * Refined layout and padding to eliminate compression
 */

/**
 * StatCard — Used in Dashboard summary grid
 * Accent colors: blue, green, orange, purple, red
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = 'blue',
  className = '',
  onClick
}) {
  const accentStyles = {
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100/80',
      accentBar: 'bg-blue-500',
    },
    green: {
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100/80',
      accentBar: 'bg-emerald-500',
    },
    orange: {
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100/80',
      accentBar: 'bg-amber-500',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100/80',
      accentBar: 'bg-purple-500',
    },
    red: {
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100/80',
      accentBar: 'bg-rose-500',
    }
  };

  const style = accentStyles[accentColor] || accentStyles.blue;

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300
        transition-all duration-200 flex flex-col justify-between overflow-hidden group
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{ padding: '22px 20px' }}
    >
      {/* Subtle top indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${style.accentBar} opacity-90`} />

      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </span>

        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-1">
        <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium mt-2 leading-normal">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * ContentCard — Standard container card for tables, charts, forms
 */
export function ContentCard({
  title,
  subtitle,
  action,
  children,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = ''
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden ${className}`}>
      {(title || action) && (
        <div
          className={`border-b border-slate-100 flex items-center justify-between gap-4 ${headerClassName}`}
          style={{ padding: '18px 24px' }}
        >
          <div>
            {title && <h3 className="text-base font-bold text-slate-800 leading-snug">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5 font-medium leading-normal">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`${bodyClassName}`} style={{ padding: '22px 24px' }}>
        {children}
      </div>
      {footer && (
        <div
          className="bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl"
          style={{ padding: '14px 24px' }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

export default ContentCard;
