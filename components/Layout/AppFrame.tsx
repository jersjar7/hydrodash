// components/Layout/AppFrame.tsx
'use client';

import React from 'react';

interface AppFrameProps {
  /** Main content area (maps, dashboards, etc.) */
  children: React.ReactNode;
  /** Custom className for the root container */
  className?: string;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

/**
 * AppFrame - Simple full-height container
 * 
 * Provides a clean full-screen foundation for overlay-based layouts.
 */
export function AppFrame({
  children,
  className = '',
  'data-testid': testId,
}: AppFrameProps) {
  return (
    <div
      className={`
        min-h-screen relative overflow-hidden
        ${className}
      `.trim()}
      data-testid={testId}
    >
      <main className="h-full min-h-screen relative z-10">
        {children}
      </main>
    </div>
  );
}

export default AppFrame;