import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Reusable Select Dropdown Component
 * Explicit block layout & vertical centering to prevent overlap
 */
const Select = forwardRef(({
  label,
  options = [],
  placeholder = 'Pilih salah satu...',
  error,
  helperText,
  icon: Icon,
  isDisabled = false,
  isRequired = false,
  className = '',
  containerClassName = '',
  id,
  value,
  onChange,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          {label} {isRequired && <span className="text-accent-red">*</span>}
        </label>
      )}

      <div className="relative w-full">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center text-slate-400 pointer-events-none z-10">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={isDisabled}
          className={`
            w-full h-11 rounded-xl text-sm bg-white border transition-all duration-200 appearance-none block
            pr-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue cursor-pointer
            ${Icon ? 'pl-10' : 'px-3.5'}
            ${error ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-slate-300 hover:border-slate-400'}
            ${isDisabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-slate-400 pointer-events-none z-10">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-accent-red font-medium flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500 font-medium">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
