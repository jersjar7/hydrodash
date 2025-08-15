// components/Dashboard/DashboardGrid.tsx
'use client';

import React, { forwardRef } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export type GridLayout = 'auto' | 'fixed' | 'masonry' | 'compact';
export type GridSize = 'sm' | 'md' | 'lg' | 'xl';
export type GridGap = 'sm' | 'md' | 'lg';

interface DashboardGridProps {
  /** Widget children to display in grid */
  children?: React.ReactNode;
  /** Grid layout strategy */
  layout?: GridLayout;
  /** Grid size variant affecting columns */
  size?: GridSize;
  /** Gap between grid items */
  gap?: GridGap;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Enable scroll container */
  scrollable?: boolean;
  /** Maximum height for scroll container */
  maxHeight?: string;
  /** Custom className */
  className?: string;
  /** Minimum column width for auto layout */
  minColumnWidth?: string;
  /** Enable smooth transitions for layout changes */
  animated?: boolean;
  /** Custom data attribute for testing/drag-drop */
  'data-testid'?: string;
}

const DashboardGrid = forwardRef<HTMLDivElement, DashboardGridProps>(({
  children,
  layout = 'auto',
  size = 'md',
  gap = 'md',
  loading = false,
  error,
  scrollable = true,
  maxHeight = 'calc(100vh - 200px)',
  className = '',
  minColumnWidth = '320px',
  animated = true,
  'data-testid': testId,
}, ref) => {
  // Grid layout classes based on layout type and size
  const getGridClasses = () => {
    const baseClasses = 'grid w-full';
    
    switch (layout) {
      case 'auto':
        // Auto-fit layout that responds to content
        return `${baseClasses} grid-cols-[repeat(auto-fit,minmax(${minColumnWidth},1fr))]`;
        
      case 'fixed':
        // Fixed column counts by size
        const fixedCols = {
          sm: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          md: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          lg: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
          xl: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
        };
        return `${baseClasses} ${fixedCols[size]}`;
        
      case 'compact':
        // Compact layout with smaller widgets
        const compactCols = {
          sm: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
          md: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
          lg: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
          xl: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7',
        };
        return `${baseClasses} ${compactCols[size]}`;
        
      case 'masonry':
        // Masonry-style columns (CSS columns)
        const masonryCols = {
          sm: 'columns-1 sm:columns-2',
          md: 'columns-1 sm:columns-2 lg:columns-3',
          lg: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4',
          xl: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5',
        };
        // Note: masonry uses CSS columns instead of grid
        return `w-full ${masonryCols[size]}`;
        
      default:
        return baseClasses;
    }
  };

  // Gap classes
  const getGapClasses = () => {
    if (layout === 'masonry') {
      // CSS columns use column-gap and break-inside
      const columnGaps = {
        sm: 'gap-3',
        md: 'gap-4', 
        lg: 'gap-6',
      };
      return columnGaps[gap];
    }
    
    // Grid gap classes
    const gridGaps = {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
    };
    return gridGaps[gap];
  };

  // Animation classes
  const getAnimationClasses = () => {
    if (!animated) return '';
    return 'transition-all duration-300 ease-in-out';
  };

  // Build container classes
  const containerClasses = [
    scrollable ? 'overflow-y-auto overflow-x-hidden' : '',
    animated ? 'transition-all duration-300 ease-in-out' : '',
    'relative',
    className,
  ].filter(Boolean).join(' ');

  // Build grid classes
  const gridClasses = [
    getGridClasses(),
    getGapClasses(),
    getAnimationClasses(),
    layout === 'masonry' ? '' : 'auto-rows-max', // Let grid rows size to content
  ].filter(Boolean).join(' ');

  // Loading state
  if (loading) {
    return (
      <div 
        ref={ref}
        className={`flex items-center justify-center p-8 ${className}`}
        data-testid={testId ? `${testId}-loading` : undefined}
      >
        <LoadingSpinner 
          size="lg" 
          variant="pulse" 
          color="primary" 
          text="Loading widgets..." 
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        ref={ref}
        className={`flex items-center justify-center p-8 ${className}`}
        data-testid={testId ? `${testId}-error` : undefined}
      >
        <div className="text-center">
          <div className="text-red-500 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Dashboard Error
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // Check if we have any widgets
  const hasWidgets = React.Children.count(children) > 0;

  // Empty state
  if (!hasWidgets) {
    return (
      <div 
        ref={ref}
        className={`flex items-center justify-center p-8 ${className}`}
        data-testid={testId ? `${testId}-empty` : undefined}
      >
        <div className="text-center max-w-sm">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No widgets added
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add some widgets to see your data visualizations here
          </p>
        </div>
      </div>
    );
  }

  // Main grid container
  return (
    <div 
      ref={ref}
      className={containerClasses}
      style={scrollable ? { maxHeight } : undefined}
      data-testid={testId}
    >
      <div className={gridClasses}>
        {layout === 'masonry' 
          ? React.Children.map(children, (child, index) => (
              <div 
                key={index} 
                className="break-inside-avoid mb-4"
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
              >
                {child}
              </div>
            ))
          : children
        }
      </div>
    </div>
  );
});

DashboardGrid.displayName = 'DashboardGrid';

export default DashboardGrid;