// components/Sidebar/SidebarToggle.tsx
'use client';

import React from 'react';

interface SidebarToggleProps {
  /** Whether sidebar is open */
  isOpen: boolean;
  /** Callback to toggle sidebar */
  onToggle: () => void;
  /** Button size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Display variant */
  variant?: 'hamburger' | 'arrow' | 'auto';
  /** Custom className */
  className?: string;
  /** Position for fixed positioning */
  position?: 'relative' | 'fixed';
  /** Show text label */
  showLabel?: boolean;
  /** Custom aria label */
  'aria-label'?: string;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({
  isOpen,
  onToggle,
  size = 'md',
  variant = 'auto',
  className = '',
  position = 'relative',
  showLabel = false,
  'aria-label': ariaLabel,
  'data-testid': testId,
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-3',
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-6 h-6',
  };

  // Determine which icon to show
  const getIconType = () => {
    if (variant === 'hamburger') return 'hamburger';
    if (variant === 'arrow') return 'arrow';
    // Auto: show hamburger when closed, arrow when open
    return isOpen ? 'arrow' : 'hamburger';
  };

  const iconType = getIconType();

  // Hamburger icon with animation
  const HamburgerIcon = () => (
    <div className={`${iconSizeClasses[size]} flex flex-col justify-center space-y-1`}>
      <div
        className={`
          h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out origin-center
          ${isOpen && variant === 'hamburger' 
            ? 'rotate-45 translate-y-1.5 w-full' 
            : 'w-full'
          }
        `}
      />
      <div
        className={`
          h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out
          ${isOpen && variant === 'hamburger' 
            ? 'opacity-0 scale-0' 
            : 'opacity-100 scale-100 w-full'
          }
        `}
      />
      <div
        className={`
          h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out origin-center
          ${isOpen && variant === 'hamburger' 
            ? '-rotate-45 -translate-y-1.5 w-full' 
            : 'w-full'
          }
        `}
      />
    </div>
  );

  // Arrow icon
  const ArrowIcon = () => (
    <svg 
      className={`${iconSizeClasses[size]} transition-transform duration-300 ease-in-out ${
        isOpen ? 'rotate-180' : 'rotate-0'
      }`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M9 5l7 7-7 7" 
      />
    </svg>
  );

  // Base button classes
  const baseClasses = `
    inline-flex items-center justify-center
    text-gray-600 dark:text-gray-400
    hover:text-gray-900 dark:hover:text-white
    hover:bg-gray-100 dark:hover:bg-gray-700
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    dark:focus:ring-offset-gray-800
    rounded-lg transition-all duration-200 ease-in-out
    ${sizeClasses[size]}
  `;

  // Position classes
  const positionClasses = position === 'fixed' 
    ? 'fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700'
    : '';

  const buttonClasses = [baseClasses, positionClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={showLabel ? 'flex items-center space-x-2' : ''}>
      <button
        onClick={onToggle}
        className={buttonClasses}
        aria-label={ariaLabel || (isOpen ? 'Close sidebar' : 'Open sidebar')}
        aria-expanded={isOpen}
        data-testid={testId}
        type="button"
      >
        {iconType === 'hamburger' ? <HamburgerIcon /> : <ArrowIcon />}
      </button>

      {/* Optional Label */}
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isOpen ? 'Close' : 'Menu'}
        </span>
      )}
    </div>
  );
};

export default SidebarToggle;