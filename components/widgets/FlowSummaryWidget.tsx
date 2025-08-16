// components/widgets/FlowSummaryWidget.tsx
'use client';

import React, { useMemo } from 'react';
import { useAppContext, isRiverReach, getLocationProps } from '@/components/Layout/AppShell';
import { 
  useShortRangeForecast, 
  useMediumRangeForecast,
  getCurrentFlow, 
  getPeakFlow 
} from '@/hooks/useFlowData';
import { getReachDisplayName } from '@/hooks/useReachMetadata';
import type { RiskLevel, NormalizedFlowForecast } from '@/types';

interface FlowSummaryWidgetProps {
  /** Custom className for styling */
  className?: string;
  /** Show detailed statistics */
  showDetails?: boolean;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

interface FlowStatistics {
  current: number | null;
  min: number | null;
  max: number | null;
  average: number | null;
  peak: number | null;
  trend: 'rising' | 'falling' | 'stable' | null;
  level: 'low' | 'normal' | 'high' | 'flood';
  changePercent: number | null;
}

const FlowSummaryWidget: React.FC<FlowSummaryWidgetProps> = ({
  className = '',
  showDetails = true,
  'data-testid': testId,
}) => {
  // Get active location from AppShell context
  const { activeLocation, userPreferences } = useAppContext();
  const locationProps = getLocationProps(activeLocation);
  
  // Get reach ID if active location is a RiverReach
  const reachId = isRiverReach(activeLocation) ? 
    activeLocation.reachId : locationProps?.reachId || null;
  
  // Fetch forecast data for statistics calculation
  const { 
    data: shortRangeData, 
    isLoading: shortLoading, 
    error: shortError 
  } = useShortRangeForecast(reachId, {
    enabled: !!reachId,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const { 
    data: mediumRangeData, 
    isLoading: mediumLoading, 
    error: mediumError 
  } = useMediumRangeForecast(reachId, {
    enabled: !!reachId,
  });

  // Calculate flow statistics from forecast data
  const flowStats: FlowStatistics = useMemo(() => {
    if (!shortRangeData?.series?.[0]?.points?.length) {
      return {
        current: null,
        min: null,
        max: null,
        average: null,
        peak: null,
        trend: null,
        level: 'normal',
        changePercent: null,
      };
    }

    const points = shortRangeData.series[0].points;
    const flows = points.map(p => p.q).filter(q => q !== null && q !== undefined);
    
    if (flows.length === 0) {
      return {
        current: null,
        min: null,
        max: null,
        average: null,
        peak: null,
        trend: null,
        level: 'normal',
        changePercent: null,
      };
    }

    const current = flows[0];
    const min = Math.min(...flows);
    const max = Math.max(...flows);
    const average = flows.reduce((sum, flow) => sum + flow, 0) / flows.length;
    const peak = getPeakFlow(shortRangeData);

    // Calculate trend (comparing first few and last few hours)
    let trend: 'rising' | 'falling' | 'stable' | null = null;
    if (flows.length >= 4) {
      const firstThird = flows.slice(0, Math.floor(flows.length / 3));
      const lastThird = flows.slice(-Math.floor(flows.length / 3));
      const firstAvg = firstThird.reduce((sum, flow) => sum + flow, 0) / firstThird.length;
      const lastAvg = lastThird.reduce((sum, flow) => sum + flow, 0) / lastThird.length;
      
      if (lastAvg > firstAvg * 1.1) trend = 'rising';
      else if (lastAvg < firstAvg * 0.9) trend = 'falling';
      else trend = 'stable';
    }

    // Calculate change percentage from current to peak
    const changePercent = current && peak ? ((peak - current) / current) * 100 : null;

    // Determine flow level based on risk assessment
    const riskLevel = shortRangeData.risk || 'normal';
    let level: 'low' | 'normal' | 'high' | 'flood';
    switch (riskLevel) {
      case 'flood': level = 'flood'; break;
      case 'high': level = 'high'; break;
      case 'elevated': level = 'high'; break;
      default: 
        // Use flow value relative to average for low/normal classification
        if (current && current < average * 0.7) level = 'low';
        else level = 'normal';
    }

    return {
      current,
      min,
      max,
      average,
      peak,
      trend,
      level,
      changePercent,
    };
  }, [shortRangeData]);

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

  // Get flow level styling and text
  const getFlowLevelStyle = (level: string) => {
    const styles = {
      low: {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        text: 'text-blue-800 dark:text-blue-200',
        label: 'Low Flow',
        icon: '🔵'
      },
      normal: {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-800 dark:text-green-200',
        label: 'Normal',
        icon: '✓'
      },
      high: {
        bg: 'bg-orange-100 dark:bg-orange-900/20',
        text: 'text-orange-800 dark:text-orange-200',
        label: 'High Flow',
        icon: '🔶'
      },
      flood: {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-200',
        label: 'Flood Stage',
        icon: '🚨'
      }
    };
    
    return styles[level as keyof typeof styles] || styles.normal;
  };

  // Get trend icon and text
  const getTrendDisplay = (trend: string | null) => {
    switch (trend) {
      case 'rising': return { icon: '📈', text: 'Rising', color: 'text-red-600 dark:text-red-400' };
      case 'falling': return { icon: '📉', text: 'Falling', color: 'text-blue-600 dark:text-blue-400' };
      case 'stable': return { icon: '➡️', text: 'Stable', color: 'text-gray-600 dark:text-gray-400' };
      default: return { icon: '❓', text: 'Unknown', color: 'text-gray-500 dark:text-gray-500' };
    }
  };

  const isLoading = shortLoading || mediumLoading;
  const error = shortError || mediumError;
  const levelStyle = getFlowLevelStyle(flowStats.level);
  const trendDisplay = getTrendDisplay(flowStats.trend);

  // Loading state
  if (isLoading) {
    return (
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
        data-testid={testId}
      >
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-18"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
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
            Unable to load flow statistics
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  // No data state
  if (!reachId || !shortRangeData) {
    return (
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
        data-testid={testId}
      >
        <div className="text-center py-4">
          <div className="text-gray-400 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No Stream Selected
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a stream on the map to view flow statistics
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
          Flow Summary
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelStyle.bg} ${levelStyle.text}`}>
            {levelStyle.icon} {levelStyle.label}
          </span>
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

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Current Flow */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatFlow(flowStats.current)}
          </p>
        </div>

        {/* Peak Flow */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Peak</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatFlow(flowStats.peak)}
          </p>
        </div>
      </div>

      {/* Detailed Statistics */}
      {showDetails && (
        <div className="space-y-3">
          {/* Flow Range */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Range</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatFlow(flowStats.min)} - {formatFlow(flowStats.max)}
            </span>
          </div>

          {/* Average Flow */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Average</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatFlow(flowStats.average)}
            </span>
          </div>

          {/* Trend */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Trend</span>
            <div className="flex items-center space-x-1">
              <span className="text-sm">{trendDisplay.icon}</span>
              <span className={`text-sm font-medium ${trendDisplay.color}`}>
                {trendDisplay.text}
              </span>
            </div>
          </div>

          {/* Change Percentage */}
          {flowStats.changePercent !== null && Math.abs(flowStats.changePercent) > 5 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Expected Change</span>
              <span className={`text-sm font-medium ${
                flowStats.changePercent > 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                {flowStats.changePercent > 0 ? '+' : ''}{flowStats.changePercent.toFixed(1)}%
              </span>
            </div>
          )}

          {/* Data freshness */}
          {shortRangeData?.series?.[0]?.points?.[0] && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Last Update</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(shortRangeData.series[0].points[0].t).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Forecast Period Indicator */}
      {showDetails && shortRangeData?.series?.[0]?.points && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Statistics based on {shortRangeData.series[0].points.length}-hour forecast
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowSummaryWidget;