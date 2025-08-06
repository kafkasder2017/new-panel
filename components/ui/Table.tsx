import React, { useState } from 'react';
import { TableSkeleton } from './Skeleton';

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
}

export interface TableProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (record: T) => void;
  className?: string;
  emptyText?: string;
  striped?: boolean;
  hover?: boolean;
  rowClassName?: (record: T) => string;
}

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ current, total, pageSize, onChange }) => {
  const totalPages = Math.ceil(total / pageSize);
  
  if (totalPages <= 1) return null;
  
  const pages = [];
  const startPage = Math.max(1, current - 2);
  const endPage = Math.min(totalPages, current + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return (
    <nav 
      className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
      role="navigation"
      aria-label="Tablo sayfalama"
    >
      <div className="flex items-center">
        <p className="text-sm text-gray-700 dark:text-gray-300" aria-live="polite">
          Toplam <span className="font-medium">{total}</span> kayıt
        </p>
      </div>
      
      <div className="flex items-center space-x-2" role="group" aria-label="Sayfa navigasyonu">
        <button
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          className="px-3 py-1 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Önceki sayfaya git"
        >
          Önceki
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={`px-3 py-1 text-sm rounded-md ${
              page === current
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            aria-label={`Sayfa ${page}${page === current ? ', mevcut sayfa' : ''}`}
            aria-current={page === current ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onChange(current + 1)}
          disabled={current === totalPages}
          className="px-3 py-1 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Sonraki sayfaya git"
        >
          Sonraki
        </button>
      </div>
    </nav>
  );
};

export const Table = <T extends Record<string, any> = Record<string, unknown>>({
  columns,
  data,
  loading = false,
  pagination = false,
  pageSize = 10,
  onRowClick,
  className = '',
  emptyText = 'Kayıt bulunamadı',
  striped = true,
  hover = true,
  rowClassName,
}: TableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };
  
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortColumn];
      const bValue = (b as any)[sortColumn];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);
  
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;
  
  return (
    <div className={`overflow-hidden bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="overflow-x-auto">
        <table 
          className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          role="table"
          aria-label="Veri tablosu"
          aria-rowcount={paginatedData.length + 1}
        >
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr role="row">
              {columns.map((column, index) => (
                <th
                  key={column.key as string}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
                    column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                  } ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key as string)}
                  onKeyDown={(e) => {
                    if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSort(column.key as string);
                    }
                  }}
                  tabIndex={column.sortable ? 0 : -1}
                  role="columnheader"
                  aria-sort={
                    column.sortable && sortColumn === column.key
                      ? sortDirection === 'asc' ? 'ascending' : 'descending'
                      : column.sortable ? 'none' : undefined
                  }
                  aria-colindex={index + 1}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-primary-600" aria-hidden="true">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              Array.from({ length: pageSize }).map((_, index) => (
                <tr key={index} className="animate-pulse" role="row" aria-rowindex={index + 2}>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4" role="cell" aria-colindex={colIndex + 1}>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: colIndex === 0 ? '90%' : colIndex % 2 === 0 ? '70%' : '50%' }}></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr role="row">
                <td colSpan={columns.length} className="px-6 py-8 text-center" role="cell">
                  <div className="text-gray-500 dark:text-gray-400" role="status" aria-live="polite">{emptyText}</div>
                </td>
              </tr>
            ) : (
              paginatedData.map((record, index) => (
                <tr
                  key={index}
                  className={`
                    ${rowClassName ? rowClassName(record) : ''}
                    ${!rowClassName && striped && index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : ''}
                    ${!rowClassName && hover ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick?.(record)}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(record);
                    }
                  }}
                  tabIndex={onRowClick ? 0 : -1}
                  role="row"
                  aria-rowindex={index + 2}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={column.key as string}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${
                        column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                      role="cell"
                      aria-colindex={colIndex + 1}
                    >
                      {column.render
                        ? column.render((record as any)[column.key as string], record)
                        : (record as any)[column.key as string]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <Pagination
          current={currentPage}
          total={data.length}
          pageSize={pageSize}
          onChange={setCurrentPage}
        />
      )}
    </div>
  );
};

// Tipler zaten üstte tanımlandı ve './Table' içinden yeniden export ediliyor.
// Buradaki yeniden-export bildirimi kaldırıldı (duplicate export hatasını önlemek için).
