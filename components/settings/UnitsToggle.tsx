// components/settings/UnitsToggle.tsx
'use client';

import React from 'react';

export type FlowUnit = 'CFS' | 'CMS';

interface UnitsToggleProps {
  /** Current flow unit */
  value: FlowUnit;
  /** Callback when unit changes */
  onChange: (unit: FlowUnit) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

const UnitsToggle: React.FC<UnitsToggleProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  const units: FlowUnit[] = ['CFS', 'CMS'];

  return (
    <div className={`inline-flex ${className}`}>
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {units.map((unit) => (
          <button
            key={unit}
            onClick={() => onChange(unit)}
            disabled={disabled}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
              ${value === unit
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }
              ${disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:bg-white/50 dark:hover:bg-gray-600/50'
              }
            `}
            aria-pressed={value === unit}
            aria-label={`Set flow unit to ${unit}`}
          >
            {unit}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UnitsToggle;