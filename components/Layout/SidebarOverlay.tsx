// components/Layout/SidebarOverlay.tsx
'use client';

import React from 'react';

interface SidebarOverlayProps {
  /** Whether the sidebar is open/visible */
  open: boolean;
  /** Sidebar content (typically the Sidebar component) */
  children: React.ReactNode;
  /** Sidebar width in pixels (default: 320 to match w-80) */
  width?: number;
  /** Custom className for additional styling */
  className?: string;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

/**
 * SidebarOverlay - Handles overlay positioning and backdrop logic
 * 
 * Provides the fixed positioning, glass backdrop, and slide animations
 * for the sidebar. The sidebar content itself is passed as children,
 * separating concerns between positioning/styling and content.
 * 
 * Uses CSS custom properties to position below the header and
 * provides smooth slide animations with backdrop blur effects.
 */
export function SidebarOverlay({
  open,
  children,
  width = 320, // w-80 equivalent
  className = '',
  'data-testid': testId,
}: SidebarOverlayProps) {
  return (
    <aside
      className={`
        fixed left-0 top-40 bottom-40 z-40
        rounded-r-xl border border-gray-200 dark:border-gray-700 shadow-lg
        overflow-hidden transform transition-transform duration-300 will-change-transform
        ${open ? 'translate-x-0' : '-translate-x-full'}
        ${className}
      `.trim()}
      style={{
        width: `${width}px`,
      }}
      data-testid={testId}
    >
      {/* Glass backdrop layer */}
      <div className="absolute inset-0 bg-white/20 dark:bg-gray-900/20 backdrop-blur-md pointer-events-none" />
      
      {/* Content container */}
      <div className="relative h-full flex flex-col min-h-0">
        {children}
      </div>
    </aside>
  );
}

export default SidebarOverlay;