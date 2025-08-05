import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  text?: string;
  overlay?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  overlay = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };
  
  const colorClasses = {
    primary: 'border-blue-600',
    secondary: 'border-gray-600',
    white: 'border-white',
    gray: 'border-gray-400',
  };
  
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  
  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}
      />
      {text && (
        <p className={`mt-2 text-gray-600 dark:text-gray-400 ${textSizeClasses[size]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
  
  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          {spinner}
        </div>
      </div>
    );
  }
  
  return spinner;
};

// Page Loading Spinner
export const PageLoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Sayfa yükleniyor...' }) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

// Inline Loading Spinner
export const InlineLoadingSpinner: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
};

// Button Loading Spinner
export const ButtonLoadingSpinner: React.FC = () => {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};

// Dots Loading Animation
export const DotsLoadingSpinner: React.FC<{ color?: string }> = ({ color = 'bg-blue-600' }) => {
  return (
    <div className="flex space-x-1">
      <div className={`h-2 w-2 ${color} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
      <div className={`h-2 w-2 ${color} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
      <div className={`h-2 w-2 ${color} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};

// Pulse Loading Animation
export const PulseLoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };
  
  return (
    <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse`}></div>
  );
};

// Ripple Loading Animation
export const RippleLoadingSpinner: React.FC = () => {
  return (
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-blue-600 rounded-full animate-ping"></div>
      <div className="absolute inset-2 border-4 border-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute inset-4 border-4 border-blue-200 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
    </div>
  );
};

export default LoadingSpinner;