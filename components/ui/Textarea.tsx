import React, { forwardRef, useId } from 'react';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'borderless';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((
  {
    label,
    error,
    helperText,
    size = 'md',
    variant = 'default',
    resize = 'vertical',
    className = '',
    id,
    required,
    ...props
  },
  ref
) => {
  const textareaId = useId();
  const finalId = id || textareaId;
  const errorId = `${finalId}-error`;
  const helperId = `${finalId}-helper`;
  const baseClasses = 'block w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };
  
  const variantClasses = {
    default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
    filled: 'border-transparent bg-gray-50 focus:bg-white focus:border-primary-500 dark:bg-gray-800 dark:focus:bg-gray-900',
    borderless: 'border-transparent bg-transparent focus:border-primary-500',
  };
  
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };
  
  const errorClasses = error 
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' 
    : '';
  
  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    resizeClasses[resize],
    errorClasses,
    className,
  ].join(' ');
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={finalId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-danger-500 ml-1" aria-label="gerekli alan">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={finalId}
        className={classes}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          [error && errorId, helperText && helperId]
            .filter(Boolean)
            .join(' ') || undefined
        }
        required={required}
        {...props}
      />
      
      {(error || helperText) && (
        <div className="mt-1">
          {error && (
            <p 
              id={errorId}
              className="text-sm text-danger-600 dark:text-danger-400"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          )}
          {helperText && !error && (
            <p 
              id={helperId}
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

/**
 * Tipler dosya içinde zaten tanımlı ve components/ui/index.ts tarafından yeniden export ediliyor.
 * Duplicate export hatasını önlemek için burada tekrar export edilmedi.
 */
