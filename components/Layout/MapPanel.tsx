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
  /** Map controls (search, layers, etc.) */
  controls?: React.ReactNode;
  /** Bottom panel content (stream info, etc.) */
  bottomPanel?: React.ReactNode;
  /** Show/hide bottom panel */
  showBottomPanel?: boolean;
  /** Modal content (stream info modal, etc.) */
  modalContent?: React.ReactNode;
  /** Modal backdrop click handler */
  onModalBackdropClick?: () => void;
}

const MapPanel: React.FC<MapPanelProps> = ({
  children,
  loading = false,
  error,
  className = '',
  controls,
  bottomPanel,
  showBottomPanel = false,
  modalContent,
  onModalBackdropClick,
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
        z-20: Map controls, overlays, bottom panel toggle
        z-30: Loading overlays, error states
        z-40: Modal backdrops
        z-50: Modals (stream info, etc.)
        z-60: Modal close buttons, critical overlays
      */}

      {/* Map Controls Overlay */}
      {controls && (
        <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
          <div className="pointer-events-auto">
            {controls}
          </div>
        </div>
      )}

      {/* Main Map Container */}
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

      {/* Bottom Panel */}
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

      {/* Map Attribution/Credits */}
      <div className="absolute bottom-2 left-2 z-10">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400">
          © Apple Maps
        </div>
      </div>

      {/* Modal Overlay - Stream Info Modal, etc. */}
      {modalContent && (
        <>
          {/* Modal Backdrop */}
          <div 
            className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onModalBackdropClick}
            aria-label="Close modal"
          />
          
          {/* Modal Container */}
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
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