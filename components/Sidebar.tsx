import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { NAVIGATION_ITEMS, ICONS } from '../constants';
import { NavItem, ProfilData, KullaniciRol } from '../types';
import { CollapsibleNavItem, NavItemLink } from './NavigationItems';
import { signOut } from '../services/auth';
import { logger } from '../utils/logger';
import { handleAsyncError } from '../utils/errorHandler';

interface SidebarProps {
  user: ProfilData;
  onSignOut: () => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onSignOut, isOpen }) => {
  const hasAccess = (item: NavItem) => {
    if (user.rol === KullaniciRol.YONETICI) {
      return true; // Yönetici her şeyi görür
    }
    if (!item.roles || item.roles.length === 0) {
      return true; // Rol tanımlanmamışsa herkese açık
    }
    return item.roles.includes(user.rol as KullaniciRol);
  };
  
  const visibleNavItems = NAVIGATION_ITEMS.map(item => {
    if (!item.subItems) {
      return hasAccess(item) ? item : null;
    }

    const visibleSubItems = item.subItems.filter(hasAccess);
    
    if (visibleSubItems.length > 0) {
      return { ...item, subItems: visibleSubItems };
    }
    
    return hasAccess(item) && item.path !== '#' && visibleSubItems.length === 0 ? item : (visibleSubItems.length > 0 ? { ...item, subItems: visibleSubItems } : null)
  }).filter(Boolean) as NavItem[];

  return (
    <aside 
      className={`w-64 flex-shrink-0 bg-white dark:bg-zinc-900 flex flex-col fixed inset-y-0 left-0 z-50 border-r border-zinc-200 dark:border-zinc-800 transform transition-all duration-200 ease-in-out lg:translate-x-0 shadow-lg lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      role="navigation"
      aria-label="Ana navigasyon"
    >
      <div className="h-16 flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <img 
          src="/kafkasder-logo.png" 
          alt="KAFKASDER Logo" 
          className="h-12 w-auto max-w-[200px] object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
          }}
        />
        <h1 className="text-xl font-bold text-zinc-800 dark:text-white tracking-wider hidden">KAFKASDER</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto" role="menu">
        {visibleNavItems.map((item) => (
          item.subItems ? <CollapsibleNavItem key={item.path} item={item} /> : <NavItemLink key={item.path} item={item} />
        ))}
      </nav>
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <ReactRouterDOM.NavLink to="/profil" className="flex items-center space-x-3 group mb-3">
          <img className="h-10 w-10 rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700 group-hover:ring-blue-500" src={user.profilFotoUrl} alt={user.adSoyad} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-white truncate">{user.adSoyad}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.rol}</p>
          </div>
        </ReactRouterDOM.NavLink>
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
          aria-label="Oturumu kapat"
        >
          {ICONS.LOGOUT}
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;