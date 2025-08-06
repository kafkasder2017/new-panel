import React from 'react';
import { useTheme } from './ThemeContext';
import { ICONS } from '../constants';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, actualTheme } = useTheme();

  const themes = [
    {
      value: 'light' as const,
      label: 'Açık Tema',
      icon: ICONS.SUN,
    },
    {
      value: 'dark' as const,
      label: 'Koyu Tema',
      icon: ICONS.MOON,
    },
    {
      value: 'system' as const,
      label: 'Sistem',
      icon: ICONS.COMPUTER,
    },
  ];

  return (
    <div className="relative">
      <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
        {themes.map((themeOption) => {
          const isActive = theme === themeOption.value;
          
          return (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`
                flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200
                ${isActive 
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }
              `}
              title={themeOption.label}
              aria-label={themeOption.label}
            >
              <span className="w-4 h-4">{themeOption.icon}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeToggle;