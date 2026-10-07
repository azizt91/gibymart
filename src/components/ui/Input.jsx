import { forwardRef } from 'react';

/**
 * Reusable Input Component
 * Explicit block layout & vertical centering to prevent any label/text overlap
 */
const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  isDisabled = false,
  isRequired = false,
  className = '',
  containerClassName = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // For native date/time pickers, hide custom inner left icons to avoid collision with browser's native picker icons
  const showIcon = Icon && type !== 'time' && type !== 'date';

  return (
    <div className={`flex flex-col w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          {label} {isRequired && <span className="text-accent-red">*</span>}
        </label>
      )}

      <div className="relative w-full">
        {showIcon && iconPosition === 'left' && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center text-slate-400 pointer-events-none z-10">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={isDisabled}
          className={`
            w-full h-11 rounded-xl text-sm bg-white border transition-all duration-200 block
            text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue
            ${showIcon && iconPosition === 'left' ? 'pl-10 pr-3.5' : 'px-3.5'}
            ${showIcon && iconPosition === 'right' ? 'pr-10 pl-3.5' : ''}
            ${error ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-slate-300 hover:border-slate-400'}
            ${isDisabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}
            ${className}
          `}
          {...props}
        />

        {showIcon && iconPosition === 'right' && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-slate-400 pointer-events-none z-10">
            <Icon className="w-4 h-4" />
          </div>
        )}
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

Input.displayName = 'Input';

export default Input;
