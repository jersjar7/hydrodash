// components/Layout/DashboardPanel.tsx
'use client';

import React, { createContext, useContext, useState, useRef } from 'react';
import { SavedPlace } from '@/types/models/SavedPlace';
import { ReachId, RiverReach } from '@/types/models/RiverReach';
import { RiskLevel } from '@/types/models/FlowForecast';
import { FlowUnit } from '@/types/models/UserPreferences';
import { useShortRangeForecast, getCurrentFlow } from '@/hooks/useFlowData';
import { useReturnPeriod } from '@/hooks/useReturnPeriods';
import { computeRisk } from '@/lib/utils/riskCalculator';
import { DashboardLoadingSpinner } from '@/components/common/LoadingSpinner';
import ResponsiveContainer from '@/components/common/ResponsiveContainer';

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
  /** Tiles/widget children */
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
}) => {
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const tilesAreaRef = useRef<HTMLDivElement>(null);

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

  // Handle scroll in tiles area to collapse/expand header
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

  // No location selected state
  if (!reachId || !locationName) {
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
      <div className={`h-full flex flex-col ${className}`}>
        {/* Dashboard Header - Top 1/3 (collapsible) */}
        <div 
          className={`
            transition-all duration-300 ease-in-out
            ${isHeaderCollapsed ? 'h-16' : 'h-1/3'}
            bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900
            border-b border-gray-200 dark:border-gray-700
            overflow-hidden
          `}
        >
          <ResponsiveContainer maxWidth="7xl" padding="lg" center className="h-full">
            <div className="h-full flex flex-col justify-center">
              {/* Always visible - River name */}
              <div className="flex items-center justify-between">
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
                      {!isRiverReach(activeLocation) && activeLocation && 'isPrimary' in activeLocation && activeLocation.isPrimary && (
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
                    className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-sm">Back to Map</span>
                  </button>
                )}
              </div>

              {/* Expandable content - Current flow */}
              {!isHeaderCollapsed && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Flow */}
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/20 dark:border-gray-700/20">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Flow</h3>
                    {flowLoading || returnPeriodsLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-500">Loading...</span>
                      </div>
                    ) : flowError ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Flow data unavailable</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatFlow(currentFlow)}
                        </p>
                        <p className={`text-sm font-medium capitalize ${getRiskColor(riskLevel)}`}>
                          {riskLevel?.replace('_', ' ') || 'Unknown'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Additional stats placeholder */}
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/20 dark:border-gray-700/20">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">24h Trend</h3>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ResponsiveContainer>
        </div>

        {/* Tiles Area - Remaining space (scrollable) */}
        <div 
          ref={tilesAreaRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
        >
          <ResponsiveContainer maxWidth="7xl" padding="lg" center>
            {children ? (
              <div className="min-h-full">
                {children}
              </div>
            ) : (
              <div className="min-h-full flex items-center justify-center">
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-6">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Tiles Area Coming Soon
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    This area will be populated with customizable tiles for monitoring {locationName}.
                  </p>
                  <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                    Scroll here to see header collapse behavior ↑
                  </div>
                </div>
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardContext.Provider>
  );
};

export default DashboardPanel;