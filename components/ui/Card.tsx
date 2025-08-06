import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
  as?: 'div' | 'article' | 'section';
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  avatar?: React.ReactNode;
  action?: React.ReactNode;
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  role,
  as: Component = 'div',
}) => {
  const baseClasses = 'rounded-xl transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl',
    outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20 dark:bg-gray-800/10 dark:border-gray-700/20',
    gradient: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg',
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };
  
  const hoverClasses = hover ? 'hover:scale-105 cursor-pointer' : '';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    hoverClasses,
    className,
  ].join(' ');
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Component 
      className={classes} 
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={role || (onClick ? 'button' : undefined)}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {children}
    </Component>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  avatar,
  action,
}) => {
  return (
    <header className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center space-x-3">
        {avatar && <div className="flex-shrink-0" aria-hidden="true">{avatar}</div>}
        <div className="flex-1">{children}</div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  );
};

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={className}>{children}</div>;
};

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  return <div className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>;
};

// Stat Card Component
export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color = 'primary',
}) => {
  const ariaLabel = `${title}: ${value}${change ? `, ${changeType === 'increase' ? 'artış' : changeType === 'decrease' ? 'azalış' : 'değişim'} ${change}` : ''}`;
  
  const changeText = {
    increase: 'artış',
    decrease: 'azalış', 
    neutral: 'değişim'
  };
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-100 dark:bg-primary-900/20',
    success: 'text-success-600 bg-success-100 dark:bg-success-900/20',
    warning: 'text-warning-600 bg-warning-100 dark:bg-warning-900/20',
    danger: 'text-danger-600 bg-danger-100 dark:bg-danger-900/20',
  };
  
  const changeColorClasses = {
    increase: 'text-success-600',
    decrease: 'text-danger-600',
    neutral: 'text-gray-600',
  };
  
  const changeIcon = {
    increase: '↗',
    decrease: '↘',
    neutral: '→',
  };
  
  return (
    <Card 
      variant="elevated" 
      padding="lg" 
      hover
      as="article"
      aria-label={ariaLabel}
      role="img"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400" id={`stat-title-${title.replace(/\s+/g, '-').toLowerCase()}`}>{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1" aria-describedby={`stat-title-${title.replace(/\s+/g, '-').toLowerCase()}`}>{value}</p>
          {change && (
            <p className={`text-sm ${changeColorClasses[changeType]} mt-1`} aria-label={`${changeText[changeType]} ${change}`}>
              <span aria-hidden="true">{changeIcon[changeType]}</span> {change}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-full ${colorClasses[color]}`} aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
