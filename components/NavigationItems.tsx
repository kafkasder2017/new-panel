import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { NavItem } from '../types';
import { ICONS } from '../constants';

interface CollapsibleNavItemProps {
  item: NavItem;
}

interface NavItemLinkProps {
  item: NavItem;
  isSubItem?: boolean;
}

export const CollapsibleNavItem: React.FC<CollapsibleNavItemProps> = ({ item }) => {
  const location = ReactRouterDOM.useLocation();
  const isParentActive = item.subItems?.some(sub => location.pathname.startsWith(sub.path)) ?? false;
  const [isOpen, setIsOpen] = useState(isParentActive);

  useEffect(() => {
    if (isParentActive) {
      setIsOpen(true);
    }
  }, [location.pathname, isParentActive]);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors duration-200 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 ${
          isParentActive ? 'text-zinc-900 dark:text-zinc-100' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
          <span className="font-medium text-sm">{item.name}</span>
        </div>
        <span className={`transform transition-transform duration-200 text-zinc-400 dark:text-zinc-500 ${isOpen ? 'rotate-180' : ''}`}>
          {ICONS.CHEVRON_DOWN}
        </span>
      </button>
      {isOpen && (
        <div className="pt-2 pl-4 space-y-1 border-l ml-5 border-zinc-200 dark:border-zinc-700">
          {item.subItems?.map(subItem => (
            <NavItemLink key={subItem.path} item={subItem} isSubItem={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export const NavItemLink: React.FC<NavItemLinkProps> = ({ item, isSubItem }) => {
  return (
    <ReactRouterDOM.NavLink
      to={item.path}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 text-sm ${
          isActive
            ? 'font-semibold bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-white'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
        } ${isSubItem ? 'font-normal' : 'font-medium'}`
      }
    >
      {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
      <span>{item.name}</span>
    </ReactRouterDOM.NavLink>
  );
};