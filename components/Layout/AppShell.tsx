// components/Layout/AppShell.tsx
'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import LoadingSpinner, { FullPageLoadingSpinner } from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import AppFrame from '@/components/Layout/AppFrame';
import MainViewport from '@/components/Layout/MainViewport';
import SidebarOverlay from '@/components/Layout/SidebarOverlay';
import MapPanel from '@/components/Layout/MapPanel';
import DashboardPanel from '@/components/Layout/DashboardPanel';
import Sidebar from '@/components/Layout/Sidebar';
import SidebarToggle from '@/components/Sidebar/SidebarToggle';
import { useSavedPlaces } from '@/hooks/useSavedPlaces';
import type { RiverReach, ReachId, UserPreferences } from '@/types';

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
  updatedAt?: string;
  // Optional metadata for saved places
  notes?: string;
  photoUrl?: string;
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
  savedPlaceIds: [],
  autoRefresh: true,
  refreshInterval: 300000,
  collapsedSidebar: false,
  baseMapLayer: 'standard',
  mapView: '3D',
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
  const [isLoading, setIsLoading] = useState(true);
  
  // New modal state
  const [streamModalOpen, setStreamModalOpen] = useState(false);
  const [selectedStreamData, setSelectedStreamData] = useState<StreamModalData | null>(null);

  // Use the saved places hook instead of local state
  const {
    places: savedPlaces,
    addPlace,
    removePlace,
    hasPlace,
    isLoading: savedPlacesLoading,
    error: savedPlacesError
  } = useSavedPlaces({
    autoSave: true,
    maxPlaces: 20,
  });

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

  // Load user preferences on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load preferences from localStorage
        const storedPrefs = localStorage.getItem('hydrodash-preferences');
        
        if (storedPrefs) {
          setUserPreferences(JSON.parse(storedPrefs));
        }
        
        // Set first saved place as active if none is set and places exist
        if (savedPlaces.length > 0 && !activeLocation) {
          setActiveLocation(savedPlaces[0]);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        // Only set loading to false when both user prefs and saved places are loaded
        if (!savedPlacesLoading) {
          setIsLoading(false);
        }
      }
    };

    loadUserData();
  }, [activeLocation, savedPlaces, savedPlacesLoading]);

  // Update loading state when saved places finish loading
  useEffect(() => {
    if (!savedPlacesLoading) {
      setIsLoading(false);
    }
  }, [savedPlacesLoading]);

  // Persist user preferences to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('hydrodash-preferences', JSON.stringify(userPreferences));
    }
  }, [userPreferences, isLoading]);

  // Auto-close sidebar on mobile when changing views
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [currentView, isMobile]);

  // Updated helper functions to use the hook
  const addSavedPlace = async (place: SavedPlace) => {
    try {
      await addPlace({
        name: place.name,
        reachId: place.reachId,
        lat: place.lat,
        lon: place.lon,
        notes: place.notes,
        photoUrl: place.photoUrl,
        isPrimary: place.isPrimary,
      });
      
      console.log(`✅ Successfully added place: ${place.name}`);
    } catch (error) {
      console.error('Failed to add saved place:', error);
    }
  };

  const removeSavedPlace = async (placeId: string) => {
    try {
      await removePlace(placeId);
      
      // Clear active location if it was removed
      if (activeLocation && getLocationProps(activeLocation)?.id === placeId) {
        setActiveLocation(null);
      }
      
      console.log(`🗑️ Successfully removed place: ${placeId}`);
    } catch (error) {
      console.error('Failed to remove saved place:', error);
    }
  };

  // New helper to create saved place from river reach
  const saveLocationFromReach = async (reach: RiverReach, type: SavedPlace['type'] = 'other') => {
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
    
    await addSavedPlace(savedPlace);
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
    setSavedPlaces: () => {}, // Deprecated - places are managed by the hook now
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
            min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 
            dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900
            transition-colors duration-300
            ${isMobile ? 'text-sm' : 'text-base'}
          `}
        >
          <AppFrame>
            {/* App Title - positioned above sidebar */}
            <div className="fixed top-10 left-7 z-60">
              <div className="pr-26 pl-7 pt-0.5 pb-3 -ml-7 mr-40" style={{
                background: 'radial-gradient(ellipse 400px 150px at left, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.5) 25%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.1) 90%,  transparent 100%)',
              }}>
                <h1 className="text-6xl font-light tracking-tight text-white" style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  letterSpacing: '-0.02em'
                }}>
                  <span style={{ fontWeight: 400 }}>Hydro</span>
                  <span style={{ fontWeight: 200 }}>Dash</span>
                </h1>
              </div>
            </div>
            
            {/* Sidebar Overlay */}
            <SidebarOverlay open={sidebarOpen}>
              <Sidebar
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                savedPlaces={savedPlaces}
                activeLocation={activeLocation}
                onLocationSelect={handleLocationSelect}
                preferences={userPreferences}
                onPreferencesChange={setUserPreferences}
                isMobile={isMobile}
              />
            </SidebarOverlay>

            {/* Floating Sidebar Toggle - Only visible when sidebar is closed */}
            {!sidebarOpen && (
              <div 
                className={`
                  fixed z-60 
                  transition-all duration-500 ease-out
                  animate-in fade-in slide-in-from-left-4
                  ${!sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}
                `}
                style={{
                  top: '180px',
                  left: '16px',
                }}
              >
                <SidebarToggle
                isOpen={false}
                onToggle={() => setSidebarOpen(true)}
                size="md"
                variant="panel"
                className={`
                  shadow-lg border border-white/20
                  bg-black/40 backdrop-blur-md
                  hover:bg-white/20 hover:shadow-xl hover:scale-105 hover:text-white
                  focus:bg-white/20 focus:shadow-xl focus:scale-105
                  focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent
                  active:scale-95
                  transition-all duration-200 ease-out
                  group
                `}
                aria-label="Open sidebar navigation"
                data-testid="floating-sidebar-toggle"
              />
              </div>
            )}

            {/* Main Content */}
            <MainViewport>
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
            </MainViewport>

          </AppFrame>
        </div>
      </AppContext.Provider>
    </ErrorBoundary>
  );
};

export default AppShell;