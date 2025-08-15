// components/common/ResponsiveContainer.tsx
'use client';

import React, { ReactNode } from 'react';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ContainerSize = 'full' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
export type Padding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface ResponsiveContainerProps {
  /** Content to wrap */
  children: ReactNode;
  /** Maximum container width */
  maxWidth?: ContainerSize;
  /** Responsive padding */
  padding?: Padding;
  /** Center the container */
  center?: boolean;
  /** Custom className */
  className?: string;
  /** Hide on specific breakpoints */
  hideOn?: Breakpoint[];
  /** Show only on specific breakpoints */
  showOnly?: Breakpoint[];
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'full',
  padding = 'md',
  center = false,
  className = '',
  hideOn = [],
  showOnly = [],
}) => {
  // Max width classes
  const maxWidthClasses = {
    full: 'w-full',
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'px-2 py-1 sm:px-4 sm:py-2',
    md: 'px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4',
    lg: 'px-6 py-3 sm:px-8 sm:py-4 lg:px-12 lg:py-6',
    xl: 'px-8 py-4 sm:px-12 sm:py-6 lg:px-16 lg:py-8',
  };

  // Breakpoint visibility classes
  const getVisibilityClasses = () => {
    const classes: string[] = [];
    
    // Hide on specific breakpoints
    hideOn.forEach((breakpoint) => {
      switch (breakpoint) {
        case 'sm':
          classes.push('sm:hidden');
          break;
        case 'md':
          classes.push('md:hidden');
          break;
        case 'lg':
          classes.push('lg:hidden');
          break;
        case 'xl':
          classes.push('xl:hidden');
          break;
        case '2xl':
          classes.push('2xl:hidden');
          break;
      }
    });

    // Show only on specific breakpoints
    if (showOnly.length > 0) {
      classes.push('hidden'); // Hide by default
      showOnly.forEach((breakpoint) => {
        switch (breakpoint) {
          case 'sm':
            classes.push('sm:block');
            break;
          case 'md':
            classes.push('md:block');
            break;
          case 'lg':
            classes.push('lg:block');
            break;
          case 'xl':
            classes.push('xl:block');
            break;
          case '2xl':
            classes.push('2xl:block');
            break;
        }
      });
    }

    return classes.join(' ');
  };

  const containerClasses = [
    maxWidthClasses[maxWidth],
    paddingClasses[padding],
    center ? 'mx-auto' : '',
    getVisibilityClasses(),
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};

// Predefined responsive containers for common layouts
export const PageContainer: React.FC<{ children: ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <ResponsiveContainer
    maxWidth="7xl"
    padding="lg"
    center
    className={className}
  >
    {children}
  </ResponsiveContainer>
);

export const WidgetContainer: React.FC<{ children: ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <ResponsiveContainer
    maxWidth="full"
    padding="md"
    className={className}
  >
    {children}
  </ResponsiveContainer>
);

export const MobileOnlyContainer: React.FC<{ children: ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <ResponsiveContainer
    showOnly={['sm']}
    padding="sm"
    className={className}
  >
    {children}
  </ResponsiveContainer>
);

export const DesktopOnlyContainer: React.FC<{ children: ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <ResponsiveContainer
    hideOn={['sm', 'md']}
    padding="lg"
    className={className}
  >
    {children}
  </ResponsiveContainer>
);

export default ResponsiveContainer;