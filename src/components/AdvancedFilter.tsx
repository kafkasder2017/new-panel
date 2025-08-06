import React, { useState } from 'react';
import { ChevronDownIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FilterOption {
    key: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'number' | 'dateRange' | 'numberRange';
    options?: { value: string; label: string }[];
    placeholder?: string;
    min?: number;
    max?: number;
}

interface AdvancedFilterProps {
    filters: Record<string, any>;
    onFiltersChange: (filters: Record<string, any>) => void;
    filterOptions: FilterOption[];
    onClearAll?: () => void;
    className?: string;
}

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
    filters,
    onFiltersChange,
    filterOptions,
    onClearAll,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);

    React.useEffect(() => {
        const count = Object.values(filters).filter(value => 
            value !== '' && value !== 'all' && value !== null && value !== undefined
        ).length;
        setActiveFiltersCount(count);
    }, [filters]);

    const handleFilterChange = (key: string, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const handleClearAll = () => {
        if (onClearAll) {
            onClearAll();
        } else {
            const clearedFilters = Object.keys(filters).reduce((acc, key) => {
                acc[key] = '';
                return acc;
            }, {} as Record<string, any>);
            onFiltersChange(clearedFilters);
        }
    };

    const renderFilterInput = (option: FilterOption) => {
        const value = filters[option.key] || '';

        switch (option.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        placeholder={option.placeholder || option.label}
                        value={value}
                        onChange={(e) => handleFilterChange(option.key, e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                );

            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => handleFilterChange(option.key, e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">Tümü</option>
                        {option.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={value}
                        onChange={(e) => handleFilterChange(option.key, e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                );

            case 'number':
                return (
                    <input
                        type="number"
                        placeholder={option.placeholder || option.label}
                        value={value}
                        min={option.min}
                        max={option.max}
                        onChange={(e) => handleFilterChange(option.key, e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                );

            case 'dateRange':
                return (
                    <div className="flex gap-2">
                        <input
                            type="date"
                            placeholder="Başlangıç"
                            value={filters[`${option.key}From`] || ''}
                            onChange={(e) => handleFilterChange(`${option.key}From`, e.target.value)}
                            className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                            type="date"
                            placeholder="Bitiş"
                            value={filters[`${option.key}To`] || ''}
                            onChange={(e) => handleFilterChange(`${option.key}To`, e.target.value)}
                            className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                );

            case 'numberRange':
                return (
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Min"
                            value={filters[`${option.key}Min`] || ''}
                            min={option.min}
                            onChange={(e) => handleFilterChange(`${option.key}Min`, e.target.value)}
                            className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                            type="number"
                            placeholder="Max"
                            value={filters[`${option.key}Max`] || ''}
                            max={option.max}
                            onChange={(e) => handleFilterChange(`${option.key}Max`, e.target.value)}
                            className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={`bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg ${className}`}>
            {/* Filter Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                    <FunnelIcon className="w-5 h-5 text-zinc-500" />
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">Gelişmiş Filtreler</span>
                    {activeFiltersCount > 0 && (
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                            {activeFiltersCount} aktif
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                            Temizle
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        {isExpanded ? 'Gizle' : 'Göster'}
                    </button>
                </div>
            </div>

            {/* Filter Content */}
            {isExpanded && (
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filterOptions.map((option) => (
                            <div key={option.key} className="space-y-2">
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {option.label}
                                </label>
                                {renderFilterInput(option)}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedFilter;