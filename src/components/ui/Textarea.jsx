import { forwardRef } from 'react';

/**
 * Reusable Textarea Component
 */
const Textarea = forwardRef(({
  label,
  error,
  helperText,
  isDisabled = false,
  isRequired = false,
  rows = 3,
  className = '',
  containerClassName = '',
  id,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5"
        >
          {label} {isRequired && <span className="text-accent-red">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={isDisabled}
        className={`
          w-full rounded-lg text-sm bg-white border transition-colors duration-200
          p-3 text-text-dark placeholder-slate-400 focus:outline-none focus:ring-2 resize-y
          ${error
            ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20'
            : 'border-slate-200 hover:border-slate-300 focus:border-accent-blue focus:ring-accent-blue/20'
          }
          ${isDisabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}
          ${className}
        `}
        {...props}
      />

      {error ? (
        <p className="mt-1 text-xs text-accent-red flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
