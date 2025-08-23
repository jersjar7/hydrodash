// components/Layout/MainViewport.tsx
'use client';

import React from 'react';

interface MainViewportProps {
  /** Content to display in the viewport (MapPanel, DashboardPanel, etc.) */
  children: React.ReactNode;
  /** Custom className for additional styling */
  className?: string;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

/**
 * MainViewport - Simple content wrapper for main application content
 * 
 * Provides a full-bleed container that:
 * - Fills the entire parent container
 * - Handles overflow properly for contained content
 * - Serves as the host for MapPanel, DashboardPanel, or other main views
 * 
 * This component replaces margin-based layout shifting and provides
 * a stable container for content regardless of sidebar state.
 */
export function MainViewport({
  children,
  className = '',
  'data-testid': testId,
}: MainViewportProps) {
  return (
    <div
      className={`
        h-full w-full overflow-hidden
        ${className}
      `.trim()}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

export default MainViewport;