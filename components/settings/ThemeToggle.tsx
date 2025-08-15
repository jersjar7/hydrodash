// components/settings/ThemeToggle.tsx
'use client';

import React from 'react';

export type ThemePref = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  /** Current theme preference */
  value: ThemePref;
  /** Callback when theme changes */
  onChange: (theme: ThemePref) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  const themes: { value: ThemePref; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ),
    },
    {
      value: 'system',
      label: 'Auto',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`inline-flex ${className}`}>
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {themes.map((theme) => (
          <button
            key={theme.value}
            onClick={() => onChange(theme.value)}
            disabled={disabled}
            className={`
              flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
              ${value === theme.value
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }
              ${disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:bg-white/50 dark:hover:bg-gray-600/50'
              }
            `}
            aria-pressed={value === theme.value}
            aria-label={`Set theme to ${theme.label}`}
            title={`Switch to ${theme.label.toLowerCase()} theme`}
          >
            {theme.icon}
            <span>{theme.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeToggle;