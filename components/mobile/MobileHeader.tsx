// components/mobile/MobileHeader.tsx
'use client';

import React from 'react';
import SidebarToggle from '@/components/Sidebar/SidebarToggle';

export type AppView = 'map' | 'dashboard';

interface MobileHeaderProps {
  /** Current app view */
  currentView?: AppView;
  /** Callback to change view */
  onViewChange?: (view: AppView) => void;
  /** Whether sidebar is open */
  sidebarOpen?: boolean;
  /** Callback to toggle sidebar */
  onSidebarToggle?: () => void;
  /** Current location name */
  locationName?: string;
  /** Show back button */
  showBackButton?: boolean;
  /** Callback for back button */
  onBack?: () => void;
  /** Custom title override */
  title?: string;
  /** Show view toggle */
  showViewToggle?: boolean;
  /** Custom className */
  className?: string;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentView = 'map',
  onViewChange,
  sidebarOpen = false,
  onSidebarToggle,
  locationName,
  showBackButton = false,
  onBack,
  title,
  showViewToggle = true,
  className = '',
  'data-testid': testId,
}) => {
  // Handle view change
  const handleViewChange = (view: AppView) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  // Get page title
  const getPageTitle = () => {
    if (title) return title;
    if (locationName) return locationName;
    return currentView === 'map' ? 'Map' : 'Dashboard';
  };

  return (
    <header 
      className={`
        bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 
        sticky top-0 z-30 lg:hidden
        ${className}
      `}
      data-testid={testId}
    >
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left Section */}
        <div className="flex items-center space-x-3">
          {/* Back Button (when shown) */}
          {showBackButton && onBack ? (
            <button
              onClick={onBack}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            /* Sidebar Toggle (default) */
            onSidebarToggle && (
              <SidebarToggle
                isOpen={sidebarOpen}
                onToggle={onSidebarToggle}
                size="md"
                variant="hamburger"
              />
            )
          )}

          {/* App Logo & Title */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                HydroDash
              </h1>
              {locationName && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                  {locationName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center Section - Page Title */}
        <div className="flex-1 text-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white truncate px-4">
            {getPageTitle()}
          </h2>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          {showViewToggle && onViewChange && (
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => handleViewChange('map')}
                className={`
                  p-2 rounded-md transition-all duration-200
                  ${currentView === 'map'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
                aria-label="Map view"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`
                  p-2 rounded-md transition-all duration-200
                  ${currentView === 'dashboard'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
                aria-label="Dashboard view"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </button>
            </div>
          )}

          {/* Optional Action Button */}
          <button
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="More options"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Optional Breadcrumb/Status Bar */}
      {locationName && currentView === 'dashboard' && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-sm">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-600 dark:text-gray-400">
              Monitoring {locationName}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};

export default MobileHeader;