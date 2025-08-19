// components/Map/BaseMapSelector.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/components/Layout/AppShell';
import type { BaseMapLayer } from '@/types/models/UserPreferences';

interface BaseMapSelectorProps {
  /** Custom className */
  className?: string;
}

const BASE_MAP_OPTIONS: { value: BaseMapLayer; label: string; icon: string }[] = [
  { value: 'standard', label: 'Standard', icon: '🗺️' },
  { value: 'streets', label: 'Streets', icon: '🛣️' },
  { value: 'satellite', label: 'Satellite', icon: '🛰️' },
  { value: 'satelliteStreets', label: 'Satellite Streets', icon: '🌍' },
  { value: 'outdoors', label: 'Outdoors', icon: '🏔️' },
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
];

const BaseMapSelector: React.FC<BaseMapSelectorProps> = ({
  className = '',
}) => {
  const { userPreferences, setUserPreferences } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLayer = userPreferences.baseMapLayer || 'standard';
  const currentOption = BASE_MAP_OPTIONS.find(opt => opt.value === currentLayer) || BASE_MAP_OPTIONS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle layer selection
  const handleLayerSelect = (layer: BaseMapLayer) => {
    setUserPreferences({
      ...userPreferences,
      baseMapLayer: layer,
    });
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg
          text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white
          border border-gray-200 dark:border-gray-700
          transition-all duration-200 hover:shadow-xl
          flex items-center gap-2 min-w-[120px]
        "
        aria-label="Select map layer"
        title={`Current: ${currentOption.label}`}
      >
        <span className="text-lg">{currentOption.icon}</span>
        <span className="text-sm font-medium hidden sm:block">{currentOption.label}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu - Opens upward */}
      {isOpen && (
        <div className="
          absolute bottom-full right-0 mb-2 w-48
          bg-white dark:bg-gray-800 rounded-lg shadow-xl
          border border-gray-200 dark:border-gray-700
          py-2 z-50
          animate-in slide-in-from-bottom-2 duration-200
        ">
          {BASE_MAP_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleLayerSelect(option.value)}
              className={`
                w-full px-4 py-2 text-left flex items-center gap-3
                hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors duration-150
                ${currentLayer === option.value 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-700 dark:text-gray-300'
                }
              `}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="text-sm font-medium">{option.label}</span>
              {currentLayer === option.value && (
                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BaseMapSelector;