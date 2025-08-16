// components/mobile/MobileHeader.tsx
'use client';

import React from 'react';
import SidebarToggle from '@/components/Sidebar/SidebarToggle';

export type AppView = 'map' | 'dashboard';

interface MobileHeaderProps {
  /** Current app view */
  currentView?: AppView;
  /** Callback to return to map view */
  onReturnToMap?: () => void;
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
  /** Custom className */
  className?: string;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentView = 'map',
  onReturnToMap,
  sidebarOpen = false,
  onSidebarToggle,
  locationName,
  showBackButton = false,
  onBack,
  title,
  className = '',
  'data-testid': testId,
}) => {
  // Get page title based on context
  const getPageTitle = () => {
    if (title) return title;
    if (currentView === 'dashboard' && locationName) return locationName;
    return currentView === 'map' ? 'HydroDash' : 'Dashboard';
  };

  // Get subtitle for context
  const getSubtitle = () => {
    if (currentView === 'dashboard' && locationName) {
      return 'Dashboard';
    }
    return null;
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
          {/* Back Button or Sidebar Toggle */}
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

          {/* App Logo (only show on map view or when no location) */}
          {(currentView === 'map' || !locationName) && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Center Section - Title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate px-4">
            {getPageTitle()}
          </h1>
          {getSubtitle() && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getSubtitle()}
            </p>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Return to Map Button (only show in dashboard view) */}
          {currentView === 'dashboard' && onReturnToMap && (
            <button
              onClick={onReturnToMap}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Return to map"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
          )}

          {/* More Options Menu */}
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

      {/* Status Bar for Dashboard View */}
      {locationName && currentView === 'dashboard' && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-600 dark:text-gray-400">
                Monitoring location
              </span>
            </div>
            
            {/* Live data indicator */}
            <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live data</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default MobileHeader;