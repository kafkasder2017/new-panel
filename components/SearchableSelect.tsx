import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface SearchableSelectProps<T> {
    options: T[];
    value: number | string | null;
    onChange: (selectedValue: number | string) => void;
    getOptionValue: (option: T) => number | string;
    getOptionLabel: (option: T) => string;
    placeholder?: string;
}

const SearchableSelect = <T extends {}>({
    options,
    value,
    onChange,
    getOptionValue,
    getOptionLabel,
    placeholder = 'Seçim yapın...'
}: SearchableSelectProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => getOptionValue(opt) === value);
    const displayLabel = selectedOption ? getOptionLabel(selectedOption) : '';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option =>
        getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (option: T) => {
        onChange(getOptionValue(option));
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="mt-1 relative">
                <input
                    type="text"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-sm bg-white dark:bg-zinc-700"
                    onClick={() => setIsOpen(true)}
                    onFocus={() => {
                         setIsOpen(true)
                         setSearchTerm('')
                    }}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        if(!isOpen) setIsOpen(true)
                    }}
                    value={isOpen ? searchTerm : displayLabel}
                    placeholder={placeholder}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
            
            {isOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black dark:ring-zinc-700 ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <li
                                key={index}
                                className="text-zinc-900 dark:text-zinc-200 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-zinc-100 dark:hover:bg-zinc-600"
                                onClick={() => handleSelect(option)}
                            >
                                <span className="font-normal block truncate">
                                    {getOptionLabel(option)}
                                </span>
                                {getOptionValue(option) === value && (
                                     <span className="text-blue-600 absolute inset-y-0 right-0 flex items-center pr-4">
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                )}
                            </li>
                        ))
                    ) : (
                         <li className="text-zinc-500 cursor-default select-none relative py-2 pl-3 pr-9">
                            Sonuç bulunamadı.
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default SearchableSelect;
