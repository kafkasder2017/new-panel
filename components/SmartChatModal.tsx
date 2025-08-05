

import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';

import Modal from './Modal';
import { SmartSearchResult } from '../types';
import { getNavigationForQuery } from '../services/geminiService';

const SmartChatModal: React.FC<{ query: string; onClose: () => void; }> = ({ query, onClose }) => {
    const [result, setResult] = useState<SmartSearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = ReactRouterDOM.useNavigate();

    useEffect(() => {
        const performSearch = async () => {
            setIsLoading(true);
            setError('');
            try {
                const searchResult = await getNavigationForQuery(query);
                setResult(searchResult);
            } catch (err: any) {
                setError(err.message || 'Bir hata oluştu.');
            } finally {
                setIsLoading(false);
            }
        };
        performSearch();
    }, [query]);
    
    const handleNavigate = () => {
        if (result?.path) {
            // Future improvement: pass filters via state or query params
            navigate(result.path);
            onClose();
            toast.success(`'${result.path}' sayfasına yönlendirildi.`);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Akıllı Arama: "${query}"`}>
            {isLoading && (
                <div className="text-center p-8">
                    <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-zinc-600 dark:text-zinc-400">Yorumlanıyor...</p>
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                    <p className="font-bold">Hata!</p>
                    <p>{error}</p>
                </div>
            )}
            {result && (
                <div className="space-y-4">
                    <div className="p-4 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">Anlaşılan Eylem:</p>
                        <p className="text-blue-600 dark:text-blue-400">{result.explanation}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-500">Hedef Sayfa:</p>
                        <p className="font-mono bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded-md inline-block">{result.path}</p>
                    </div>
                    {result.filters && Object.keys(result.filters).length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-zinc-500">Uygulanacak Filtreler:</p>
                            <ul className="list-disc list-inside mt-1">
                                {Object.entries(result.filters).map(([key, value]) => (
                                    <li key={key} className="text-sm text-zinc-700 dark:text-zinc-300">
                                        <strong className="font-semibold">{key}:</strong> {value as string}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-zinc-400 mt-2">(Not: Filtre uygulama özelliği henüz geliştirilmektedir.)</p>
                        </div>
                    )}
                    <div className="pt-4 flex justify-end items-center gap-4">
                        <button onClick={onClose} type="button" className="bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-lg font-semibold border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600">
                            İptal
                        </button>
                        <button onClick={handleNavigate} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2">
                            Sayfaya Git
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default SmartChatModal;