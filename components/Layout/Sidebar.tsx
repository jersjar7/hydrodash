// components/Layout/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import UnitsToggle, { type FlowUnit } from '@/components/settings/UnitsToggle';
import SidebarHeader from '@/components/Sidebar/SidebarHeader';
import SavedPlacesList from '@/components/Sidebar/SavedPlacesList';
import { useSavedPlaces } from '@/hooks/useSavedPlaces';
import { useAppContext } from '@/components/Layout/AppShell';
import type { 
  ActiveLocation, 
  SavedPlace,
  UserPreferences,
  AppView
} from '@/components/Layout/AppShell';
import { 
  isRiverReach, 
  isSavedPlace, 
  getLocationProps 
} from '@/components/Layout/AppShell';

// Updated interface to match what AppShell passes
export interface SidebarProps {
  /** Sidebar open/closed state (no longer used for positioning) */
  isOpen?: boolean;
  /** Callback to toggle sidebar */
  onToggle: () => void;
  /** Saved places list (passed from AppShell but we use hook instead) */
  savedPlaces?: SavedPlace[];
  /** Currently active location (passed from AppShell but we use context instead) */
  activeLocation?: ActiveLocation;
  /** Callback when location is selected (passed from AppShell but we use context instead) */
  onLocationSelect?: (location: SavedPlace) => void;
  /** User preferences */
  preferences?: UserPreferences;
  /** Callback when preferences change */
  onPreferencesChange?: (preferences: UserPreferences) => void;
  /** Custom className */
  className?: string;
  /** Mobile breakpoint behavior */
  isMobile?: boolean;
  /** Current app view */
  currentView?: AppView;
  /** Callback to change view */
  onViewChange?: (view: AppView) => void;
  /** Whether sidebar is open */
  sidebarOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onToggle,
  preferences = { 
    flowUnit: 'CFS', 
    tempUnit: 'F', 
    theme: 'system', 
    savedPlaceIds: [], 
    autoRefresh: true, 
    refreshInterval: 300000, 
    collapsedSidebar: false 
  },
  onPreferencesChange,
  className = '',
  isMobile = false,
  currentView = 'map',
  onViewChange,
  sidebarOpen = false,
}) => {
  // Get app context for activeLocation and setActiveLocation
  const { activeLocation, setActiveLocation, currentView: contextCurrentView, setCurrentView: contextSetCurrentView } = useAppContext();

  // Use props if provided, otherwise fall back to context
  const actualCurrentView = currentView || contextCurrentView;
  const actualSetCurrentView = onViewChange || contextSetCurrentView;

  // Get saved places data from hook
  const {
    places: savedPlaces,
    isLoading: savedPlacesLoading,
    error: savedPlacesError,
    getPlaceCount,
  } = useSavedPlaces();

  // Get standardized location properties for comparison
  const activeLocationProps = getLocationProps(activeLocation || null);

  // Handle preference updates
  const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    if (onPreferencesChange) {
      onPreferencesChange({ ...preferences, [key]: value });
    }
  };

  // Handle saved place selection
  const handlePlaceSelect = (place: SavedPlace) => {
    // Set as active location
    setActiveLocation(place);
    
    // Switch to dashboard view to show the data
    if (actualCurrentView === 'map') {
      actualSetCurrentView('dashboard');
    }
    
    // Close sidebar on mobile after selection
    if (isMobile) {
      onToggle();
    }
  };

  // Handle place editing (placeholder for future implementation)
  const handlePlaceEdit = (place: SavedPlace) => {
    console.log('Edit place:', place.name);
    // TODO: Open edit modal or navigate to edit page
  };

  // Handle add new place
  const handleAddPlace = () => {
    // Switch to map view for place selection
    actualSetCurrentView('map');
    
    // Close sidebar on mobile
    if (isMobile) {
      onToggle();
    }
  };

  // Quick action handlers
  const handleViewOnMap = (place: SavedPlace) => {
    // Set as active location
    setActiveLocation(place);
    
    // Switch to map view
    actualSetCurrentView('map');
    
    // Close sidebar on mobile
    if (isMobile) {
      onToggle();
    }
  };

  // Check if a saved place is currently active
  const isPlaceActive = (place: SavedPlace): boolean => {
    if (!activeLocationProps) return false;
    
    // Direct ID match for saved places
    if (activeLocationProps.id === place.id) return true;
    
    // Match by reachId if both have one
    if (place.reachId && activeLocationProps.reachId === place.reachId) return true;
    
    return false;
  };

  // Get active saved place for highlighting
  const activeSavedPlace = savedPlaces.find(place => isPlaceActive(place)) || null;

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      {/* Use SidebarHeader instead of custom header */}
      <SidebarHeader
        currentView={actualCurrentView}
        onViewChange={actualSetCurrentView}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={onToggle}
        flowUnit={preferences.flowUnit}
        onFlowUnitChange={(unit) => updatePreference('flowUnit', unit)}
        theme={preferences.theme}
        onThemeChange={(theme) => updatePreference('theme', theme)}
        isMobile={isMobile}
      />

      {/* Content area that grows + scrolls */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="p-4 flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <SavedPlacesList
              activePlace={activeSavedPlace}
              flowUnit={preferences.flowUnit}
              onPlaceSelect={handlePlaceSelect}
              onPlaceEdit={handlePlaceEdit}
              onAddPlace={handleAddPlace}
              showAddButton={false}
              showFlowData={true}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-sm flex items-center">
        <div />
        <div className="flex-1" />
        <span className="flex items-center text-green-500">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-1" />
          Live data
        </span>
      </div>
    </div>
  );
};

export default Sidebar;