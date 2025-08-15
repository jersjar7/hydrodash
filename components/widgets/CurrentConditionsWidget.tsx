// components/widgets/CurrentConditionsWidget.tsx
'use client';

import React from 'react';
import { useAppContext, isRiverReach, getLocationProps } from '@/components/Layout/AppShell';
import { 
  useShortRangeForecast, 
  getCurrentFlow, 
  getPeakFlow 
} from '@/hooks/useFlowData';
import { getReachDisplayName } from '@/hooks/useReachMetadata';
import type { RiskLevel } from '@/types';

interface CurrentConditionsWidgetProps {
  /** Custom className for styling */
  className?: string;
  /** Show detailed information */
  showDetails?: boolean;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

const CurrentConditionsWidget: React.FC<CurrentConditionsWidgetProps> = ({
  className = '',
  showDetails = true,
  'data-testid': testId,
}) => {
  // Get active location from AppShell context
  const { activeLocation, userPreferences } = useAppContext();
  const locationProps = getLocationProps(activeLocation);
  
  // Get reach ID if active location is a RiverReach
  const reachId = isRiverReach(activeLocation) ? activeLocation.reachId : locationProps?.reachId || null;
  
  // Fetch short-range forecast for current conditions
  const { 
    data: forecastData, 
    isLoading, 
    error 
  } = useShortRangeForecast(reachId, {
    enabled: !!reachId,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes for current conditions
  });

  // Extract current flow and other metrics
  const currentFlow = getCurrentFlow(forecastData);
  const peakFlow = getPeakFlow(forecastData);
  const riskLevel = forecastData?.risk || 'normal';
  
  // Format flow value with proper units
  const formatFlow = (flow: number | null): string => {
    if (flow === null) return '--';
    
    const unit = userPreferences.flowUnit || 'CFS';
    if (unit === 'CMS') {
      // Convert CFS to CMS (divide by 35.314666721)
      const flowCMS = flow / 35.314666721;
      return `${flowCMS.toLocaleString(undefined, { maximumFractionDigits: 1 })} CMS`;
    }
    
    return `${flow.toLocaleString(undefined, { maximumFractionDigits: 0 })} CFS`;
  };

  // Get risk level styling and text
  const getRiskLevelStyle = (risk: RiskLevel) => {
    const styles = {
      normal: {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-800 dark:text-green-200',
        label: 'Normal',
        icon: '✓'
      },
      elevated: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'text-yellow-800 dark:text-yellow-200',
        label: 'Elevated',
        icon: '⚠️'
      },
      high: {
        bg: 'bg-orange-100 dark:bg-orange-900/20',
        text: 'text-orange-800 dark:text-orange-200',
        label: 'High',
        icon: '🔶'
      },
      flood: {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-200',
        label: 'Flood Risk',
        icon: '🚨'
      }
    };
    
    return styles[risk] || styles.normal;
  };

  // Calculate flow trend (simplified)
  const getFlowTrend = () => {
    if (!forecastData?.series?.[0]?.points || forecastData.series[0].points.length < 2) {
      return null;
    }
    
    const points = forecastData.series[0].points;
    const current = points[0]?.q || 0;
    const next = points[1]?.q || 0;
    
    if (next > current * 1.1) return { direction: 'rising', icon: '↗️' };
    if (next < current * 0.9) return { direction: 'falling', icon: '↘️' };
    return { direction: 'stable', icon: '→' };
  };

  const trend = getFlowTrend();
  const riskStyle = getRiskLevelStyle(riskLevel);

  // Loading state
  if (isLoading) {
    return (
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
        data-testid={testId}
      >
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
        data-testid={testId}
      >
        <div className="text-center py-4">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            Data Unavailable
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Unable to load current conditions
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  // No data state
  if (!reachId || !forecastData) {
    return (
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
        data-testid={testId}
      >
        <div className="text-center py-4">
          <div className="text-gray-400 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No Stream Selected
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a stream on the map to view current flow conditions
          </p>
        </div>
      </div>
    );
  }

  // Main widget content
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
      data-testid={testId}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Current Conditions
        </h3>
        <div className="flex items-center space-x-2">
          {trend && (
            <span className="text-sm text-gray-500 dark:text-gray-400" title={`Flow ${trend.direction}`}>
              {trend.icon}
            </span>
          )}
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live data"></div>
        </div>
      </div>

      {/* Location name */}
      {locationProps && (
        <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {locationProps.name}
          </h4>
        </div>
      )}

      {/* Conditions */}
      <div className="space-y-4">
        {/* Flow Rate */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Flow Rate</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatFlow(currentFlow)}
            </span>
            {trend && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {trend.direction} {trend.icon}
              </div>
            )}
          </div>
        </div>

        {/* Risk Level */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Risk Level</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskStyle.bg} ${riskStyle.text}`}>
            {riskStyle.icon} {riskStyle.label}
          </span>
        </div>

        {/* Peak Flow (if available and different from current) */}
        {showDetails && peakFlow && peakFlow !== currentFlow && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Peak Flow</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatFlow(peakFlow)}
            </span>
          </div>
        )}

        {/* Data freshness */}
        {forecastData?.series?.[0]?.points?.[0] && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Last Update</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(forecastData.series[0].points[0].t).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        )}
      </div>

      {/* Additional details if enabled */}
      {showDetails && forecastData?.series?.[0]?.points && forecastData.series[0].points.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Forecast available for next {forecastData.series[0].points.length - 1} hours
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentConditionsWidget;