import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button component
 * Variants: primary, secondary, danger, success, ghost, outline
 * Sizes: sm, md, lg
 */
const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]';

  const variantStyles = {
    primary: 'bg-accent-blue hover:bg-blue-600 text-white shadow-sm focus:ring-accent-blue/50',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-text-dark border border-slate-200 focus:ring-slate-300',
    success: 'bg-accent-green hover:bg-emerald-600 text-white shadow-sm focus:ring-accent-green/50',
    danger: 'bg-accent-red hover:bg-red-600 text-white shadow-sm focus:ring-accent-red/50',
    ghost: 'bg-transparent hover:bg-slate-100 text-text-dark focus:ring-slate-300',
    outline: 'bg-transparent border border-slate-300 hover:bg-slate-50 text-text-dark focus:ring-accent-blue/50'
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2.5 gap-2 min-h-[40px]',
    lg: 'text-base px-6 py-3 gap-2.5 min-h-[48px]'
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Memuat...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
