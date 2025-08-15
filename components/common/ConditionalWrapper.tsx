// components/common/ConditionalWrapper.tsx
'use client';

import React, { ReactNode, ReactElement, cloneElement } from 'react';

interface ConditionalWrapperProps {
  /** Children to potentially wrap */
  children: ReactNode;
  /** Condition to determine if wrapping should occur */
  condition: boolean;
  /** Wrapper component to use when condition is true */
  wrapper: ReactElement;
}

/**
 * Conditionally wraps children with a wrapper component
 * Useful for avoiding code duplication in conditional layouts
 */
const ConditionalWrapper: React.FC<ConditionalWrapperProps> = ({
  children,
  condition,
  wrapper,
}) => {
  if (condition) {
    return cloneElement(wrapper, {}, children);
  }
  
  return <>{children}</>;
};

export default ConditionalWrapper;