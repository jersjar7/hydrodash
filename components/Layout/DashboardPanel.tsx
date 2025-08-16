// components/Layout/DashboardPanel.tsx
'use client';

import React, { createContext, useContext } from 'react';
import LoadingSpinner, { DashboardLoadingSpinner } from '@/components/common/LoadingSpinner';
import ResponsiveContainer from '@/components/common/ResponsiveContainer';
import { SavedPlace } from '@/types/models/SavedPlace';
import { ReachId } from '@/types/models/RiverReach';

// Define StreamMetadata interface locally (matches StreamPopup.tsx)
interface StreamMetadata {
  reachId: ReachId;
  name?: string;
  description?: string;
  lat?: number;
  lon?: number;
  streamOrder?: string;
  drainageArea?: number;
  gaugeId?: string;
  lastUpdated?: string;
}

export type GridLayout = 'auto' | 'fixed' | 'masonry';
export type GridSize = 'sm' | 'md' | 'lg';

// Context for providing active stream data to child widgets
interface DashboardContextType {
  activeLocation?: SavedPlace | null;
  selectedStream?: StreamMetadata | null;
  reachId?: string | null;
}

const DashboardContext = createContext<DashboardContextType>({});

// Hook for widgets to access current stream data
export const useDashboardContext = () => {
  return useContext(DashboardContext);
};

interface DashboardPanelProps {
  /** Widget children */
  children?: React.ReactNode;
  /** Dashboard header content */
  header?: React.ReactNode;
  /** Currently active location from saved places */
  activeLocation?: SavedPlace | null;
  /** Selected stream data from map modal */
  selectedStream?: StreamMetadata | null;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Grid layout type */
  layout?: GridLayout;
  /** Grid size variant */
  gridSize?: GridSize;
  /** Custom className */
  className?: string;
  /** Show add widget button */
  showAddWidget?: boolean;
  /** Add widget callback */
  onAddWidget?: () => void;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Callback when no location is selected (fallback to map) */
  onReturnToMap?: () => void;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({
  children,
  header,
  activeLocation,
  selectedStream,
  loading = false,
  error,
  layout = 'auto',
  gridSize = 'md',
  className = '',
  showAddWidget = true,
  onAddWidget,
  emptyState,
  onReturnToMap,
}) => {
  // Grid layout classes
  const gridClasses = {
    auto: {
      sm: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
      md: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
      lg: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    },
    fixed: {
      sm: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
      md: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
      lg: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    },
    masonry: {
      sm: 'columns-1 md:columns-2 xl:columns-3',
      md: 'columns-1 lg:columns-2 xl:columns-3 2xl:columns-4',
      lg: 'columns-1 md:columns-2 lg:columns-3 xl:columns-4',
    },
  };

  // Gap classes
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  // Determine the effective reach ID for data fetching
  const reachId = selectedStream?.reachId || activeLocation?.reachId || null;
  
  // Get location name for display
  const locationName = selectedStream?.name || activeLocation?.name || null;

  // Check if we have any widgets
  const hasWidgets = React.Children.count(children) > 0;

  // Check if we have a valid location/stream selected
  const hasValidLocation = !!(reachId && locationName);

  // Dashboard context value
  const dashboardContextValue: DashboardContextType = {
    activeLocation,
    selectedStream,
    reachId,
  };

  // Error state
  if (error) {
    return (
      <ResponsiveContainer maxWidth="7xl" padding="lg" center className={className}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Dashboard Error
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error}
            </p>
            {onReturnToMap && (
              <button
                onClick={onReturnToMap}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                Return to Map
              </button>
            )}
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`relative h-full ${className}`}>
        <DashboardLoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  // No location selected state - This shouldn't happen in new navigation flow but good fallback
  if (!hasValidLocation) {
    return (
      <ResponsiveContainer maxWidth="7xl" padding="lg" center className={className}>
        <div className="flex flex-col items-center justify-center min-h-96 text-center">
          <div className="text-gray-400 mb-6">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Location Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            Select a stream from the map or choose a saved place to view its dashboard.
          </p>
          {onReturnToMap && (
            <button
              onClick={onReturnToMap}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Browse Map
            </button>
          )}
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <DashboardContext.Provider value={dashboardContextValue}>
      <div className={`h-full overflow-y-auto ${className}`}>
        <ResponsiveContainer maxWidth="7xl" padding="lg" center>
          {/* Dashboard Header with Location Info */}
          <div className="mb-6">
            {/* Location Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {locationName}
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>ID: {reachId}</span>
                    {activeLocation?.isPrimary && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">Primary Location</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {onReturnToMap && (
                <button
                  onClick={onReturnToMap}
                  className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-sm">Back to Map</span>
                </button>
              )}
            </div>

            {/* Custom Header Content */}
            {header && (
              <div>
                {header}
              </div>
            )}
          </div>

          {/* Empty State */}
          {!hasWidgets && emptyState && (
            <div className="flex items-center justify-center min-h-96">
              {emptyState}
            </div>
          )}

          {/* Default Empty State */}
          {!hasWidgets && !emptyState && (
            <div className="flex flex-col items-center justify-center min-h-96 text-center">
              <div className="text-gray-400 mb-6">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Add Widgets to Get Started
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Create your personalized dashboard for <strong>{locationName}</strong> by adding widgets to monitor flow, weather, and environmental conditions.
              </p>
              {showAddWidget && onAddWidget && (
                <button
                  onClick={onAddWidget}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Your First Widget
                </button>
              )}
            </div>
          )}

          {/* Widget Grid */}
          {hasWidgets && (
            <>
              <div 
                className={`
                  ${layout === 'masonry' ? '' : 'grid'}
                  ${gridClasses[layout][gridSize]}
                  ${gapClasses[gridSize]}
                  ${layout === 'masonry' ? 'space-y-4' : ''}
                `}
              >
                {children}
              </div>

              {/* Add Widget Button (Floating) */}
              {showAddWidget && onAddWidget && (
                <button
                  onClick={onAddWidget}
                  className="fixed bottom-6 right-6 z-20 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center"
                  aria-label="Add new widget"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              )}
            </>
          )}
        </ResponsiveContainer>
      </div>
    </DashboardContext.Provider>
  );
};

// Specialized dashboard variants
export const CompactDashboard: React.FC<Omit<DashboardPanelProps, 'gridSize' | 'layout'>> = (props) => (
  <DashboardPanel {...props} gridSize="sm" layout="fixed" />
);

export const ExpandedDashboard: React.FC<Omit<DashboardPanelProps, 'gridSize' | 'layout'>> = (props) => (
  <DashboardPanel {...props} gridSize="lg" layout="auto" />
);

export const MasonryDashboard: React.FC<Omit<DashboardPanelProps, 'layout'>> = (props) => (
  <DashboardPanel {...props} layout="masonry" />
);

export default DashboardPanel;