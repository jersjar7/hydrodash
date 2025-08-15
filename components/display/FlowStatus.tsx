// components/display/FlowStatus.tsx
'use client';

import React from 'react';

export type RiskLevel = 'normal' | 'elevated' | 'high' | 'flood';
export type FlowUnit = 'CFS' | 'CMS';

interface FlowStatusProps {
  /** Current flow value */
  flow: number;
  /** Risk level category */
  riskLevel: RiskLevel;
  /** Flow unit (CFS or CMS) */
  unit?: FlowUnit;
  /** Display variant */
  variant?: 'compact' | 'detailed';
  /** Custom className */
  className?: string;
}

// Risk level styling
const riskStyles = {
  normal: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    border: 'border-green-300 dark:border-green-700',
    text: 'text-green-800 dark:text-green-300',
    dot: 'bg-green-500',
    label: 'Normal',
  },
  elevated: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-800 dark:text-yellow-300',
    dot: 'bg-yellow-500',
    label: 'Elevated',
  },
  high: {
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    border: 'border-orange-300 dark:border-orange-700',
    text: 'text-orange-800 dark:text-orange-300',
    dot: 'bg-orange-500',
    label: 'High',
  },
  flood: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-800 dark:text-red-300',
    dot: 'bg-red-500',
    label: 'Flood',
  },
};

const FlowStatus: React.FC<FlowStatusProps> = ({
  flow,
  riskLevel,
  unit = 'CFS',
  variant = 'compact',
  className = '',
}) => {
  const styles = riskStyles[riskLevel];
  
  // Format flow value for display
  const formatFlow = (value: number): string => {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toLocaleString();
  };

  if (variant === 'detailed') {
    return (
      <div className={`
        flex items-center justify-between p-3 rounded-lg border
        ${styles.bg} ${styles.border} ${className}
      `}>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${styles.dot}`} />
          <div>
            <p className={`font-medium ${styles.text}`}>
              {styles.label} Flow
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current conditions
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${styles.text}`}>
            {formatFlow(flow)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {unit}
          </p>
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <div className={`
      inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border
      ${styles.bg} ${styles.border} ${className}
    `}>
      <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
      <span className={`text-sm font-medium ${styles.text}`}>
        {formatFlow(flow)} {unit}
      </span>
      <span className={`text-xs ${styles.text} opacity-75`}>
        {styles.label}
      </span>
    </div>
  );
};

// Convenience components for specific use cases
export const CompactFlowStatus: React.FC<Omit<FlowStatusProps, 'variant'>> = (props) => (
  <FlowStatus {...props} variant="compact" />
);

export const DetailedFlowStatus: React.FC<Omit<FlowStatusProps, 'variant'>> = (props) => (
  <FlowStatus {...props} variant="detailed" />
);

export default FlowStatus;