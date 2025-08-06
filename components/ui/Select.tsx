import React, { forwardRef, useId } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'borderless';
  leftIcon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>((
  {
    label,
    error,
    helperText,
    options,
    placeholder,
    size = 'md',
    variant = 'default',
    leftIcon,
    className = '',
    id,
    required,
    ...props
  },
  ref
) => {
  const selectId = useId();
  const finalId = id || selectId;
  const errorId = `${finalId}-error`;
  const helperId = `${finalId}-helper`;
  const baseClasses = 'block w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-white dark:bg-gray-700 dark:text-white';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };
  
  const variantClasses = {
    default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600',
    filled: 'border-transparent bg-gray-50 focus:bg-white focus:border-primary-500 dark:bg-gray-800 dark:focus:bg-gray-900',
    borderless: 'border-transparent bg-transparent focus:border-primary-500',
  };
  
  const errorClasses = error 
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' 
    : '';
  
  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    errorClasses,
    leftIcon ? 'pl-10' : '',
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
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 h-5 w-5" aria-hidden="true">{leftIcon}</span>
          </div>
        )}
        
        <select
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
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
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

Select.displayName = 'Select';

/**
 * Tipler dosya içinde zaten tanımlı ve dışarı aktarıldı.
 * components/ui/index.ts yeniden export ettiği için burada tekrar export etmeye gerek yok.
 * (duplicate export hatasını önlemek için kaldırıldı)
 */
