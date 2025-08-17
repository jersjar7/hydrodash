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
  variant?: 'hamburger' | 'arrow' | 'auto' | 'panel';
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
  variant = 'hamburger', // Changed default to always show hamburger
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

  // Determine which icon to show - now always hamburger unless specified
  const getIconType = () => {
    if (variant === 'panel') return 'panel';
    if (variant === 'arrow') return 'arrow';
    // Default to hamburger (no animation based on open state)
    return 'hamburger';
  };

  const iconType = getIconType();

  // Static hamburger icon (no animation)
  const HamburgerIcon = () => (
    <div className={`${iconSizeClasses[size]} flex flex-col justify-center space-y-1`}>
      <div className="h-0.5 bg-current rounded-full w-full" />
      <div className="h-0.5 bg-current rounded-full w-full" />
      <div className="h-0.5 bg-current rounded-full w-full" />
    </div>
  );

  // Panel/Sidebar icon (like in your image)
  const PanelIcon = () => (
    <svg 
      className={iconSizeClasses[size]} 
      fill="currentColor" 
      viewBox="0 0 24 24"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="3" y="4" width="6" height="16" rx="2" ry="2" fill="currentColor"/>
      <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="2"/>
    </svg>
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

  // Base button classes - changed to white text
  const baseClasses = `
    inline-flex items-center justify-center
    text-white
    hover:text-gray-200
    hover:bg-white/10
    focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2
    focus:ring-offset-transparent
    rounded-lg transition-all duration-200 ease-in-out
    ${sizeClasses[size]}
  `;

  // Position classes
  const positionClasses = position === 'fixed' 
    ? 'fixed top-4 left-4 z-50 bg-white/10 backdrop-blur-sm shadow-lg border border-white/20'
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
        {iconType === 'hamburger' && <HamburgerIcon />}
        {iconType === 'panel' && <PanelIcon />}
        {iconType === 'arrow' && <ArrowIcon />}
      </button>

      {/* Optional Label */}
      {showLabel && (
        <span className="text-sm font-medium text-white">
          {isOpen ? 'Close' : 'Menu'}
        </span>
      )}
    </div>
  );
};

export default SidebarToggle;