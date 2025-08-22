// app/page.tsx
'use client';

import React, { useState } from 'react';
import AppShell from '@/components/Layout/AppShell';
import Map from '@/components/Map/Map';
import MapPanel from '@/components/Layout/MapPanel';
import SearchBar from '@/components/Map/SearchBar';
import MobileNavigation from '@/components/mobile/MobileNavigation';
import StreamPopup from '@/components/Map/StreamPopup';
import { useAppContext } from '@/components/Layout/AppShell';
import { ReachId } from '@/types/models/RiverReach';
import StreamSearchOverlay from '@/components/Map/StreamSearch/StreamSearchOverlay';

// Import new map control components
import BaseMapSelector from '@/components/Map/BaseMapSelector';
import ViewToggle from '@/components/Map/ViewToggle';

// Define StreamMetadata interface (matches StreamPopup.tsx)
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

// Map screen content with modal integration
const MapScreen = () => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [selectedStreamData, setSelectedStreamData] = useState<StreamMetadata | undefined>(undefined);
  
  // Get context for user preferences only (StreamPopup handles save/dashboard operations)
  const { userPreferences } = useAppContext();

  // Handle stream selection from map
  const handleStreamClick = (reachId: string) => {
    const streamData: StreamMetadata = {
      reachId: reachId as ReachId,
      name: `Stream ${reachId}`,
      description: 'River segment with flow monitoring',
    };
    
    setSelectedStreamData(streamData);
    setShowStreamModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowStreamModal(false);
    setSelectedStreamData(undefined);
  };

  return (
    <MapPanel
      modalContent={(showStreamModal && selectedStreamData) ? (
        <StreamPopup
          isOpen={showStreamModal}
          onClose={handleCloseModal}
          streamData={selectedStreamData}
          flowUnit={userPreferences.flowUnit}
          tempUnit={userPreferences.tempUnit}
        />
      ) : undefined}
      onModalBackdropClick={handleCloseModal}
      
      /* Stream ID Search Bar (positioned at top-right) */
      streamSearchOverlay={
        <StreamSearchOverlay 
          map={map}
          includeSmallStreams={true}
          maxResults={50}
          className="w-auto min-w-74"
          data-testid="stream-search-overlay"
          inMapPanel={true}
        />
      }
      
      /* Place/Location Search Bar (positioned below stream search) */
      placeSearchOverlay={
        <SearchBar 
          map={map}
          placeholder="Search for places..."
          className="w-auto min-w-74"
        />
      }

      /* Map Controls (positioned at bottom-right) */
      userToolsOverlay={
        <div className="flex flex-col items-end space-y-3">
          <ViewToggle />
          <BaseMapSelector />
        </div>
      }
    >
      <Map 
        onReady={setMap} 
        onPickReach={handleStreamClick}
        showStreams={true}
        showStreamSearch={false}
      />
    </MapPanel>
  );
};

// Main content component
const AppContent = () => {
  const { currentView } = useAppContext();
  
  if (currentView === 'map') {
    return <MapScreen />;
  }
  
  // For dashboard view, return nothing - DashboardPanel will render its own widgets
  return null;
};

// Clean entry point
export default function Page() {
  return (
    <AppShell>
      <AppContent />
      <MobileNavigation />
    </AppShell>
  );
}