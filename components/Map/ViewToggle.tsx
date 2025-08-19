// components/Map/ViewToggle.tsx
'use client';

import React from 'react';
import { useAppContext } from '@/components/Layout/AppShell';
import type { MapView } from '@/types/models/UserPreferences';

interface ViewToggleProps {
  /** Custom className */
  className?: string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  className = '',
}) => {
  const { userPreferences, setUserPreferences } = useAppContext();
  
  const currentView = userPreferences.mapView || '2D';
  const is3D = currentView === '3D';

  // Toggle between 2D and 3D
  const handleToggle = () => {
    const newView: MapView = is3D ? '2D' : '3D';
    setUserPreferences({
      ...userPreferences,
      mapView: newView,
    });
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg
        text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white
        border border-gray-200 dark:border-gray-700
        transition-all duration-200 hover:shadow-xl
        flex items-center gap-2 min-w-[80px]
        ${is3D ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
        ${className}
      `}
      aria-label={`Switch to ${is3D ? '2D' : '3D'} view`}
      title={`Current: ${currentView} view - Click to switch to ${is3D ? '2D' : '3D'}`}
    >
      {/* Icon changes based on current view */}
      <span className="text-lg">
        {is3D ? '📐' : '🗻'}
      </span>
      
      {/* Label */}
      <span className="text-sm font-medium hidden sm:block">
        {currentView}
      </span>
      
      {/* Visual indicator for 3D mode */}
      {is3D && (
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
    </button>
  );
};

export default ViewToggle;