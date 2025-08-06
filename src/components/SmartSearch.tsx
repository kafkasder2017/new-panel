import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, SparklesIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../services/geminiService';

interface SearchSuggestion {
    id: string;
    text: string;
    type: 'recent' | 'suggestion' | 'smart';
    path?: string;
    filters?: Record<string, unknown>;
}

interface SmartSearchProps {
    placeholder?: string;
    onSearch?: (query: string) => void;
    className?: string;
    showSuggestions?: boolean;
    recentSearches?: string[];
    onRecentSearchesChange?: (searches: string[]) => void;
    filters?: Record<string, unknown>;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
    placeholder = "Akıllı arama... (örn: 'Ahmet adlı kişiyi bul', 'Bu ay yapılan bağışlar')",
    onSearch,
    className = '',
    showSuggestions = true,
    recentSearches = [],
    onRecentSearchesChange
}) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Varsayılan öneriler
    const defaultSuggestions: SearchSuggestion[] = [
        { id: '1', text: 'Bu ay yapılan bağışlar', type: 'suggestion', path: '/bagis-yonetimi/tum-bagislar', filters: { dateRange: 'thisMonth' } },
        { id: '2', text: 'Bekleyen yardım başvuruları', type: 'suggestion', path: '/yardimlar', filters: { status: 'Bekliyor' } },
        { id: '3', text: 'Aktif gönüllüler', type: 'suggestion', path: '/gonulluler', filters: { status: 'Aktif' } },
        { id: '4', text: 'Tamamlanmış projeler', type: 'suggestion', path: '/projeler', filters: { status: 'Tamamlandı' } },
        { id: '5', text: 'Yüksek öncelikli başvurular', type: 'suggestion', path: '/yardimlar', filters: { priority: 'Yüksek' } }
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (query.length > 2 && showSuggestions) {
            generateSuggestions();
        } else {
            setSuggestions(getDefaultSuggestions());
        }
    }, [query]);

    const getDefaultSuggestions = (): SearchSuggestion[] => {
        const recent = recentSearches.slice(0, 3).map((search, index) => ({
            id: `recent-${index}`,
            text: search,
            type: 'recent' as const
        }));
        
        return [...recent, ...defaultSuggestions.slice(0, 5 - recent.length)];
    };

    const generateSuggestions = async () => {
        try {
            setIsLoading(true);
            
            // Gemini servisini kullanarak akıllı öneriler oluştur
            const smartResult = await geminiService.processSmartSearch(query);
            
            const smartSuggestions: SearchSuggestion[] = [];
            
            if (smartResult) {
                smartSuggestions.push({
                    id: 'smart-1',
                    text: `${query} - ${smartResult.explanation}`,
                    type: 'smart',
                    path: smartResult.path,
                    filters: smartResult.filters
                });
            }

            // Basit metin eşleştirme önerileri
            const textSuggestions = defaultSuggestions.filter(s => 
                s.text.toLowerCase().includes(query.toLowerCase())
            );

            setSuggestions([...smartSuggestions, ...textSuggestions.slice(0, 4)]);
        } catch (error) {
            console.error('Öneri oluşturma hatası:', error);
            setSuggestions(getDefaultSuggestions());
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (searchQuery?: string) => {
        const finalQuery = searchQuery || query;
        if (!finalQuery.trim()) return;

        setIsLoading(true);
        
        try {
            // Arama geçmişine ekle
            if (onRecentSearchesChange && !recentSearches.includes(finalQuery)) {
                const newRecentSearches = [finalQuery, ...recentSearches.slice(0, 9)];
                onRecentSearchesChange(newRecentSearches);
            }

            // Akıllı arama işlemi
            const smartResult = await geminiService.processSmartSearch(finalQuery);
            
            if (smartResult && smartResult.path) {
                // Akıllı sonuç varsa yönlendir
                const searchParams = new URLSearchParams();
                if (smartResult.filters) {
                    Object.entries(smartResult.filters).forEach(([key, value]) => {
                        searchParams.set(key, value.toString());
                    });
                }
                
                const url = smartResult.path + (searchParams.toString() ? `?${searchParams.toString()}` : '');
                navigate(url);
            } else if (onSearch) {
                // Fallback olarak normal arama
                onSearch(finalQuery);
            }
        } catch (error) {
            console.error('Arama hatası:', error);
            if (onSearch) {
                onSearch(finalQuery);
            }
        } finally {
            setIsLoading(false);
            setShowDropdown(false);
        }
    };

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        if (suggestion.path) {
            const searchParams = new URLSearchParams();
            if (suggestion.filters) {
                Object.entries(suggestion.filters).forEach(([key, value]) => {
                    searchParams.set(key, value.toString());
                });
            }
            
            const url = suggestion.path + (searchParams.toString() ? `?${searchParams.toString()}` : '');
            navigate(url);
        } else {
            setQuery(suggestion.text);
            handleSearch(suggestion.text);
        }
        setShowDropdown(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSuggestionClick(suggestions[selectedIndex]);
                } else {
                    handleSearch();
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setSelectedIndex(-1);
                break;
        }
    };

    const removeRecentSearch = (searchToRemove: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRecentSearchesChange) {
            const newRecentSearches = recentSearches.filter(s => s !== searchToRemove);
            onRecentSearchesChange(newRecentSearches);
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    ) : (
                        <MagnifyingGlassIcon className="h-5 w-5 text-zinc-400" />
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Dropdown */}
            {showDropdown && showSuggestions && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {suggestions.length > 0 ? (
                        <div className="py-2">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={suggestion.id}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className={`px-4 py-3 cursor-pointer flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-700 ${
                                        index === selectedIndex ? 'bg-zinc-50 dark:bg-zinc-700' : ''
                                    }`}
                                >
                                    <div className="flex-shrink-0">
                                        {suggestion.type === 'recent' && (
                                            <ClockIcon className="w-4 h-4 text-zinc-400" />
                                        )}
                                        {suggestion.type === 'smart' && (
                                            <SparklesIcon className="w-4 h-4 text-blue-500" />
                                        )}
                                        {suggestion.type === 'suggestion' && (
                                            <MagnifyingGlassIcon className="w-4 h-4 text-zinc-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                            {suggestion.text}
                                        </p>
                                        {suggestion.type === 'smart' && (
                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                Akıllı Arama
                                            </p>
                                        )}
                                    </div>
                                    {suggestion.type === 'recent' && (
                                        <button
                                            onClick={(e) => removeRecentSearch(suggestion.text, e)}
                                            className="flex-shrink-0 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                            Öneri bulunamadı
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SmartSearch;