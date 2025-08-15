// components/Layout/DashboardPanel.tsx
'use client';

import React from 'react';
import LoadingSpinner, { DashboardLoadingSpinner } from '@/components/common/LoadingSpinner';
import ResponsiveContainer from '@/components/common/ResponsiveContainer';

export type GridLayout = 'auto' | 'fixed' | 'masonry';
export type GridSize = 'sm' | 'md' | 'lg';

interface DashboardPanelProps {
  /** Widget children */
  children?: React.ReactNode;
  /** Dashboard header content */
  header?: React.ReactNode;
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
  showAddButton?: boolean;
  /** Add widget callback */
  onAddWidget?: () => void;
  /** Empty state content */
  emptyState?: React.ReactNode;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({
  children,
  header,
  loading = false,
  error,
  layout = 'auto',
  gridSize = 'md',
  className = '',
  showAddButton = true,
  onAddWidget,
  emptyState,
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

  // Check if we have any widgets
  const hasWidgets = React.Children.count(children) > 0;

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
            <p className="text-gray-600 dark:text-gray-300">
              {error}
            </p>
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

  return (
    <div className={`h-full overflow-y-auto ${className}`}>
      <ResponsiveContainer maxWidth="7xl" padding="lg" center>
        {/* Dashboard Header */}
        {header && (
          <div className="mb-6">
            {header}
          </div>
        )}

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
              No Widgets Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              Add widgets to create your personalized river monitoring dashboard.
            </p>
            {showAddButton && (
              <button
                onClick={onAddWidget}
                className="
                  inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 
                  text-white font-medium rounded-lg transition-colors
                "
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Widget
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
            {showAddButton && (
              <button
                onClick={onAddWidget}
                className="
                  fixed bottom-6 right-6 z-20
                  w-14 h-14 bg-blue-600 hover:bg-blue-700 
                  text-white rounded-full shadow-lg hover:shadow-xl
                  transition-all duration-200 hover:scale-105
                  flex items-center justify-center
                "
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