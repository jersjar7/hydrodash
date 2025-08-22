// components/Layout/DashboardPanel.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';
import { SavedPlace } from '@/types/models/SavedPlace';
import { ReachId, RiverReach } from '@/types/models/RiverReach';
import { RiskLevel } from '@/types/models/FlowForecast';
import { FlowUnit } from '@/types/models/UserPreferences';
import { useShortRangeForecast, getCurrentFlow } from '@/hooks/useFlowData';
import { useReturnPeriod } from '@/hooks/useReturnPeriods';
import { useReachMetadata } from '@/hooks/useReachMetadata';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import { computeRisk } from '@/lib/utils/riskCalculator';
import { DashboardLoadingSpinner } from '@/components/common/LoadingSpinner';
import ResponsiveContainer from '@/components/common/ResponsiveContainer';
import TilesManager from '@/components/Layout/TilesManager';
import { SIDEBAR_WIDTH } from '@/components/Layout/AppShell';

// Stream metadata interface
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

// Context for providing active stream data to child tiles
interface DashboardContextType {
  activeLocation?: SavedPlace | RiverReach | null;
  selectedStream?: StreamMetadata | null;
  reachId?: ReachId | null;
}

const DashboardContext = createContext<DashboardContextType>({});

export const useDashboardContext = () => {
  return useContext(DashboardContext);
};

interface DashboardPanelProps {
  /** Widget children */
  children?: React.ReactNode;
  /** Currently active location from AppShell (SavedPlace or RiverReach) */
  activeLocation?: SavedPlace | RiverReach | null;
  /** Selected stream data from map modal */
  selectedStream?: StreamMetadata | null;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Flow unit preference */
  flowUnit?: FlowUnit;
  /** Custom className */
  className?: string;
  /** Callback when no location is selected */
  onReturnToMap?: () => void;
  /** Sidebar state - NEW PROPS */
  isSidebarCollapsed?: boolean;
  sidebarWidth?: number; // Width in pixels when expanded
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({
  children,
  activeLocation,
  selectedStream,
  loading = false,
  error,
  flowUnit = 'CFS',
  className = '',
  onReturnToMap,
  isSidebarCollapsed = false,
  sidebarWidth = SIDEBAR_WIDTH, // Default from AppShell
}) => {
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  // Calculate dynamic positioning and content centering based on sidebar state
  const layoutStyles = isSidebarCollapsed 
    ? {
        // Sidebar collapsed: use full viewport width
        paddingLeft: '0',
        paddingRight: '0',
      }
    : {
        // Sidebar open: offset content to account for sidebar
        paddingLeft: `${sidebarWidth}px`,
        paddingRight: '0',
      };

  // Content container classes with improved centering
  const getContentContainerClasses = () => {
    const baseClasses = "w-full mx-auto px-4 sm:px-6 lg:px-8";
    // Use responsive max-width based on sidebar state
    const maxWidth = isSidebarCollapsed ? 'max-w-7xl' : 'max-w-6xl';
    return `${baseClasses} ${maxWidth}`;
  };

  // Helper function to check if location is RiverReach
  const isRiverReach = (location: any): location is RiverReach => {
    return location && typeof location === 'object' && 'reachId' in location && !('id' in location);
  };

  // Get reachId and location name from either SavedPlace or RiverReach
  const getLocationData = (): { reachId: ReachId | null; name: string | null } => {
    if (selectedStream) {
      return {
        reachId: selectedStream.reachId,
        name: selectedStream.name || null
      };
    }
    
    if (activeLocation) {
      if (isRiverReach(activeLocation)) {
        return {
          reachId: activeLocation.reachId,
          name: activeLocation.name || `Stream ${activeLocation.reachId}`
        };
      } else {
        return {
          reachId: activeLocation.reachId || null,
          name: activeLocation.name
        };
      }
    }
    
    return { reachId: null, name: null };
  };

  const { reachId, name: locationName } = getLocationData();

  // Fetch reach metadata for actual river name
  const { 
    data: reachMetadata, 
    isLoading: metadataLoading 
  } = useReachMetadata(reachId, {
    enabled: !!reachId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get the best available name (metadata > selectedStream > saved place > fallback)
  const displayName = reachMetadata?.name || locationName || `Stream ${reachId}`;

  // Get coordinates for geocoding (priority: reachMetadata > selectedStream > activeLocation)
  const getCoordinates = () => {
    if (reachMetadata?.latitude && reachMetadata?.longitude) {
      return { latitude: reachMetadata.latitude, longitude: reachMetadata.longitude };
    }
    if (selectedStream?.lat && selectedStream?.lon) {
      return { latitude: selectedStream.lat, longitude: selectedStream.lon };
    }
    if (activeLocation) {
      if (isRiverReach(activeLocation) && activeLocation.latitude && activeLocation.longitude) {
        return { latitude: activeLocation.latitude, longitude: activeLocation.longitude };
      }
      if (!isRiverReach(activeLocation) && activeLocation.lat && activeLocation.lon) {
        return { latitude: activeLocation.lat, longitude: activeLocation.lon };
      }
    }
    return null;
  };

  const coordinates = getCoordinates();

  // Get geographic location
  const { 
    location: geoLocation, 
    isLoading: geoLoading 
  } = useReverseGeocode(coordinates, {
    enabled: !!coordinates,
    useCache: true
  });

  // Fetch flow data
  const { 
    data: flowData, 
    isLoading: flowLoading, 
    error: flowError 
  } = useShortRangeForecast(reachId, {
    enabled: !!reachId,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Get return periods for risk calculation
  const { 
    thresholds: returnPeriods, 
    loading: returnPeriodsLoading 
  } = useReturnPeriod(reachId, { enabled: !!reachId });

  // Calculate current flow and risk
  const currentFlow = getCurrentFlow(flowData);
  const riskLevel: RiskLevel = (currentFlow !== null && returnPeriods) 
    ? computeRisk(currentFlow, returnPeriods) 
    : 'normal';

  // Handle scroll to collapse/expand header
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const shouldCollapse = scrollTop > 50; // Collapse after 50px scroll
    
    if (shouldCollapse !== isHeaderCollapsed) {
      setIsHeaderCollapsed(shouldCollapse);
    }
  };

  // Dashboard context value
  const dashboardContextValue: DashboardContextType = {
    activeLocation,
    selectedStream,
    reachId,
  };

  // Format flow value
  const formatFlow = (flow: number | null): string => {
    if (flow === null) return 'N/A';
    return flowUnit === 'CFS' 
      ? `${flow.toLocaleString()} CFS`
      : `${(flow * 0.0283168).toFixed(1)} CMS`;
  };

  // Get risk level color
  const getRiskColor = (risk: RiskLevel): string => {
    switch (risk) {
      case 'normal': return 'text-green-600 dark:text-green-400';
      case 'elevated': return 'text-yellow-600 dark:text-yellow-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'flood': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Error state
  if (error) {
    return (
      <div 
        className={`h-full ${className}`} 
        style={{
          transition: 'padding 0.3s ease-in-out',
          ...layoutStyles
        }}
      >
        <div className="h-full flex items-center justify-center">
          <div className={getContentContainerClasses()}>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm mx-auto">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Dashboard Error
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
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
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div 
        className={`relative h-full ${className}`} 
        style={{
          transition: 'padding 0.3s ease-in-out',
          ...layoutStyles
        }}
      >
        <DashboardLoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  // No location selected state
  if (!reachId || !locationName) {
    return (
      <div 
        className={`h-full ${className}`} 
        style={{
          transition: 'padding 0.3s ease-in-out',
          ...layoutStyles
        }}
      >
        <div className="h-full flex flex-col items-center justify-center">
          <div className={getContentContainerClasses()}>
            <div className="text-center">
              <div className="text-gray-400 mb-6">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Location Selected
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
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
          </div>
        </div>
      </div>
    );
  }

  return (
  <DashboardContext.Provider value={dashboardContextValue}>
    <div 
      className={`h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 ${className}`}
      style={{
        transition: 'padding 0.3s ease-in-out',
        ...layoutStyles
      }}
    >
      {/* Main scrolling container */}
      <div 
        className="h-full pt-16 overflow-y-auto"
        onScroll={handleScroll}
      >
        {/* Simple sticky header */}
        <div 
          className={`
            sticky top-0 z-50
            transition-all duration-300 ease-in-out
            ${isHeaderCollapsed ? 'h-32' : 'h-[40vh]'}
            border-b border-white/20 dark:border-gray-700/30
            flex items-center justify-center
            overflow-hidden
          `}
        >
          <div className={getContentContainerClasses()}>
            <div className="text-center">
              {/* Always visible title */}
              <div>
                <h1 className={`font-bold text-gray-900 dark:text-white transition-all duration-300 ${isHeaderCollapsed ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl lg:text-6xl'}`}>
                  {displayName}
                </h1>
                {geoLocation && (
                  <p className={`text-gray-700 dark:text-gray-300 mt-2 transition-all duration-300 ${isHeaderCollapsed ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl'}`}>
                    {geoLocation.display}
                  </p>
                )}
                <div className={`flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 mt-2 transition-all duration-300 ${isHeaderCollapsed ? 'text-sm md:text-base' : 'text-lg md:text-xl'}`}>
                  <span>ID: {reachId}</span>
                  {!isRiverReach(activeLocation) && activeLocation && 'isPrimary' in activeLocation && activeLocation.isPrimary && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">Primary Location</span>
                    </>
                  )}
                </div>
              </div>

              {/* Cards that disappear when collapsed */}
              <div className={`mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto transition-all duration-300 ${isHeaderCollapsed ? 'opacity-0 scale-95 max-h-0 overflow-hidden' : 'opacity-100 scale-100 max-h-96'}`}>
                {/* Current Flow */}
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-6 backdrop-blur-sm">
                  <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Current Flow</h3>
                  {flowLoading || returnPeriodsLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-500">Loading...</span>
                    </div>
                  ) : flowError ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Flow data unavailable</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                        {formatFlow(currentFlow)}
                      </p>
                      <p className={`text-base font-medium capitalize ${getRiskColor(riskLevel)}`}>
                        {riskLevel?.replace('_', ' ') || 'Unknown'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional stats */}
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-6 backdrop-blur-sm">
                  <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">24h Trend</h3>
                  <div className="space-y-1">
                    <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">--</p>
                    <p className="text-base text-gray-500 dark:text-gray-400">Coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content area - scrolls normally */}
        <div className="py-8">
          <div className={getContentContainerClasses()}>
            <TilesManager data-testid="dashboard-tiles" />
            {children && (
              <div className="mt-8">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </DashboardContext.Provider>
);
};

export default DashboardPanel;