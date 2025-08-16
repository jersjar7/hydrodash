// components/Layout/AppFrame.tsx
'use client';

import React from 'react';

interface AppFrameProps {
  /** Header content (navigation bar, toolbar, etc.) */
  header: React.ReactNode;
  /** Main content area (maps, dashboards, etc.) */
  children: React.ReactNode;
  /** Custom className for the root container */
  className?: string;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

/**
 * AppFrame - Pure layout shell using CSS Grid
 * 
 * Provides the foundational two-row layout structure:
 * - Header row with fixed height controlled by CSS custom property
 * - Main content row that fills remaining space
 * 
 * This component replaces manual height calculations and provides
 * a clean foundation for overlay-based layouts.
 */
export function AppFrame({
  header,
  children,
  className = '',
  'data-testid': testId,
}: AppFrameProps) {
  return (
    <div
      style={{
        // Set CSS custom property for header height
        // This allows other components to reference the header height consistently
        '--header-h': '4rem',
      } as React.CSSProperties}
      className={`
        grid min-h-screen grid-rows-[var(--header-h)_1fr]
        ${className}
      `.trim()}
      data-testid={testId}
    >
      {/* Header Row - Fixed height based on CSS custom property */}
      <header className="row-[1] z-50">
        {header}
      </header>

      {/* Main Content Row - Fills remaining space */}
      <main className="row-[2] relative min-h-0 overflow-hidden z-10">
        {children}
      </main>
    </div>
  );
}

export default AppFrame;