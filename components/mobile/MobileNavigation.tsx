// components/mobile/MobileNavigation.tsx
'use client';

import React from 'react';
import { useAppContext } from '@/components/Layout/AppShell';

interface MobileNavigationProps {
  /** Custom className */
  className?: string;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  className = '',
  'data-testid': testId,
}) => {
  const { 
    currentView, 
    setCurrentView, 
    isMobile, 
    activeLocation,
    sidebarOpen,
    setSidebarOpen 
  } = useAppContext();

  // Only render on mobile devices
  if (!isMobile) {
    return null;
  }

  // Handle return to map (only available when in dashboard with selected location)
  const handleMapNavigation = () => {
    setCurrentView('map');
  };

  // Handle saved places / sidebar toggle
  const handleSavedPlacesToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
        border-t border-gray-200 dark:border-gray-700
        safe-area-inset-bottom
        ${className}
      `}
      data-testid={testId}
    >
      <div className="flex justify-center items-center h-16 px-4">
        <div className="flex space-x-8 max-w-md w-full justify-center">
          
          {/* Map Button - Always available */}
          <button
            onClick={handleMapNavigation}
            className={`
              flex flex-col items-center justify-center
              min-w-[64px] min-h-[48px] px-3 py-2 rounded-lg
              transition-all duration-200 ease-in-out
              touch-manipulation
              ${currentView === 'map'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }
            `}
            aria-label="View map"
            role="tab"
            aria-selected={currentView === 'map'}
          >
            {/* Map Icon */}
            <svg 
              className={`w-6 h-6 mb-1 transition-colors ${
                currentView === 'map' ? 'text-blue-600 dark:text-blue-400' : 'text-current'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={currentView === 'map' ? 2.5 : 2} 
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
              />
            </svg>
            <span 
              className={`text-xs font-medium ${
                currentView === 'map' ? 'font-semibold' : ''
              }`}
            >
              Map
            </span>
          </button>

          {/* Saved Places Button - Opens sidebar */}
          <button
            onClick={handleSavedPlacesToggle}
            className={`
              flex flex-col items-center justify-center
              min-w-[64px] min-h-[48px] px-3 py-2 rounded-lg
              transition-all duration-200 ease-in-out
              touch-manipulation
              ${sidebarOpen
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }
            `}
            aria-label="View saved places"
            role="tab"
            aria-selected={sidebarOpen}
          >
            {/* Saved Places Icon */}
            <svg 
              className={`w-6 h-6 mb-1 transition-colors ${
                sidebarOpen ? 'text-blue-600 dark:text-blue-400' : 'text-current'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={sidebarOpen ? 2.5 : 2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={sidebarOpen ? 2.5 : 2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
            <span 
              className={`text-xs font-medium ${
                sidebarOpen ? 'font-semibold' : ''
              }`}
            >
              Places
            </span>
          </button>

          {/* Dashboard Indicator - Shows current location when in dashboard view */}
          {currentView === 'dashboard' && activeLocation && (
            <div
              className="
                flex flex-col items-center justify-center
                min-w-[64px] min-h-[48px] px-3 py-2 rounded-lg
                bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400
                transition-all duration-200 ease-in-out
              "
              role="status"
              aria-label={`Viewing dashboard for ${activeLocation.name}`}
            >
              {/* Dashboard Icon */}
              <svg 
                className="w-6 h-6 mb-1 text-green-600 dark:text-green-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
                />
              </svg>
              <span className="text-xs font-semibold truncate max-w-16">
                {activeLocation.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Location Status Bar - Shows current context */}
      {(currentView === 'dashboard' && activeLocation) && (
        <div className="px-4 py-2 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-center space-x-2 text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Monitoring {activeLocation.name}
            </span>
          </div>
        </div>
      )}

      {/* Safe area spacing for devices with home indicators */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
};

export default MobileNavigation;