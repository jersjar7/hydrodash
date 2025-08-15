// components/Sidebar/SidebarHeader.tsx
'use client';

import React, { useState } from 'react';
import { FlowUnit, ThemePref } from '@/types/models/UserPreferences';
import UnitsToggle from '@/components/settings/UnitsToggle';
import ThemeToggle from '@/components/settings/ThemeToggle';

export type AppView = 'map' | 'dashboard';

interface SidebarHeaderProps {
  /** Current app view */
  currentView?: AppView;
  /** Callback to change view */
  onViewChange?: (view: AppView) => void;
  /** Current flow unit setting */
  flowUnit?: FlowUnit;
  /** Callback when flow unit changes */
  onFlowUnitChange?: (unit: FlowUnit) => void;
  /** Current theme setting */
  theme?: ThemePref;
  /** Callback when theme changes */
  onThemeChange?: (theme: ThemePref) => void;
  /** Show settings panel */
  showSettings?: boolean;
  /** Custom className */
  className?: string;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  currentView = 'map',
  onViewChange,
  flowUnit = 'CFS',
  onFlowUnitChange,
  theme = 'system',
  onThemeChange,
  showSettings = true,
  className = '',
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Toggle settings panel
  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };

  // Handle view change
  const handleViewChange = (view: AppView) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Main Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                HydroDash
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                River Flow Monitor
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => handleViewChange('map')}
                className={`
                  p-1.5 rounded-md transition-all duration-200 text-xs font-medium
                  ${currentView === 'map'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
                title="Map View"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`
                  p-1.5 rounded-md transition-all duration-200 text-xs font-medium
                  ${currentView === 'dashboard'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
                title="Dashboard View"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </button>
            </div>

            {/* Settings Button */}
            {showSettings && (
              <button
                onClick={toggleSettings}
                className={`
                  p-2 rounded-lg transition-colors
                  ${settingsOpen
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && settingsOpen && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Settings
            </h3>

            {/* Flow Units */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Flow Units
              </label>
              <UnitsToggle
                value={flowUnit}
                onChange={onFlowUnitChange || (() => {})}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose your preferred flow measurement unit
              </p>
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme
              </label>
              <ThemeToggle
                value={theme}
                onChange={onThemeChange || (() => {})}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Set your preferred color scheme
              </p>
            </div>

            {/* App Info */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Version 1.0.0</span>
                <span>MVP</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarHeader;