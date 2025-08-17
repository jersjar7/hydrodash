// components/Sidebar/SidebarHeader.tsx
'use client';

import React, { useState } from 'react';
import { FlowUnit, ThemePref } from '@/types/models/UserPreferences';
import UnitsToggle from '@/components/settings/UnitsToggle';
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
          {/* Action Buttons */}
          {/* Sidebar Toggle */}
            {onSidebarToggle && (
              <SidebarToggle
                isOpen={sidebarOpen}
                onToggle={onSidebarToggle}
                size="md"
                variant="panel"
                className="mr-1"
              />
            )}
          <div className="flex items-center space-x-1">
            {/* Map Button */}
            <button
              onClick={() => onViewChange?.('map')}
              className="p-2 rounded-lg text-white hover:text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 ease-in-out"
              title="View Map"
              aria-label="View map"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
            {/* Settings Button */}
            {showSettings && (
              <button
                onClick={toggleSettings}
                className={`
                  p-2 rounded-lg transition-all duration-200 ease-in-out
                  ${settingsOpen
                    ? 'text-white bg-white/20 hover:bg-white/30'
                    : 'text-white hover:text-gray-200 hover:bg-white/10'
                  }
                  focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent
                `}
                title="Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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