// components/modals/StreamInfoModal.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppContext } from '@/components/Layout/AppShell';
import type { StreamModalData } from '@/components/Layout/AppShell';
import type { ReachId, RiverReach } from '@/types/models/RiverReach';
import type { NormalizedFlowForecast, RiskLevel } from '@/types/models/FlowForecast';
import type { ReturnPeriodThresholds } from '@/types/models/ReturnPeriod';
import type { WeatherForecast } from '@/types/models/WeatherForecast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import WeatherSummary, { type WeatherData } from '@/components/display/WeatherSummary';
import { useShortRangeForecast, getCurrentFlow, getPeakFlow } from '@/hooks/useFlowData';
import { useReachMetadata } from '@/hooks/useReachMetadata';
import { useSavedPlaces } from '@/hooks/useSavedPlaces';
import { computeRisk } from '@/lib/utils/riskCalculator';
import { cmsToCfs, cfsToCms } from '@/lib/utils/units';
import { publicConfig } from '@/config';

interface StreamInfoModalProps {
  /** Custom className */
  className?: string;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

interface StreamAnalysis {
  currentRisk: RiskLevel;
  peakFlow: {
    value: number;
    timestamp: string;
    returnPeriod?: number;
  } | null;
  trend: 'rising' | 'falling' | 'stable';
  forecastLength: number;
  lastUpdated: string;
}

const StreamInfoModal: React.FC<StreamInfoModalProps> = ({
  className = '',
  'data-testid': testId,
}) => {
  const {
    streamModalOpen,
    selectedStreamData,
    closeStreamModal,
    viewStreamDashboard,
    saveLocationFromReach,
    userPreferences,
  } = useAppContext();

  const modalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [analysis, setAnalysis] = useState<StreamAnalysis | null>(null);

  // Get saved places to check if stream is already saved
  const { hasPlace } = useSavedPlaces();

  // Fetch detailed river reach metadata
  const {
    data: reachData,
    isLoading: reachLoading,
    error: reachError,
    refetch: refetchReach,
  } = useReachMetadata(selectedStreamData?.reachId || null, {
    enabled: streamModalOpen && !!selectedStreamData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch short-range flow forecast data
  const {
    data: flowData,
    isLoading: flowLoading,
    error: flowError,
    refetch: refetchFlow,
    dataUpdatedAt: flowUpdatedAt,
  } = useShortRangeForecast(selectedStreamData?.reachId || null, {
    enabled: streamModalOpen && !!selectedStreamData,
    staleTime: 2 * 60 * 1000, // 2 minutes for flow data
  });

  // Check if stream is already saved
  const isStreamSaved = useCallback(() => {
    if (!selectedStreamData) return false;
    return hasPlace(selectedStreamData.reachId);
  }, [selectedStreamData, hasPlace]);

  // Analyze flow data to extract insights
  const analyzeFlowData = useCallback((forecast: NormalizedFlowForecast, thresholds?: ReturnPeriodThresholds) => {
    if (!forecast.series || forecast.series.length === 0) return null;

    // Get current flow from the forecast
    const currentFlow = getCurrentFlow(forecast);
    const peakFlowValue = getPeakFlow(forecast);

    if (currentFlow === null) return null;

    // Calculate risk level using return period thresholds
    let currentRisk: RiskLevel = 'normal';
    if (thresholds) {
      currentRisk = computeRisk(currentFlow, thresholds);
    }

    // Find the actual peak flow point for timestamp
    const allPoints = forecast.series.flatMap(s => s.points);
    const peakPoint = allPoints.find(p => p.q === peakFlowValue) || allPoints[0];

    // Determine trend (looking at first 6 points)
    const recentPoints = allPoints.slice(0, Math.min(6, allPoints.length));
    if (recentPoints.length < 2) {
      return {
        currentRisk,
        peakFlow: peakPoint ? {
          value: peakPoint.q,
          timestamp: peakPoint.t,
        } : null,
        trend: 'stable' as const,
        forecastLength: allPoints.length,
        lastUpdated: new Date().toISOString(),
      };
    }

    const firstFlow = recentPoints[0].q;
    const lastFlow = recentPoints[recentPoints.length - 1].q;
    const threshold = firstFlow * 0.05; // 5% threshold for stability

    const trend = Math.abs(lastFlow - firstFlow) < threshold ? 'stable' :
                  lastFlow > firstFlow ? 'rising' : 'falling';

    // Calculate return period for peak flow if thresholds available
    let peakReturnPeriod: number | undefined;
    if (thresholds && peakFlowValue !== null) {
      if (peakFlowValue >= thresholds.rp100) peakReturnPeriod = 100;
      else if (peakFlowValue >= thresholds.rp50) peakReturnPeriod = 50;
      else if (peakFlowValue >= thresholds.rp25) peakReturnPeriod = 25;
      else if (peakFlowValue >= thresholds.rp10) peakReturnPeriod = 10;
      else if (peakFlowValue >= thresholds.rp5) peakReturnPeriod = 5;
      else if (peakFlowValue >= thresholds.rp2) peakReturnPeriod = 2;
    }

    return {
      currentRisk,
      peakFlow: peakPoint ? {
        value: peakPoint.q,
        timestamp: peakPoint.t,
        returnPeriod: peakReturnPeriod,
      } : null,
      trend,
      forecastLength: allPoints.length,
      lastUpdated: new Date().toISOString(),
    };
  }, []);

//   // Update analysis when flow data changes
//   useEffect(() => {
//     if (flowData) {
//       // For now, we don't have return periods in the basic flow data
//       // In a real implementation, you'd fetch this separately
//       const newAnalysis = analyzeFlowData(flowData);
//       setAnalysis(newAnalysis);
//     }
//   }, [flowData, analyzeFlowData]);

  // Handle escape key and accessibility
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && streamModalOpen) {
        closeStreamModal();
      }
    };

    if (streamModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [streamModalOpen, closeStreamModal]);

  // Focus management for accessibility
  useEffect(() => {
    if (streamModalOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [streamModalOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!streamModalOpen) {
      setError(null);
      setSaveSuccess(false);
      setAnalysis(null);
    }
  }, [streamModalOpen]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeStreamModal();
    }
  };

  // Handle Add button - save as new place
  const handleAddPlace = async () => {
    if (!selectedStreamData || !reachData) return;

    setIsLoading(true);
    setError(null);

    try {
      // Validate required data
      if (!reachData.reachId || !reachData.latitude || !reachData.longitude) {
        throw new Error('Incomplete stream data - cannot save location');
      }

      // Create enhanced RiverReach object with actual available data
      const enhancedReach: RiverReach = {
        reachId: reachData.reachId,
        name: reachData.name || selectedStreamData.name || `Reach ${reachData.reachId}`,
        latitude: reachData.latitude,
        longitude: reachData.longitude,
        streamflow: reachData.streamflow || [],
        route: reachData.route,
      };

      // Determine place type based on analysis
      let placeType: 'home' | 'work' | 'recreation' | 'other' = 'recreation';
      if (analysis?.currentRisk === 'flood' || analysis?.currentRisk === 'high') {
        placeType = 'other'; // Safety-related monitoring
      }

      // Save the location using the context function
      saveLocationFromReach(enhancedReach, placeType);
      
      setSaveSuccess(true);
      
      // Auto-close modal after success
      setTimeout(() => {
        closeStreamModal();
      }, 1500);

      // Track analytics event if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'stream_saved', {
          event_category: 'user_interaction',
          event_label: reachData.reachId,
          value: 1,
        });
      }
    } catch (err) {
      console.error('Failed to save stream location:', err);
      setError(err instanceof Error ? err.message : 'Failed to save location');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle View button - go to dashboard
  const handleViewDashboard = () => {
    if (!selectedStreamData) return;
    
    // Track analytics event if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'stream_viewed', {
        event_category: 'user_interaction',
        event_label: selectedStreamData.reachId,
        value: 1,
      });
    }
    
    viewStreamDashboard(selectedStreamData);
  };

  // Handle data refresh
  const handleRefreshData = async () => {
    setError(null);
    try {
      await Promise.all([
        refetchReach(),
        refetchFlow(),
      ]);
    } catch (err) {
      setError('Failed to refresh data');
    }
  };

  // Format flow value with proper units and precision
  const formatFlow = (value: number) => {
    const unit = userPreferences.flowUnit || 'CFS';
    if (unit === 'CMS') {
      const flowCMS = cfsToCms(value);
      return `${flowCMS.toLocaleString(undefined, { maximumFractionDigits: 2 })} CMS`;
    }
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} CFS`;
  };

  // Format coordinates
  const formatCoordinates = (lat: number, lon: number) => {
    return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  };

  // Format date/time
  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get risk level styling
  const getRiskStyling = (risk: RiskLevel) => {
    switch (risk) {
      case 'flood':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'elevated':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'normal':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: 'rising' | 'falling' | 'stable') => {
    switch (trend) {
      case 'rising':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />;
      case 'falling':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />;
      case 'stable':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />;
    }
  };

  // Don't render if modal is closed
  if (!streamModalOpen || !selectedStreamData) {
    return null;
  }

  const isDataLoading = reachLoading || flowLoading;
  const hasDataError = reachError || flowError;
  const streamAlreadySaved = isStreamSaved();

  return (
    <ErrorBoundary
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm">
            <p className="text-red-600 dark:text-red-400">Failed to load stream information</p>
            <button onClick={closeStreamModal} className="mt-4 px-4 py-2 bg-gray-200 rounded">Close</button>
          </div>
        </div>
      }
    >
      <div
        className={`
          fixed inset-0 z-50 flex items-center justify-center p-4
          bg-black bg-opacity-50 backdrop-blur-sm
          ${className}
        `}
        onClick={handleBackdropClick}
        data-testid={testId}
      >
        {/* Modal Container */}
        <div
          ref={modalRef}
          className="
            relative w-full max-w-2xl bg-white dark:bg-gray-800 
            rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
            transform transition-all duration-200 ease-out max-h-[90vh] overflow-hidden
            animate-in fade-in-0 zoom-in-95
          "
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                  Stream Information
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {reachData?.name || selectedStreamData.name || `Reach ${selectedStreamData.reachId}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Refresh button */}
              <button
                onClick={handleRefreshData}
                disabled={isDataLoading}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Refresh data"
              >
                <svg className={`w-5 h-5 ${isDataLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              <button
                onClick={closeStreamModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="p-6">
              <div id="modal-description" className="space-y-6">
                {/* Loading State */}
                {isDataLoading && (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" color="primary" />
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading stream data...</span>
                  </div>
                )}

                {/* Error State */}
                {hasDataError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="font-medium text-red-800 dark:text-red-200">Data Loading Error</h4>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          {(reachError as Error)?.message || (flowError as Error)?.message || 'Failed to load stream information'}
                        </p>
                        <button
                          onClick={handleRefreshData}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success State */}
                {saveSuccess && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Stream saved successfully!
                      </span>
                    </div>
                  </div>
                )}

                {/* Basic Stream Information */}
                {!isDataLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Details */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm uppercase tracking-wide">
                        Stream Details
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Reach ID</span>
                          <span className="text-sm text-gray-900 dark:text-white font-mono">
                            {selectedStreamData.reachId}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
                          <span className="text-sm text-gray-900 dark:text-white font-mono">
                            {formatCoordinates(selectedStreamData.lat, selectedStreamData.lon)}
                          </span>
                        </div>

                        {reachData?.streamflow && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Forecasts Available</span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {reachData.streamflow.length} types
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Current Flow Status */}
                    {analysis && (
                      <div className={`rounded-lg p-4 border ${getRiskStyling(analysis.currentRisk)}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-sm uppercase tracking-wide">
                            Current Status
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskStyling(analysis.currentRisk)}`}>
                            {analysis.currentRisk.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {getCurrentFlow(flowData) !== null && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Current Flow</span>
                              <span className="text-lg font-semibold">
                                {formatFlow(getCurrentFlow(flowData)!)}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Trend</span>
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {getTrendIcon(analysis.trend)}
                              </svg>
                              <span className="text-sm capitalize">{analysis.trend}</span>
                            </div>
                          </div>
                          
                          {analysis.peakFlow && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Peak (Forecast)</span>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {formatFlow(analysis.peakFlow.value)}
                                </div>
                                {analysis.peakFlow.returnPeriod && (
                                  <div className="text-xs opacity-75">
                                    {analysis.peakFlow.returnPeriod}-year event
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs opacity-75 pt-2 border-t border-current border-opacity-20">
                            Updated: {formatDateTime(analysis.lastUpdated)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Forecast Summary */}
                {flowData && analysis && !isDataLoading && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm uppercase tracking-wide mb-3">
                      Forecast Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Forecast Length:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-medium">
                          {analysis.forecastLength} points
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Data Source:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-medium">
                          NOAA NWM
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Model Run:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-medium">
                          {formatDateTime(new Date(flowUpdatedAt).toISOString())}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Range:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-medium">
                          Short (18h)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Error Display */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={closeStreamModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            
            <button
              onClick={handleAddPlace}
              disabled={isLoading || !reachData || streamAlreadySaved || saveSuccess}
              className="
                flex items-center space-x-2 px-4 py-2 text-sm font-medium 
                bg-green-600 hover:bg-green-700 text-white rounded-lg 
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              "
              title={streamAlreadySaved ? 'Stream already saved' : 'Save stream to your places'}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : saveSuccess ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              <span>
                {saveSuccess ? 'Saved' : streamAlreadySaved ? 'Already Saved' : 'Add'}
              </span>
            </button>

            <button
              onClick={handleViewDashboard}
              disabled={isLoading || !selectedStreamData}
              className="
                flex items-center space-x-2 px-4 py-2 text-sm font-medium 
                bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>View Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default StreamInfoModal;