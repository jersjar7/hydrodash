// components/common/LoadingSpinner.tsx
'use client';

import React from 'react';

// Core types for the spinner component
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type SpinnerVariant = 'spin' | 'pulse' | 'dots' | 'bars' | 'bounce' | 'wave';
export type SpinnerColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white' | 'gray';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Visual variant of the spinner */
  variant?: SpinnerVariant;
  /** Color scheme */
  color?: SpinnerColor;
  /** Optional loading text */
  text?: string;
  /** Show as overlay (fills parent container) */
  overlay?: boolean;
  /** Custom className for additional styling */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Text position relative to spinner */
  textPosition?: 'bottom' | 'right' | 'top' | 'left';
  /** Custom test ID for testing */
  'data-testid'?: string;
}

// Size mappings for different spinner elements
const sizeClasses = {
  xs: {
    spinner: 'w-3 h-3',
    text: 'text-xs',
    dot: 'w-0.5 h-0.5',
    bar: 'w-0.5 h-2',
    gap: 'space-x-0.5',
  },
  sm: {
    spinner: 'w-4 h-4',
    text: 'text-sm',
    dot: 'w-1 h-1',
    bar: 'w-0.5 h-3',
    gap: 'space-x-0.5',
  },
  md: {
    spinner: 'w-6 h-6',
    text: 'text-base',
    dot: 'w-1.5 h-1.5',
    bar: 'w-1 h-4',
    gap: 'space-x-1',
  },
  lg: {
    spinner: 'w-8 h-8',
    text: 'text-lg',
    dot: 'w-2 h-2',
    bar: 'w-1 h-5',
    gap: 'space-x-1',
  },
  xl: {
    spinner: 'w-12 h-12',
    text: 'text-xl',
    dot: 'w-3 h-3',
    bar: 'w-1.5 h-6',
    gap: 'space-x-1.5',
  },
  '2xl': {
    spinner: 'w-16 h-16',
    text: 'text-2xl',
    dot: 'w-4 h-4',
    bar: 'w-2 h-8',
    gap: 'space-x-2',
  },
};

// Color mappings with comprehensive theme support
const colorClasses = {
  primary: 'text-blue-600 border-blue-600',
  secondary: 'text-gray-600 border-gray-600',
  success: 'text-green-600 border-green-600',
  warning: 'text-yellow-600 border-yellow-600',
  error: 'text-red-600 border-red-600',
  white: 'text-white border-white',
  gray: 'text-gray-400 border-gray-400',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spin',
  color = 'primary',
  text,
  overlay = false,
  className = '',
  'aria-label': ariaLabel = 'Loading',
  textPosition = 'bottom',
  'data-testid': testId,
}) => {
  const sizes = sizeClasses[size];
  const colors = colorClasses[color];

  // Generate layout classes based on text position
  const getLayoutClasses = () => {
    if (!text) return 'flex items-center justify-center';
    
    switch (textPosition) {
      case 'right':
        return 'flex items-center space-x-3';
      case 'left':
        return 'flex items-center space-x-3 flex-row-reverse';
      case 'top':
        return 'flex flex-col items-center space-y-2 flex-col-reverse';
      case 'bottom':
      default:
        return 'flex flex-col items-center space-y-2';
    }
  };

  // Spinner variants
  const renderSpinner = () => {
    const baseProps = {
      role: "status" as const,
      'aria-label': ariaLabel,
      'data-testid': testId ? `${testId}-spinner` : undefined,
    };

    switch (variant) {
      case 'spin':
        return (
          <div
            {...baseProps}
            className={`
              ${sizes.spinner} ${colors}
              animate-spin rounded-full border-2 border-transparent
              border-t-current border-r-current
            `}
          />
        );

      case 'pulse':
        return (
          <div
            {...baseProps}
            className={`
              ${sizes.spinner} ${colors}
              animate-pulse rounded-full bg-current opacity-75
            `}
          />
        );

      case 'dots':
        return (
          <div
            {...baseProps}
            className={`flex ${sizes.gap} items-center`}
          >
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`
                  ${sizes.dot} ${colors}
                  animate-bounce rounded-full bg-current
                `}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '0.6s',
                }}
              />
            ))}
          </div>
        );

      case 'bars':
        return (
          <div
            {...baseProps}
            className={`flex ${sizes.gap} items-end`}
          >
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`
                  ${sizes.bar} ${colors}
                  animate-pulse bg-current rounded-sm
                `}
                style={{
                  animationDelay: `${index * 0.15}s`,
                  animationDuration: '1s',
                }}
              />
            ))}
          </div>
        );

      case 'bounce':
        return (
          <div
            {...baseProps}
            className={`
              ${sizes.spinner} ${colors}
              animate-bounce rounded-full bg-current
            `}
          />
        );

      case 'wave':
        return (
          <div
            {...baseProps}
            className={`flex ${sizes.gap} items-center`}
          >
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className={`
                  ${sizes.dot} ${colors}
                  animate-pulse rounded-full bg-current
                `}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '1.2s',
                }}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const content = (
    <div
      className={`${getLayoutClasses()} ${className}`}
      data-testid={testId}
    >
      {renderSpinner()}
      {text && (
        <p 
          className={`${sizes.text} ${colors} font-medium animate-pulse`}
          data-testid={testId ? `${testId}-text` : undefined}
        >
          {text}
        </p>
      )}
    </div>
  );

  // Render as overlay or inline
  if (overlay) {
    return (
      <div
        className="
          absolute inset-0 bg-white/80 dark:bg-gray-900/80 
          backdrop-blur-sm flex items-center justify-center z-50
          transition-opacity duration-200
        "
        role="status"
        aria-label={text || ariaLabel}
        data-testid={testId ? `${testId}-overlay` : undefined}
      >
        {content}
      </div>
    );
  }

  return content;
};

// Predefined spinner compositions for common use cases
// These are convenience components that use the main LoadingSpinner

export const MapLoadingSpinner: React.FC<{ 
  text?: string;
  'data-testid'?: string;
}> = ({ 
  text = "Loading map...",
  'data-testid': testId = 'map-loading'
}) => (
  <LoadingSpinner
    size="lg"
    variant="spin"
    color="primary"
    text={text}
    overlay
    data-testid={testId}
  />
);

export const DataLoadingSpinner: React.FC<{ 
  text?: string;
  size?: SpinnerSize;
  'data-testid'?: string;
}> = ({ 
  text = "Loading data...",
  size = "md",
  'data-testid': testId = 'data-loading'
}) => (
  <LoadingSpinner
    size={size}
    variant="dots"
    color="primary"
    text={text}
    data-testid={testId}
  />
);

export const InlineLoadingSpinner: React.FC<{ 
  size?: SpinnerSize;
  color?: SpinnerColor;
  'data-testid'?: string;
}> = ({ 
  size = "sm",
  color = "primary",
  'data-testid': testId = 'inline-loading'
}) => (
  <LoadingSpinner
    size={size}
    variant="spin"
    color={color}
    data-testid={testId}
  />
);

export const FullPageLoadingSpinner: React.FC<{ 
  text?: string;
  'data-testid'?: string;
}> = ({ 
  text = "Loading HydroDash...",
  'data-testid': testId = 'fullpage-loading'
}) => (
  <div 
    className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"
    data-testid={`${testId}-container`}
  >
    <LoadingSpinner
      size="xl"
      variant="spin"
      color="primary"
      text={text}
      data-testid={testId}
    />
  </div>
);

export const WidgetLoadingSpinner: React.FC<{ 
  height?: string;
  text?: string;
  variant?: SpinnerVariant;
  'data-testid'?: string;
}> = ({ 
  height = "h-48",
  text = "Loading widget...",
  variant = "pulse",
  'data-testid': testId = 'widget-loading'
}) => (
  <div 
    className={`${height} flex items-center justify-center`}
    data-testid={`${testId}-container`}
  >
    <LoadingSpinner
      size="md"
      variant={variant}
      color="secondary"
      text={text}
      data-testid={testId}
    />
  </div>
);

export const ButtonLoadingSpinner: React.FC<{ 
  size?: SpinnerSize;
  'data-testid'?: string;
}> = ({ 
  size = "xs",
  'data-testid': testId = 'button-loading'
}) => (
  <LoadingSpinner
    size={size}
    variant="spin"
    color="white"
    className="mr-2"
    data-testid={testId}
  />
);

export const SearchLoadingSpinner: React.FC<{ 
  'data-testid'?: string;
}> = ({ 
  'data-testid': testId = 'search-loading'
}) => (
  <LoadingSpinner
    size="sm"
    variant="dots"
    color="gray"
    data-testid={testId}
  />
);

export const DashboardLoadingSpinner: React.FC<{ 
  text?: string;
  'data-testid'?: string;
}> = ({ 
  text = "Loading dashboard...",
  'data-testid': testId = 'dashboard-loading'
}) => (
  <LoadingSpinner
    size="lg"
    variant="wave"
    color="primary"
    text={text}
    overlay
    data-testid={testId}
  />
);

// Export default component
export default LoadingSpinner;