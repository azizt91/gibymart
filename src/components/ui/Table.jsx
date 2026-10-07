/**
 * Reusable Responsive Table Component
 * Refined padding and text alignment to prevent vertical overlap
 */

export function Table({ children, className = '' }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
      <table className={`w-full text-left border-collapse text-sm ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <thead className={`bg-slate-50 border-b border-slate-200 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y divide-slate-100 bg-white ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', hover = true, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`
        transition-colors duration-150
        ${hover ? 'hover:bg-slate-50/70' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({ children, className = '', align = 'left' }) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[align] || 'text-left';

  return (
    <th
      className={`px-4 sm:px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider ${alignClass} ${className}`}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', align = 'left' }) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[align] || 'text-left';

  return (
    <td className={`px-4 sm:px-5 py-3.5 text-slate-800 leading-normal align-middle ${alignClass} ${className}`}>
      {children}
    </td>
  );
}

export default Table;
