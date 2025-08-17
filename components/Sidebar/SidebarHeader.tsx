// components/Sidebar/SidebarHeader.tsx
'use client';

import React, { useState } from 'react';
import { FlowUnit, ThemePref } from '@/types/models/UserPreferences';
import UnitsToggle from '@/components/settings/UnitsToggle';
import ThemeToggle from '@/components/settings/ThemeToggle';
import SidebarToggle from '@/components/Sidebar/SidebarToggle';

export type AppView = 'map' | 'dashboard';

interface SidebarHeaderProps {
  /** Current app view */
  currentView?: AppView;
  /** Callback to change view */
  onViewChange?: (view: AppView) => void;
  /** Whether sidebar is open */
  sidebarOpen?: boolean;
  /** Callback to toggle sidebar */
  onSidebarToggle?: () => void;
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
  /** Mobile breakpoint */
  isMobile?: boolean;
  /** Custom className */
  className?: string;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  currentView = 'map',
  onViewChange,
  sidebarOpen = false,
  onSidebarToggle,
  flowUnit = 'CFS',
  onFlowUnitChange,
  theme = 'system',
  onThemeChange,
  showSettings = true,
  isMobile = false,
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
            {/* Sidebar Toggle - NEW */}
            {onSidebarToggle && (
              <SidebarToggle
                isOpen={sidebarOpen}
                onToggle={onSidebarToggle}
                size="sm"
                variant="hamburger"
                className="mr-1"
              />
            )}

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

            {/* Map Button */}
            <button
              onClick={() => onViewChange?.('map')}
              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              title="View Map"
              aria-label="View map"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
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