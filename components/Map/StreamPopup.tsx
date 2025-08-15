// components/Map/StreamPopup.tsx
'use client';

import React, { useEffect } from 'react';
import { ReachId } from '@/types/models/RiverReach';
import { SavedPlace } from '@/types/models/SavedPlace';
import { RiskLevel } from '@/types/models/FlowForecast';
import { FlowUnit, TempUnit } from '@/types/models/UserPreferences';
import FlowStatus from '@/components/display/FlowStatus';
import WeatherSummary, { WeatherData } from '@/components/display/WeatherSummary';
import Toast from '@/components/common/Toast';

interface StreamMetadata {
  reachId: ReachId;
  name?: string;
  description?: string;
  lat?: number;
  lon?: number;
  streamOrder?: string;
  drainageArea?: number; // in square miles
  gaugeId?: string;
  lastUpdated?: string;
}

interface StreamPopupProps {
  /** Whether popup is open */
  isOpen: boolean;
  /** Callback to close popup */
  onClose: () => void;
  /** Stream metadata */
  streamData?: StreamMetadata;
  /** Current flow conditions */
  flowData?: {
    flow: number;
    riskLevel: RiskLevel;
    loading?: boolean;
    error?: string;
  };
  /** Current weather data */
  weatherData?: {
    weather?: WeatherData;
    loading?: boolean;
    error?: string;
  };
  /** Flow unit preference */
  flowUnit?: FlowUnit;
  /** Temperature unit preference */
  tempUnit?: TempUnit;
  /** Whether location is already saved */
  isAlreadySaved?: boolean;
  /** Loading state for save action */
  isSaving?: boolean;
  /** Callback to add to saved places */
  onAddToSaved?: (streamData: StreamMetadata) => void;
  /** Callback to view dashboard */
  onViewDashboard?: (streamData: StreamMetadata) => void;
  /** Callback to remove from saved places */
  onRemoveFromSaved?: (reachId: ReachId) => void;
  /** Custom className */
  className?: string;
}

const StreamPopup: React.FC<StreamPopupProps> = ({
  isOpen,
  onClose,
  streamData,
  flowData,
  weatherData,
  flowUnit = 'CFS',
  tempUnit = 'F',
  isAlreadySaved = false,
  isSaving = false,
  onAddToSaved,
  onViewDashboard,
  onRemoveFromSaved,
  className = '',
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle save action
  const handleSave = () => {
    if (streamData && onAddToSaved && !isAlreadySaved) {
      onAddToSaved(streamData);
    }
  };

  // Handle remove action
  const handleRemove = () => {
    if (streamData && onRemoveFromSaved && isAlreadySaved) {
      onRemoveFromSaved(streamData.reachId);
    }
  };

  // Handle dashboard navigation
  const handleViewDashboard = () => {
    if (streamData && onViewDashboard) {
      onViewDashboard(streamData);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className={`
          relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl
          transform transition-all duration-200 ease-out
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 6.8A6.8 6.8 0 0112.8 0a.2.2 0 01.2.2c0 .2-.1.4-.3.4a6 6 0 00-6 6c0 .2-.2.4-.4.4a.2.2 0 01-.2-.2c0-.3-.1-.6-.1-1z" />
                <path d="M3.5 7.5A3.5 3.5 0 017 4a.5.5 0 01.5.5c0 .3-.2.5-.5.5a2.5 2.5 0 00-2.5 2.5c0 .3-.2.5-.5.5a.5.5 0 01-.5-.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {streamData?.name || 'Stream Information'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {streamData?.reachId && `ID: ${streamData.reachId}`}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Stream Metadata */}
          {streamData && (
            <div className="space-y-2">
              {streamData.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {streamData.description}
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(streamData.lat && streamData.lon) && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Location:</span>
                    <p className="font-medium text-gray-900 dark:text-white font-mono">
                      {streamData.lat.toFixed(4)}, {streamData.lon.toFixed(4)}
                    </p>
                  </div>
                )}
                
                {streamData.streamOrder && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Stream Order:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {streamData.streamOrder}
                    </p>
                  </div>
                )}
                
                {streamData.drainageArea && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Drainage Area:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {streamData.drainageArea.toLocaleString()} mi²
                    </p>
                  </div>
                )}
                
                {streamData.gaugeId && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Gauge ID:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {streamData.gaugeId}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current Flow Status */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Current Flow</h4>
            {flowData?.loading ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span>Loading flow data...</span>
              </div>
            ) : flowData?.error ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Flow data unavailable
              </p>
            ) : flowData ? (
              <FlowStatus
                flow={flowData.flow}
                riskLevel={flowData.riskLevel}
                unit={flowUnit}
                variant="detailed"
              />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No flow data available
              </p>
            )}
          </div>

          {/* Current Weather */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Local Weather</h4>
            <WeatherSummary
              weather={weatherData?.weather}
              loading={weatherData?.loading}
              error={weatherData?.error}
              variant="card"
            />
          </div>

          {/* Last Updated */}
          {streamData?.lastUpdated && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Last updated: {new Date(streamData.lastUpdated).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-3">
            {/* Save/Remove Button */}
            <button
              onClick={isAlreadySaved ? handleRemove : handleSave}
              disabled={isSaving}
              className={`
                flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${isAlreadySaved 
                  ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30'
                }
                ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : isAlreadySaved ? (
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2V3a2 2 0 012 2v6a4 4 0 01-4 4H6a4 4 0 01-4-4V5z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M12 9a1 1 0 100-2H8a1 1 0 000 2h4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              {isAlreadySaved ? 'Remove' : 'Save Place'}
            </button>

            {/* View Dashboard Button */}
            <button
              onClick={handleViewDashboard}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamPopup;