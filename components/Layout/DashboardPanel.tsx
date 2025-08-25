// components/Layout/DashboardPanel.tsx
'use client';

import React, { createContext, useContext, useState, useRef } from 'react';
// Import motion components and hooks from Framer Motion
import { motion, useScroll, useTransform } from 'framer-motion';

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
  sidebarWidth = SIDEBAR_WIDTH,
}) => {
  
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

  // Format flow value
  const formatFlow = (flow: number | null): string => {
    if (flow === null) return '--';
    return `${Math.round(flow).toLocaleString()}`;
  };

  // Get risk level color
  const getRiskColor = (risk: RiskLevel): string => {
    switch (risk) {
      case 'normal': return 'text-green-300';
      case 'elevated': return 'text-yellow-300';
      case 'high': return 'text-orange-300';
      case 'flood': return 'text-red-300';
      default: return 'text-gray-400';
    }
  };

  // --- FRAMER MOTION SETUP ---
  // 1. Create a ref for the scrollable container
  const scrollRef = useRef(null);

  // 2. Track scroll progress within the container
  const { scrollYProgress } = useScroll({ container: scrollRef });

  // 3. Define the animation range. The animation will complete when the user
  //    has scrolled 20% of the way down the container.
  const animationEnd = 0.1;

  // 4. Create transformations that map scroll progress to styles
  const headerHeight = useTransform(scrollYProgress, [0, animationEnd], ['400vh', '400px']);
  const flowFontSize = useTransform(scrollYProgress, [0, animationEnd], [96, 28]);
  const titleFontSize = useTransform(scrollYProgress, [0, animationEnd], [32, 24]);
  const infoOpacity = useTransform(scrollYProgress, [0, animationEnd], [1, 0]);

  const layoutStyles = isSidebarCollapsed ? { paddingLeft: '0' } : { paddingLeft: `${sidebarWidth}px` };
  const getContentContainerClasses = () => `w-full mx-auto px-4 sm:px-6 lg:px-8 ${isSidebarCollapsed ? 'max-w-7xl' : 'max-w-6xl'}`;
  const dashboardContextValue = { activeLocation, selectedStream, reachId };

  if (loading || !reachId || error) {
    return <div style={layoutStyles} className="flex items-center justify-center h-screen"><DashboardLoadingSpinner /></div>;
  }
  
  return (
    <DashboardContext.Provider value={dashboardContextValue}>
      {/* The root is now a flex container */}
      <div
        className="h-screen overflow-hidden flex flex-col"
        style={{ transition: 'padding 0.3s ease-in-out', ...layoutStyles }}
      >
        {/* The header is a flex item. It is NOT sticky. */}
        <motion.header 
          style={{ height: headerHeight }}
          className="w-full text-white z-10" // z-10 keeps it above tiles if any visual overlap occurs
        >
          <div className={`${getContentContainerClasses()} h-full`}>
            <div className={`relative h-full flex transition-all duration-300 ${scrollYProgress.get() > 0.1 ? 'flex-row items-center justify-between' : 'flex-col items-center justify-center'}`}>
              <motion.div layout="position"><motion.h1 style={{ fontSize: titleFontSize }} className="font-bold">{displayName}</motion.h1></motion.div>
              <motion.div layout="position" className="flex items-end space-x-2 font-light"><motion.span style={{ fontSize: flowFontSize }}>{formatFlow(currentFlow)}</motion.span><span className="pb-2 text-lg opacity-70">{flowUnit}</span></motion.div>
              <motion.div style={{ opacity: infoOpacity }} className={`text-center ${scrollYProgress.get() > 0.1 ? 'hidden' : ''}`}><p className={`capitalize font-medium ${getRiskColor(riskLevel)}`}>{riskLevel} Risk</p><p className="text-sm text-gray-400">{geoLoading ? '...' : (geoLocation as any)?.display}</p></motion.div>
            </div>
          </div>
        </motion.header>
          
        {/* The content area is a flex item that grows and scrolls independently */}
        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto"
        >
          <main className={`${getContentContainerClasses()} py-8`}>
            <TilesManager />
            {children && <div className="mt-8">{children}</div>}
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
};

export default DashboardPanel;