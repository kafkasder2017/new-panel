import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { ICONS } from '../../constants/icons';
import ThemeToggle from '../../components/ThemeToggle';

interface HeaderProps {
  unreadCount: number;
  title: string;
  onMenuClick: () => void;
  onSmartSearch: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ unreadCount, title, onMenuClick, onSmartSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSmartSearch(searchQuery.trim());
      setSearchQuery('');
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between px-6 lg:px-8 fixed top-0 left-0 right-0 z-40 lg:left-64 shadow-sm">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onMenuClick} 
          className="lg:hidden p-2 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors duration-200" 
          aria-label="Menüyü aç"
        >
          {ICONS.menu}
        </button>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
      </div>
      
      {/* Smart Search */}
      <div className="flex-1 px-4 lg:px-8 max-w-xl">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="w-5 h-5 text-zinc-400">{ICONS.search}</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Akıllı Arama (örn: 'Ankara'daki aktif gönüllüler')"
              className="block w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-full py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
              aria-label="Akıllı arama"
              role="searchbox"
            />
          </div>
        </form>
      </div>
      
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        <ReactRouterDOM.NavLink 
          to="/bildirimler" 
          className="relative p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          aria-label={`Bildirimler ${unreadCount > 0 ? `(${unreadCount} okunmamış)` : ''}`}
        >
          {ICONS.bell}
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
        </ReactRouterDOM.NavLink>
        <ReactRouterDOM.NavLink 
          to="/ayarlar/genel" 
          className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          aria-label="Ayarlar"
        >
          {ICONS.settings}
        </ReactRouterDOM.NavLink>
      </div>
    </header>
  );
};