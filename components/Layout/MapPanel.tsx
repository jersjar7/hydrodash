// components/Layout/MapPanel.tsx
'use client';

import React, { useState, useRef } from 'react';
import LoadingSpinner, { MapLoadingSpinner } from '@/components/common/LoadingSpinner';

interface MapPanelProps {
  /** Children components (Map, overlays, controls) */
  children?: React.ReactNode;
  /** Loading state for map initialization */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Custom className */
  className?: string;
  
  // =================================================================================
  // MAP OVERLAYS - CENTRALIZED POSITIONING CONTROL
  // =================================================================================
  // All map overlays should be added here instead of scattered across different files.
  // This provides a single source of truth for overlay positioning and z-index management.
  
  /** Place/location search bar overlay (positioned top-right, below stream search) */
  placeSearchOverlay?: React.ReactNode;
  
  /** Stream ID search bar overlay (positioned top-right, above place search) */
  streamSearchOverlay?: React.ReactNode;
  
  // ADD NEW OVERLAYS HERE:
  /** Weather overlay */
  weatherOverlay?: React.ReactNode;
  
  /** Layers control overlay */
  layersOverlay?: React.ReactNode;
  
  /** User tools overlay */
  userToolsOverlay?: React.ReactNode;
  
  /** Status/info overlay */
  statusOverlay?: React.ReactNode;
  
  // =================================================================================
  // LEGACY PROPS - TO BE DEPRECATED
  // =================================================================================
  /** @deprecated Use specific overlay props instead */
  controls?: React.ReactNode;
  
  // =================================================================================
  // PANEL & MODAL PROPS
  // =================================================================================
  /** Bottom panel content (stream info, etc.) */
  bottomPanel?: React.ReactNode;
  /** Show/hide bottom panel */
  showBottomPanel?: boolean;
  /** Modal content (stream info modal, etc.) */
  modalContent?: React.ReactNode;
  /** Modal backdrop click handler */
  onModalBackdropClick?: () => void;
  /** Whether sidebar is open (affects modal backdrop positioning) */
  sidebarOpen?: boolean;
  /** Sidebar width in pixels (default: 400 to match SidebarOverlay) */
  sidebarWidth?: number;
}

const MapPanel: React.FC<MapPanelProps> = ({
  children,
  loading = false,
  error,
  className = '',
  
  // Map overlays
  placeSearchOverlay,
  streamSearchOverlay,
  weatherOverlay,
  layersOverlay,
  userToolsOverlay,
  statusOverlay,
  

  
  // Panels and modals
  bottomPanel,
  showBottomPanel = false,
  modalContent,
  onModalBackdropClick,
  sidebarOpen = false,
  sidebarWidth = 400,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Error state
  if (error) {
    return (
      <div className={`relative h-full overflow-hidden bg-gray-100 dark:bg-gray-900 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Map Error
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full overflow-hidden ${className}`}>
      {/* 
        Z-INDEX HIERARCHY DOCUMENTATION:
        z-0:  Map base layer
        z-10: Bottom panel, map attribution
        z-20: Map overlays (search bars, controls), bottom panel toggle
        z-30: Loading overlays, error states
        z-40: Modal backdrops, dropdown menus from overlays, sidebar (same level)
        z-50: Modals (stream info, etc.)
        z-60: Modal close buttons, critical overlays
      */}

      {/* =================================================================================
          MAP OVERLAYS - POSITIONED AND CONTROLLED HERE
          =================================================================================
          All overlay positioning is managed in this section. When adding new overlays:
          1. Add the prop to MapPanelProps interface above
          2. Add positioning here with appropriate z-index
          3. Update page.tsx to pass the overlay component
          4. Use pointer-events-none on containers, pointer-events-auto on interactive elements
      */}

      {/* Top-Left Overlay Stack */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none space-y-3">
        
        {/* Status/Info Overlays */}
        {statusOverlay && (
          <div className="pointer-events-auto">
            {statusOverlay}
          </div>
        )}
        
      </div>

      {/* Top-Right Overlay Stack - Search Bars & Controls */}
      <div className="absolute top-10 right-4 z-20 pointer-events-none space-y-3">
        
        {/* Stream ID Search Overlay (Primary search - positioned first/top) */}
        {streamSearchOverlay && (
          <div className="pointer-events-auto">
            {streamSearchOverlay}
          </div>
        )}
        
        {/* Place Search Overlay (Secondary search - positioned below) */}
        {placeSearchOverlay && (
          <div className="pointer-events-auto">
            {placeSearchOverlay}
          </div>
        )}
        
        {/* Layers Control */}
        {layersOverlay && (
          <div className="pointer-events-auto">
            {layersOverlay}
          </div>
        )}
        
        {/* Weather Control */}
        {weatherOverlay && (
          <div className="pointer-events-auto">
            {weatherOverlay}
          </div>
        )}
        
      </div>

      {/* Bottom-Left Overlay Stack */}
      <div className="absolute bottom-20 left-4 z-20 pointer-events-none space-y-3">
        
        {/* Add bottom-left overlays here */}
        
      </div>

      {/* Bottom-Right Overlay Stack - Tools & Actions */}
      <div className="absolute bottom-20 right-4 z-20 pointer-events-none space-y-3">
        
        {/* User Tools */}
        {userToolsOverlay && (
          <div className="pointer-events-auto">
            {userToolsOverlay}
          </div>
        )}
        
      </div>

      {/* =================================================================================
          MAIN MAP CONTAINER
          ================================================================================= */}
      <div 
        ref={mapContainerRef}
        className="h-full w-full relative z-0"
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-30">
            <MapLoadingSpinner text="Loading map..." />
          </div>
        )}

        {/* Map Content */}
        {children}
      </div>

      {/* =================================================================================
          BOTTOM PANEL
          ================================================================================= */}
      {bottomPanel && (
        <div 
          className={`
            absolute bottom-0 left-0 right-0 z-10 h-80
            bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700
            shadow-lg transition-transform duration-300 ease-in-out
            ${showBottomPanel ? 'translate-y-0' : 'translate-y-full'}
          `}
        >
          <div className="h-full overflow-y-auto">
            {bottomPanel}
          </div>
        </div>
      )}

      {/* Bottom Panel Toggle (when panel content exists) */}
      {bottomPanel && (
        <button
          className={`
            absolute bottom-4 right-4 z-20
            bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg
            text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white
            border border-gray-200 dark:border-gray-700
            transition-all duration-200
            ${showBottomPanel ? 'transform rotate-180' : ''}
          `}
          onClick={() => {
            // This would typically call a prop callback
            // For now, it's just visual - parent manages showBottomPanel state
          }}
          aria-label={showBottomPanel ? 'Hide panel' : 'Show panel'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* =================================================================================
          MODAL OVERLAY - Stream Info Modal, etc.
          ================================================================================= */}
      {modalContent && (
        <>
          {/* Modal Backdrop - Positioned to avoid sidebar area */}
          <div 
            className="absolute top-0 bottom-0 right-0 z-40 bg-black/50 backdrop-blur-sm"
            style={{
              // ✅ FIXED: Only cover map area, not sidebar area
              left: sidebarOpen ? `${sidebarWidth}px` : '0px'
            }}
            onClick={onModalBackdropClick}
            aria-label="Close modal"
          />
          
          {/* Modal Container - Positioned to center within available space */}
          <div 
            className="absolute top-0 bottom-0 right-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            style={{
              // ✅ FIXED: Center modal within non-sidebar area
              left: sidebarOpen ? `${sidebarWidth}px` : '0px'
            }}
          >
            <div className="pointer-events-auto">
              {modalContent}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Specialized map panel variants
export const FullScreenMapPanel: React.FC<Omit<MapPanelProps, 'className'>> = (props) => (
  <MapPanel {...props} className="fixed inset-0 z-30" />
);

export const EmbeddedMapPanel: React.FC<Omit<MapPanelProps, 'className'>> = (props) => (
  <MapPanel {...props} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700" />
);

export default MapPanel;