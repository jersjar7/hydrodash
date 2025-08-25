// components/Layout/TilesManager.tsx
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  TileDefinition,
  TileSize,
  TILE_DIMENSIONS,
  GRID_SPACING,
  calculateContainerDimensions,
  findNearestAvailablePosition,
  snapPositionToGrid,
  validateTilePositions,
  autoArrangeTiles
} from '../../lib/utils/tileGrid';

// Sample tile data with perfect grid alignment
const INITIAL_TILES: TileDefinition[] = [
  {
    id: 'tile-1',
    type: 'current-conditions',
    size: 'wide',
    title: 'Current Conditions',
    color: '',
    position: { x: 20, y: 20 }
  },
  {
    id: 'tile-2', 
    type: 'hydrograph',
    size: 'large',
    title: 'Flow Chart',
    color: '',
    position: { x: 680, y: 20 }
  },
  {
    id: 'tile-3',
    type: 'flow-summary',
    size: 'medium',
    title: 'Flow Summary', 
    color: '',
    position: { x: 20, y: 240 }
  },
  {
    id: 'tile-4',
    type: 'precipitation',
    size: 'small',
    title: 'Precipitation',
    color: '',
    position: { x: 460, y: 240 }
  },
  {
    id: 'tile-5',
    type: 'weather',
    size: 'small',
    title: 'Weather',
    color: '', 
    position: { x: 680, y: 240 }
  },
  {
    id: 'tile-6',
    type: 'air-quality',
    size: 'tall',
    title: 'Air Quality',
    color: '',
    position: { x: 1120, y: 20 }
  },
  {
    id: 'tile-7',
    type: 'sunrise-sunset',
    size: 'small',
    title: 'Sun Times',
    color: '',
    position: { x: 20, y: 460 }
  },
  {
    id: 'tile-8',
    type: 'alerts',
    size: 'medium',
    title: 'Alerts',
    color: '',
    position: { x: 240, y: 460 }
  }
];

// Drag state interface
interface DragState {
  tile: TileDefinition | null;
  offset: { x: number; y: number };
  preview: { x: number; y: number } | null;
}

// Individual tile component with glassmorphism design
interface TileProps {
  tile: TileDefinition;
  onDragStart: (tile: TileDefinition, event: React.MouseEvent) => void;
  isDragging: boolean;
}

const Tile: React.FC<TileProps> = ({ tile, onDragStart, isDragging }) => {
  const dimensions = TILE_DIMENSIONS[tile.size];
  
  return (
    <div
      className={`
        absolute cursor-move rounded-xl select-none
        bg-white/10 dark:bg-gray-800/20 backdrop-blur-md
        transition-all duration-200 ease-out
        hover:shadow-lg hover:scale-[1.02] hover:z-10
        hover:bg-white/20 dark:hover:bg-gray-700/30
        ${isDragging 
          ? 'opacity-70 scale-105 z-20 shadow-2xl bg-white/30 dark:bg-gray-600/40' 
          : 'opacity-100'
        }
      `}
      style={{
        left: tile.position.x,
        top: tile.position.y,
        width: dimensions.width,
        height: dimensions.height,
      }}
      onMouseDown={(e) => onDragStart(tile, e)}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Tile header */}
        <div className="flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white leading-tight">
            {tile.title}
          </h3>
        </div>

        {/* Tile content area */}
        <div className="flex-1 flex items-center justify-center my-2">
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {tile.type.replace(/-/g, ' ').toUpperCase()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
              {tile.size} tile
            </p>
          </div>
        </div>

        {/* Tile footer with dimensions */}
        <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 text-right">
          {dimensions.width} × {dimensions.height}px
        </div>
      </div>
    </div>
  );
};

// Grid background component showing the 20px grid
const GridBackground: React.FC<{ 
  containerWidth: number; 
  containerHeight: number;
}> = ({ containerWidth, containerHeight }) => {
  return (
    <div 
      className="absolute inset-0 opacity-10 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(156, 163, 175, 0.4) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(156, 163, 175, 0.4) 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SPACING}px ${GRID_SPACING}px`,
        backgroundPosition: '0 0',
      }}
    />
  );
};

// Instructions overlay component
const InstructionsOverlay: React.FC<{ 
  isVisible: boolean;
  tileCount: number;
}> = ({ isVisible, tileCount }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-6 left-6 z-30">
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/40 dark:border-gray-700/40 shadow-lg max-w-sm">
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Drag tiles to rearrange
          </span>
        </div>
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <p>• Tiles snap to {GRID_SPACING}px grid automatically</p>
          <p>• Works like iPhone app organization</p>
          <p>• {tileCount} tiles currently active</p>
        </div>
      </div>
    </div>
  );
};

// Development info component
const DevelopmentInfo: React.FC<{ 
  tileCount: number;
  isValid: boolean;
}> = ({ tileCount, isValid }) => {
  return (
    <div className="mt-6 text-center">
      <div className="inline-flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg px-4 py-2">
        <span className="flex items-center">
          <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
          🚧 Development Mode
        </span>
        <span className="border-l border-gray-300 dark:border-gray-600 pl-4">
          {tileCount} placeholder tiles
        </span>
        <span className="border-l border-gray-300 dark:border-gray-600 pl-4">
          Grid: {isValid ? '✅ Valid' : '❌ Invalid'}
        </span>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        iPhone-style grid system with {GRID_SPACING}px spacing • Real widgets coming soon
      </p>
    </div>
  );
};

// Main TilesManager component props
interface TilesManagerProps {
  className?: string;
  'data-testid'?: string;
  onTilesChange?: (tiles: TileDefinition[]) => void;
}

// Main TilesManager component
const TilesManager: React.FC<TilesManagerProps> = ({ 
  className = '',
  'data-testid': testId,
  onTilesChange
}) => {
  // State management
  const [tiles, setTiles] = useState<TileDefinition[]>(INITIAL_TILES);
  const [dragState, setDragState] = useState<DragState>({
    tile: null,
    offset: { x: 0, y: 0 },
    preview: null
  });

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate container dimensions
  const containerDimensions = calculateContainerDimensions(tiles);
  const isValidLayout = validateTilePositions(tiles);

  // Notify parent of tile changes
  useEffect(() => {
    if (onTilesChange) {
      onTilesChange(tiles);
    }
  }, [tiles, onTilesChange]);

  // Handle drag start
  const handleDragStart = useCallback((tile: TileDefinition, event: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - tile.position.x;
    const offsetY = event.clientY - rect.top - tile.position.y;
    
    setDragState({
      tile,
      offset: { x: offsetX, y: offsetY },
      preview: null
    });
    
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.tile || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const rawX = event.clientX - rect.left - dragState.offset.x;
    const rawY = event.clientY - rect.top - dragState.offset.y;
    
    // Ensure minimum position is 0
    const newX = Math.max(0, rawX);
    const newY = Math.max(0, rawY);

    // Update preview position
    setDragState(prev => ({
      ...prev,
      preview: { x: newX, y: newY }
    }));

    // Update visual position of dragged tile immediately for smooth feedback
    setTiles(prev => 
      prev.map(tile => 
        tile.id === dragState.tile!.id 
          ? { ...tile, position: { x: newX, y: newY } }
          : tile
      )
    );
  }, [dragState.tile, dragState.offset]);

  // Handle drag end with iPhone-style snapping
  const handleMouseUp = useCallback(() => {
    if (!dragState.tile || !dragState.preview) {
      setDragState({ tile: null, offset: { x: 0, y: 0 }, preview: null });
      return;
    }

    const otherTiles = tiles.filter(t => t.id !== dragState.tile!.id);
    
    // Find the nearest available position using iPhone-style logic
    const finalPosition = findNearestAvailablePosition(
      dragState.tile, 
      dragState.preview, 
      otherTiles
    );
    
    // Apply the final snapped position
    setTiles(prev => 
      prev.map(tile => 
        tile.id === dragState.tile!.id 
          ? { ...tile, position: finalPosition }
          : tile
      )
    );
    
    // Clear drag state
    setDragState({ tile: null, offset: { x: 0, y: 0 }, preview: null });
  }, [dragState, tiles]);

  // Set up mouse event listeners
  useEffect(() => {
    if (dragState.tile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseUp);
      };
    }
  }, [dragState.tile, handleMouseMove, handleMouseUp]);

  // Auto-arrange tiles function (for development/testing)
  const handleAutoArrange = useCallback(() => {
    const arranged = autoArrangeTiles(tiles);
    setTiles(arranged);
  }, [tiles]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Press 'A' to auto-arrange (development feature)
      if (event.key.toLowerCase() === 'a' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        handleAutoArrange();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleAutoArrange]);

  return (
    <div className={`h-full overflow-auto ${className}`} data-testid={testId}>
      <div className="p-6">
        {/* Main tile container */}
        <div 
          ref={containerRef}
          className="relative rounded-xl border border-gray-200/30 dark:border-gray-700/30 bg-transparent"
          style={{
            width: containerDimensions.width,
            height: containerDimensions.height,
            minHeight: '1000px'
          }}
        >
          {/* Grid background */}
          <GridBackground 
            containerWidth={containerDimensions.width} 
            containerHeight={containerDimensions.height} 
          />

          {/* Tiles */}
          {tiles.map(tile => (
            <Tile
              key={tile.id}
              tile={tile}
              onDragStart={handleDragStart}
              isDragging={dragState.tile?.id === tile.id}
            />
          ))}

          {/* Instructions overlay */}
          <InstructionsOverlay 
            isVisible={!dragState.tile} 
            tileCount={tiles.length}
          />

          {/* Debug overlay for invalid layouts */}
          {!isValidLayout && (
            <div className="absolute top-6 right-6 bg-red-500/90 text-white p-3 rounded-lg text-sm">
              ⚠️ Invalid layout detected
            </div>
          )}
        </div>

        {/* Development info */}
        <DevelopmentInfo 
          tileCount={tiles.length}
          isValid={isValidLayout}
        />

        {/* Development controls */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-center">
            <button
              onClick={handleAutoArrange}
              className="px-4 py-2 text-xs bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Auto-Arrange (⌘+A)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TilesManager;
export type { TilesManagerProps, TileDefinition };