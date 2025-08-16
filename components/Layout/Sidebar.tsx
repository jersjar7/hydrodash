// components/Layout/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import UnitsToggle, { type FlowUnit } from '@/components/settings/UnitsToggle';
import ThemeToggle, { type ThemePref } from '@/components/settings/ThemeToggle';
import SavedPlacesList from '@/components/Sidebar/SavedPlacesList';
import { useSavedPlaces } from '@/hooks/useSavedPlaces';
import { useAppContext } from '@/components/Layout/AppShell';
import type { 
  ActiveLocation, 
  SavedPlace,
  UserPreferences
} from '@/components/Layout/AppShell';
import { 
  isRiverReach, 
  isSavedPlace, 
  getLocationProps 
} from '@/components/Layout/AppShell';

// Updated interface to match what AppShell passes
export interface SidebarProps {
  /** Sidebar open/closed state */
  isOpen: boolean;
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
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
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
}) => {
  const [activeSection, setActiveSection] = useState<'places' | 'settings'>('places');

  // Get app context for activeLocation and setActiveLocation
  const { activeLocation, setActiveLocation, currentView, setCurrentView } = useAppContext();

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
    if (currentView === 'map') {
      setCurrentView('dashboard');
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
    setCurrentView('map');
    
    // Close sidebar on mobile
    if (isMobile) {
      onToggle();
    }
  };

  // NEW: Handle return to map view (new navigation requirement)
  const handleReturnToMap = () => {
    setCurrentView('map');
    
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
    setCurrentView('map');
    
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
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar - FLOATING: touches left edge, margins from top/bottom */}
      <div 
        className={`
          fixed left-0 top-40 bottom-40 bg-white dark:bg-gray-800 
          border-r border-t border-b border-gray-200 dark:border-gray-700 shadow-lg 
          rounded-r-xl transform transition-all duration-300 ease-in-out overflow-hidden z-40
          ${isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'}
          ${isMobile ? 'top-0 bottom-0 rounded-none border-t-0 border-b-0 z-50' : ''}
          ${className}
        `}
      >
        {/* Header - Updated with Map Return Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              HydroDash
            </h2>
            
            {/* NEW: Map Return Button */}
            <button
              onClick={handleReturnToMap}
              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              title="Return to Map"
              aria-label="Return to map view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Location Info */}
        {activeLocationProps && activeLocation && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 mt-1">
                  {isRiverReach(activeLocation) ? (
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {activeLocationProps.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {activeLocationProps.reachId ? (
                      <>Reach ID: {activeLocationProps.reachId}</>
                    ) : (
                      <>Custom Location</>
                    )}
                  </p>
                  {isRiverReach(activeLocation) && activeLocation.streamflow && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {activeLocation.streamflow.length} forecast types available
                    </p>
                  )}
                </div>
              </div>
              
              {/* Quick Actions for Active Location */}
              {isSavedPlace(activeLocation) && (
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => handleViewOnMap(activeLocation)}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                    title="View on map"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { 
              key: 'places' as const, 
              label: 'Places', 
              icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
              count: getPlaceCount()
            },
            { 
              key: 'settings' as const, 
              label: 'Settings', 
              icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
            },
          ].map(({ key, label, icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`
                flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium relative
                transition-colors
                ${activeSection === key
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              <span>{label}</span>
              {/* Places count indicator */}
              {key === 'places' && count > 0 && (
                <span className={`
                  px-1.5 py-0.5 text-xs rounded-full
                  ${activeSection === key
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }
                `}>
                  {count}
                </span>
              )}
              {activeSection === key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Places Section */}
          {activeSection === 'places' && (
            <div className="p-4">
              {/* Enhanced SavedPlacesList Integration */}
              <SavedPlacesList
                activePlace={activeSavedPlace}
                flowUnit={preferences.flowUnit}
                onPlaceSelect={handlePlaceSelect}
                onPlaceEdit={handlePlaceEdit}
                onAddPlace={handleAddPlace}
                showAddButton={true}
                showFlowData={true}
                className="space-y-3"
              />
              
              {/* Quick Actions Panel for Active Place */}
              {activeSavedPlace && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleViewOnMap(activeSavedPlace)}
                      className="flex items-center justify-center space-x-2 py-2 px-3 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                      </svg>
                      <span>View on Map</span>
                    </button>
                    
                    <button
                      onClick={() => setCurrentView('dashboard')}
                      className="flex items-center justify-center space-x-2 py-2 px-3 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Dashboard</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Summary Statistics */}
              {savedPlaces.length > 0 && !savedPlacesLoading && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {savedPlaces.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total Places
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {savedPlaces.filter(p => p.isPrimary).length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Primary
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Units
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Flow</span>
                    <UnitsToggle
                      value={preferences.flowUnit as FlowUnit}
                      onChange={(value) => updatePreference('flowUnit', value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Temperature</span>
                    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                      {(['F', 'C'] as const).map((unit) => (
                        <button
                          key={unit}
                          onClick={() => updatePreference('tempUnit', unit)}
                          className={`
                            px-3 py-1 text-xs font-medium rounded transition-all
                            ${preferences.tempUnit === unit
                              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                            }
                          `}
                        >
                          °{unit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Appearance
                </h3>
                <ThemeToggle
                  value={preferences.theme as ThemePref}
                  onChange={(value) => updatePreference('theme', value)}
                />
              </div>

              {/* Data Management */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Data
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Auto Refresh</span>
                    <button
                      onClick={() => updatePreference('autoRefresh', !preferences.autoRefresh)}
                      className={`
                        relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                        ${preferences.autoRefresh ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                          ${preferences.autoRefresh ? 'translate-x-5' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                  
                  {preferences.autoRefresh && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 ml-0">
                      Refreshes every {Math.floor((preferences.refreshInterval || 300000) / 60000)} minutes
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;