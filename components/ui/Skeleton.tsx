import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false,
  animate = true,
}) => {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]';
  const animateClasses = animate ? 'animate-shimmer' : '';
  const roundedClasses = rounded ? 'rounded-full' : 'rounded';
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };
  
  return (
    <div 
      className={`${baseClasses} ${animateClasses} ${roundedClasses} ${className}`}
      style={style}
    />
  );
};

// Card Skeleton
export const CardSkeleton: React.FC<{ lines?: number; showAvatar?: boolean }> = ({ 
  lines = 3, 
  showAvatar = false 
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse">
        {showAvatar && (
          <div className="flex items-center space-x-4 mb-4">
            <Skeleton width={40} height={40} rounded />
            <div className="flex-1">
              <Skeleton height={16} width="60%" className="mb-2" />
              <Skeleton height={12} width="40%" />
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton 
              key={index}
              height={12} 
              width={index === lines - 1 ? '75%' : '100%'}
            />
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <Skeleton width={80} height={32} />
          <Skeleton width={60} height={20} />
        </div>
      </div>
    </div>
  );
};

// Stat Card Skeleton
export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton height={14} width="70%" className="mb-2" />
            <Skeleton height={24} width="50%" className="mb-2" />
            <Skeleton height={12} width="40%" />
          </div>
          <Skeleton width={48} height={48} rounded />
        </div>
      </div>
    </div>
  );
};

// Table Skeleton
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number;
  showHeader?: boolean;
}> = ({ 
  rows = 5, 
  columns = 4,
  showHeader = true 
}) => {
  return (
    <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {showHeader && (
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={index} className="px-6 py-3">
                    <Skeleton height={16} width="80%" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="animate-pulse">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <Skeleton 
                      height={16} 
                      width={colIndex === 0 ? '90%' : colIndex % 2 === 0 ? '70%' : '50%'}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// List Skeleton
export const ListSkeleton: React.FC<{ 
  items?: number;
  showAvatar?: boolean;
  showActions?: boolean;
}> = ({ 
  items = 5,
  showAvatar = true,
  showActions = true 
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className="p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              {showAvatar && (
                <Skeleton width={40} height={40} rounded />
              )}
              
              <div className="flex-1 space-y-2">
                <Skeleton height={16} width="60%" />
                <Skeleton height={12} width="80%" />
                <Skeleton height={12} width="40%" />
              </div>
              
              {showActions && (
                <div className="flex space-x-2">
                  <Skeleton width={32} height={32} />
                  <Skeleton width={32} height={32} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Chart Skeleton
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 288 }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse">
        <Skeleton height={20} width="40%" className="mb-4" />
        
        <div className="space-y-2" style={{ height }}>
          {/* Y-axis labels */}
          <div className="flex items-end justify-between h-full">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <Skeleton 
                  height={((index + 1) * 25) % 150 + 50} 
                  width={20} 
                  className="bg-blue-200 dark:bg-blue-800"
                />
                <Skeleton height={12} width={30} />
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center mt-4">
          <Skeleton height={12} width={100} />
        </div>
      </div>
    </div>
  );
};

// Activity List Skeleton
export const ActivityListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <Skeleton height={20} width="40%" className="mb-4" />
      
      <div className="space-y-4">
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4 animate-pulse">
            <Skeleton width={40} height={40} rounded />
            
            <div className="flex-1 space-y-2">
              <Skeleton height={14} width="70%" />
              <Skeleton height={12} width="50%" />
            </div>
            
            <Skeleton height={12} width={60} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;