// components/Dashboard/AddTilesButton.tsx
'use client';

import React, { useState } from 'react';
import Toast from '@/components/common/Toast';

export type WidgetType = 
  | 'hydrograph'
  | 'temperature'
  | 'precipitation'
  | 'air-quality'
  | 'wind'
  | 'sunrise-sunset'
  | 'statistics';

export interface WidgetOption {
  type: WidgetType;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'flow' | 'weather' | 'environmental';
  available: boolean;
}

interface AddTilesButtonProps {
  /** Callback when widget is selected */
  onWidgetSelect?: (widgetType: WidgetType) => void;
  /** Available widget options */
  widgetOptions?: WidgetOption[];
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
  /** Position variant */
  position?: 'top-right' | 'bottom-right' | 'custom';
  /** Show tooltip */
  showTooltip?: boolean;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

// Default widget options
const defaultWidgetOptions: WidgetOption[] = [
  {
    type: 'hydrograph',
    name: 'Flow Chart',
    description: 'Interactive hydrograph showing flow forecasts',
    category: 'flow',
    available: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    type: 'temperature',
    name: 'Temperature',
    description: 'Current and forecasted temperature',
    category: 'weather',
    available: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 7a4.5 4.5 0 10-8.5 2.5v.5a2.5 2.5 0 001.5 2.29V17a1 1 0 002 0v-4.21a2.5 2.5 0 00-1.5-2.29V10a2.5 2.5 0 015 0 1 1 0 002 0 4.5 4.5 0 00-.5-2z" />
      </svg>
    ),
  },
  {
    type: 'precipitation',
    name: 'Precipitation',
    description: 'Rainfall and precipitation forecasts',
    category: 'weather',
    available: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7l1.5 1.5M16 8l1.5-1.5M12 3v3m0 12v3m9-9h-3m-12 0H3m15.364-6.364l-2.121 2.121M6.757 17.657l-2.121 2.121" />
      </svg>
    ),
  },
  {
    type: 'air-quality',
    name: 'Air Quality',
    description: 'Air quality index and pollutant levels',
    category: 'environmental',
    available: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      </svg>
    ),
  },
  {
    type: 'wind',
    name: 'Wind',
    description: 'Wind speed and direction',
    category: 'weather',
    available: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3a1 1 0 000 2h8a1 1 0 100-2H6zM4 7a1 1 0 000 2h12a1 1 0 100-2H4zm-2 4a1 1 0 000 2h16a1 1 0 100-2H2z" />
      </svg>
    ),
  },
  {
    type: 'sunrise-sunset',
    name: 'Sun Times',
    description: 'Sunrise, sunset, and daylight hours',
    category: 'environmental',
    available: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

const AddTilesButton: React.FC<AddTilesButtonProps> = ({
  onWidgetSelect,
  widgetOptions = defaultWidgetOptions,
  loading = false,
  disabled = false,
  className = '',
  position = 'top-right',
  showTooltip = true,
  'data-testid': testId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Position classes
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-40',
    'bottom-right': 'fixed bottom-4 right-4 z-40',
    'custom': 'relative',
  };

  // Handle button click
  const handleButtonClick = () => {
    if (disabled || loading) return;
    setIsModalOpen(true);
  };

  // Handle widget selection
  const handleWidgetSelect = (widgetType: WidgetType) => {
    const widget = widgetOptions.find(w => w.type === widgetType);
    
    if (!widget?.available) {
      setToastMessage(`${widget?.name || 'Widget'} is coming soon!`);
      setToastType('info');
      setShowToast(true);
      setIsModalOpen(false);
      return;
    }

    if (onWidgetSelect) {
      onWidgetSelect(widgetType);
      setToastMessage(`${widget.name} added to dashboard`);
      setToastType('success');
      setShowToast(true);
    }
    
    setIsModalOpen(false);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Group widgets by category
  const groupedWidgets = widgetOptions.reduce((groups, widget) => {
    const category = widget.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(widget);
    return groups;
  }, {} as Record<string, WidgetOption[]>);

  const categoryNames = {
    flow: 'River Flow',
    weather: 'Weather',
    environmental: 'Environmental',
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className={`${positionClasses[position]} ${className}`}>
        <div className="relative group">
          <button
            onClick={handleButtonClick}
            disabled={disabled || loading}
            className={`
              w-14 h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
              text-white rounded-full shadow-lg hover:shadow-xl
              focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800
              transform transition-all duration-200 ease-in-out
              hover:scale-105 active:scale-95
              disabled:cursor-not-allowed disabled:transform-none
              flex items-center justify-center
            `}
            aria-label="Add widget"
            data-testid={testId}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg 
                className={`w-6 h-6 transition-transform duration-200 ${
                  isModalOpen ? 'rotate-45' : 'rotate-0'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>

          {/* Tooltip */}
          {showTooltip && !isModalOpen && (
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Add Widget
              <div className="absolute top-full right-4 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add Widget
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {Object.entries(groupedWidgets).map(([category, widgets]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    {categoryNames[category as keyof typeof categoryNames]}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {widgets.map((widget) => (
                      <button
                        key={widget.type}
                        onClick={() => handleWidgetSelect(widget.type)}
                        className={`
                          p-4 border-2 rounded-lg text-left transition-all duration-200
                          ${widget.available
                            ? 'border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'
                            : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed opacity-60'
                          }
                        `}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 ${widget.available ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                            {widget.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium ${widget.available ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                              {widget.name}
                              {!widget.available && (
                                <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                                  Coming Soon
                                </span>
                              )}
                            </h4>
                            <p className={`text-sm mt-1 ${widget.available ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'}`}>
                              {widget.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onDismiss={() => setShowToast(false)}
          showCloseButton={true}
        />
      )}
    </>
  );
};

export default AddTilesButton;