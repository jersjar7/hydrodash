// components/Layout/AppShell.tsx
'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import LoadingSpinner, { FullPageLoadingSpinner } from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import MapPanel from '@/components/Layout/MapPanel';
import DashboardPanel from '@/components/Layout/DashboardPanel';
import Sidebar from '@/components/Layout/Sidebar';
import type { RiverReach, ReachId } from '@/types';

// Types for our app state
export type AppView = 'map' | 'dashboard';

// Updated SavedPlace interface to align with RiverReach but keep existing properties
export interface SavedPlace {
  id: string;
  name: string;
  type?: 'home' | 'work' | 'recreation' | 'other';
  reachId?: ReachId;
  lat?: number;
  lon?: number;
  isPrimary?: boolean;
  createdAt: string;
  // Optional metadata for saved places
  userNotes?: string;
  photo?: string;
}

// Union type for active location - can be either a saved place or live river reach
export type ActiveLocation = SavedPlace | RiverReach | null;

// New interface for stream modal data
export interface StreamModalData {
  reachId: ReachId;
  name?: string;
  lat: number;
  lon: number;
  currentFlow?: number;
  metadata?: Record<string, any>;
}

export interface UserPreferences {
  flowUnit: 'CFS' | 'CMS';
  tempUnit: 'F' | 'C';
  theme: 'light' | 'dark' | 'system';
  savedPlaceIds: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  collapsedSidebar?: boolean;
}

export interface AppState {
  currentView: AppView;
  activeLocation: ActiveLocation;
  sidebarOpen: boolean;
  userPreferences: UserPreferences;
  savedPlaces: SavedPlace[];
  // New modal state
  streamModalOpen: boolean;
  selectedStreamData: StreamModalData | null;
}

export interface AppContextType extends AppState {
  setCurrentView: (view: AppView) => void;
  setActiveLocation: (location: ActiveLocation) => void;
  setSidebarOpen: (open: boolean) => void;
  setUserPreferences: (prefs: UserPreferences) => void;
  setSavedPlaces: (places: SavedPlace[]) => void;
  addSavedPlace: (place: SavedPlace) => void;
  removeSavedPlace: (placeId: string) => void;
  // New helper to create saved place from river reach
  saveLocationFromReach: (reach: RiverReach, type?: SavedPlace['type']) => void;
  // Helper to get standardized location properties
  getActiveLocationProps: () => ReturnType<typeof getLocationProps>;
  // New modal control functions
  openStreamModal: (streamData: StreamModalData) => void;
  closeStreamModal: () => void;
  viewStreamDashboard: (streamData: StreamModalData) => void;
  isMobile: boolean;
  isTablet: boolean;
}

// Type guard to check if active location is a RiverReach
function isRiverReach(location: ActiveLocation): location is RiverReach {
  return location !== null && 'streamflow' in location;
}

// Type guard to check if active location is a SavedPlace
function isSavedPlace(location: ActiveLocation): location is SavedPlace {
  return location !== null && 'createdAt' in location;
}

// Helper to get standardized properties from either type
function getLocationProps(location: ActiveLocation) {
  if (!location) return null;
  
  if (isRiverReach(location)) {
    return {
      id: location.reachId,
      name: location.name || `Reach ${location.reachId}`,
      reachId: location.reachId,
      lat: location.latitude,
      lon: location.longitude,
      streamflow: location.streamflow,
    };
  }
  
  if (isSavedPlace(location)) {
    return {
      id: location.id,
      name: location.name,
      reachId: location.reachId,
      lat: location.lat,
      lon: location.lon,
      type: location.type,
      isPrimary: location.isPrimary,
    };
  }
  
  return null;
}

// Export helper functions for use by other components
export { isRiverReach, isSavedPlace, getLocationProps };

// Create context with default values
const AppContext = createContext<AppContextType | null>(null);

// Hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppShell');
  }
  return context;
};

// Default user preferences
const defaultUserPreferences: UserPreferences = {
  flowUnit: 'CFS',
  tempUnit: 'F',
  theme: 'system',
  savedPlaceIds: [],
  autoRefresh: true,
  refreshInterval: 300000, // 5 minutes
  collapsedSidebar: false,
};

interface AppShellProps {
  children?: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  // App state
  const [currentView, setCurrentView] = useState<AppView>('map');
  const [activeLocation, setActiveLocation] = useState<ActiveLocation>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open as per requirements
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(defaultUserPreferences);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New modal state
  const [streamModalOpen, setStreamModalOpen] = useState(false);
  const [selectedStreamData, setSelectedStreamData] = useState<StreamModalData | null>(null);

  // Responsive breakpoint detection
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load user preferences and saved places on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load from localStorage
        const storedPrefs = localStorage.getItem('hydrodash-preferences');
        const storedPlaces = localStorage.getItem('hydrodash-saved-places');
        
        if (storedPrefs) {
          setUserPreferences(JSON.parse(storedPrefs));
        }
        
        if (storedPlaces) {
          const places = JSON.parse(storedPlaces);
          setSavedPlaces(places);
          
          // Set first saved place as active if none is set
          if (places.length > 0 && !activeLocation) {
            setActiveLocation(places[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [activeLocation]);

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      const { theme } = userPreferences;
      const root = document.documentElement;
      
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.className = prefersDark ? 'dark' : 'light';
      } else {
        root.className = theme;
      }
    };

    applyTheme();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (userPreferences.theme === 'system') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [userPreferences.theme]);

  // Persist user preferences to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('hydrodash-preferences', JSON.stringify(userPreferences));
    }
  }, [userPreferences, isLoading]);

  // Persist saved places to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('hydrodash-saved-places', JSON.stringify(savedPlaces));
    }
  }, [savedPlaces, isLoading]);

  // Auto-close sidebar on mobile when changing views
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [currentView, isMobile]);

  // Helper functions
  const addSavedPlace = (place: SavedPlace) => {
    setSavedPlaces(prev => {
      const exists = prev.some(p => p.id === place.id);
      if (exists) return prev;
      return [...prev, place];
    });
    
    // Update user preferences with new place ID
    setUserPreferences(prev => ({
      ...prev,
      savedPlaceIds: [...prev.savedPlaceIds, place.id]
    }));
  };

  const removeSavedPlace = (placeId: string) => {
    setSavedPlaces(prev => prev.filter(p => p.id !== placeId));
    
    // Update user preferences
    setUserPreferences(prev => ({
      ...prev,
      savedPlaceIds: prev.savedPlaceIds.filter(id => id !== placeId)
    }));
    
    // Clear active location if it was removed
    if (activeLocation && getLocationProps(activeLocation)?.id === placeId) {
      setActiveLocation(null);
    }
  };

  // New helper to create saved place from river reach
  const saveLocationFromReach = (reach: RiverReach, type: SavedPlace['type'] = 'other') => {
    const savedPlace: SavedPlace = {
      id: crypto.randomUUID(),
      name: reach.name || `Reach ${reach.reachId}`,
      type,
      reachId: reach.reachId,
      lat: reach.latitude,
      lon: reach.longitude,
      isPrimary: false,
      createdAt: new Date().toISOString(),
    };
    
    addSavedPlace(savedPlace);
  };

  // New modal control functions
  const openStreamModal = (streamData: StreamModalData) => {
    setSelectedStreamData(streamData);
    setStreamModalOpen(true);
  };

  const closeStreamModal = () => {
    setStreamModalOpen(false);
    setSelectedStreamData(null);
  };

  const viewStreamDashboard = (streamData: StreamModalData) => {
    // Create a temporary RiverReach object for the active location
    const tempReach: RiverReach = {
      reachId: streamData.reachId,
      name: streamData.name || `Reach ${streamData.reachId}`,
      latitude: streamData.lat,
      longitude: streamData.lon,
      streamflow: [], // Will be populated by data services
    };
    
    setActiveLocation(tempReach);
    setCurrentView('dashboard');
    closeStreamModal();
  };

  // Helper to get standardized location properties
  const getActiveLocationProps = () => getLocationProps(activeLocation);

  // Enhanced location select handler that switches to dashboard
  const handleLocationSelect = (place: SavedPlace) => {
    setActiveLocation(place);
    setCurrentView('dashboard'); // Automatically switch to dashboard when selecting a saved place
  };

  // Context value
  const contextValue: AppContextType = {
    currentView,
    activeLocation,
    sidebarOpen,
    userPreferences,
    savedPlaces,
    streamModalOpen,
    selectedStreamData,
    setCurrentView,
    setActiveLocation,
    setSidebarOpen,
    setUserPreferences,
    setSavedPlaces,
    addSavedPlace,
    removeSavedPlace,
    saveLocationFromReach,
    getActiveLocationProps,
    openStreamModal,
    closeStreamModal,
    viewStreamDashboard,
    isMobile,
    isTablet,
  };

  // Loading state
  if (isLoading) {
    return <FullPageLoadingSpinner text="Loading HydroDash..." />;
  }

  // Get active location props for display
  const activeLocationProps = getActiveLocationProps();

  // Determine if dashboard should be shown (only when there's an active location)
  const shouldShowDashboard = currentView === 'dashboard' && activeLocation !== null;

  return (
    <ErrorBoundary>
      <AppContext.Provider value={contextValue}>
        <div 
          className={`
            relative
            min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 
            dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900
            transition-colors duration-300
            ${isMobile ? 'text-sm' : 'text-base'}
          `}
        >
          {/* HEADER - Fixed top navigation */}
          <nav className="relative z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 h-16">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                
                {/* Left: Sidebar Toggle & Logo */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle sidebar"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </div>
                    <span className="font-bold text-xl text-gray-900 dark:text-white">
                      HydroDash
                    </span>
                  </div>
                </div>

                {/* Center: Current View Indicator */}
                <div className="flex items-center">
                  <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {shouldShowDashboard ? 'Dashboard' : 'Map'}
                    </span>
                  </div>
                </div>

                {/* Right: Location Info */}
                <div className="flex items-center space-x-4">
                  {activeLocationProps ? (
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activeLocationProps.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activeLocationProps.reachId || 'Custom Location'}
                      </p>
                    </div>
                  ) : (
                    <div className="hidden sm:block text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No location selected
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* FLOATING SIDEBAR - Positioned independently */}
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            savedPlaces={savedPlaces}
            activeLocation={activeLocation}
            onLocationSelect={handleLocationSelect}
            preferences={userPreferences}
            onPreferencesChange={setUserPreferences}
            isMobile={isMobile}
          />

          {/* MAIN CONTENT - Full height minus header */}
          <div
            className="absolute inset-x-0 top-16 bottom-0 z-10 overflow-hidden"  // ⟵ changed
          >
            <ErrorBoundary>
            {shouldShowDashboard ? (
              <DashboardPanel
                header={
                  activeLocationProps && (
                    <div className="mb-4">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {activeLocationProps.name}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400">
                        {activeLocationProps.reachId ? `Reach ID: ${activeLocationProps.reachId}` : 'Custom Location'}
                        {isRiverReach(activeLocation) && activeLocation.streamflow && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                            • {activeLocation.streamflow.length} forecast types available
                          </span>
                        )}
                      </p>
                    </div>
                  )
                }
              >
                {children}
              </DashboardPanel>
            ) : (
              children
            )}
          </ErrorBoundary>
          </div>
        </div>
      </AppContext.Provider>
    </ErrorBoundary>
  );
};

export default AppShell;