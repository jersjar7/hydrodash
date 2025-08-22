// components/Layout/TilesManager.tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';

// Tile size definitions
export type TileSize = 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'xl';

// Tile type definitions
export interface TileDefinition {
  id: string;
  type: string;
  size: TileSize;
  title: string;
  color: string;
  position: { x: number; y: number };
}

// Grid layout configuration
const TILE_DIMENSIONS = {
  small: { width: 200, height: 200 },   // 1x1
  medium: { width: 420, height: 200 },  // 2x1  
  large: { width: 420, height: 420 },   // 2x2
  wide: { width: 640, height: 200 },    // 3x1
  tall: { width: 200, height: 420 },    // 1x2
  xl: { width: 640, height: 420 },      // 3x2
};

const GRID_GAP = 20;

// Sample tile data for development
const INITIAL_TILES: TileDefinition[] = [
  {
    id: 'tile-1',
    type: 'current-conditions',
    size: 'wide',
    title: 'Current Conditions',
    color: 'bg-blue-500',
    position: { x: 0, y: 0 }
  },
  {
    id: 'tile-2', 
    type: 'hydrograph',
    size: 'large',
    title: 'Flow Chart',
    color: 'bg-green-500',
    position: { x: 660, y: 0 }
  },
  {
    id: 'tile-3',
    type: 'flow-summary',
    size: 'medium',
    title: 'Flow Summary', 
    color: 'bg-purple-500',
    position: { x: 0, y: 240 }
  },
  {
    id: 'tile-4',
    type: 'precipitation',
    size: 'small',
    title: 'Precipitation',
    color: 'bg-indigo-500',
    position: { x: 440, y: 240 }
  },
  {
    id: 'tile-5',
    type: 'weather',
    size: 'small',
    title: 'Weather',
    color: 'bg-cyan-500', 
    position: { x: 660, y: 240 }
  },
  {
    id: 'tile-6',
    type: 'air-quality',
    size: 'tall',
    title: 'Air Quality',
    color: 'bg-orange-500',
    position: { x: 880, y: 0 }
  },
  {
    id: 'tile-7',
    type: 'sunrise-sunset',
    size: 'small',
    title: 'Sun Times',
    color: 'bg-yellow-500',
    position: { x: 0, y: 460 }
  },
  {
    id: 'tile-8',
    type: 'alerts',
    size: 'medium',
    title: 'Alerts',
    color: 'bg-red-500',
    position: { x: 220, y: 460 }
  }
];

// Individual tile component
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
        absolute cursor-move rounded-lg border-2 border-white/20 dark:border-gray-700/20
        transition-all duration-200 ease-out select-none
        hover:shadow-lg hover:scale-[1.02] hover:z-10
        ${tile.color} text-white
        ${isDragging ? 'opacity-50 scale-105 z-20 shadow-2xl' : 'opacity-100'}
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
        <h3 className="text-lg font-semibold mb-2">{tile.title}</h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm opacity-80">{tile.type}</p>
            <p className="text-xs opacity-60 mt-1">{tile.size} tile</p>
          </div>
        </div>
        <div className="text-xs opacity-60 text-right">
          {dimensions.width} × {dimensions.height}
        </div>
      </div>
    </div>
  );
};

// Grid background helper component
const GridBackground: React.FC<{ containerWidth: number; containerHeight: number }> = ({ 
  containerWidth, 
  containerHeight 
}) => {
  const gridSize = 20;
  
  return (
    <div 
      className="absolute inset-0 opacity-10 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(156, 163, 175, 0.3) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(156, 163, 175, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    />
  );
};

// Main TilesManager component
interface TilesManagerProps {
  className?: string;
  'data-testid'?: string;
}

const TilesManager: React.FC<TilesManagerProps> = ({ 
  className = '',
  'data-testid': testId 
}) => {
  const [tiles, setTiles] = useState<TileDefinition[]>(INITIAL_TILES);
  const [draggedTile, setDraggedTile] = useState<TileDefinition | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle drag start
  const handleDragStart = useCallback((tile: TileDefinition, event: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = event.clientX - rect.left - tile.position.x;
    const offsetY = event.clientY - rect.top - tile.position.y;
    
    setDraggedTile(tile);
    setDragOffset({ x: offsetX, y: offsetY });
    
    event.preventDefault();
  }, []);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!draggedTile || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, event.clientX - rect.left - dragOffset.x);
    const newY = Math.max(0, event.clientY - rect.top - dragOffset.y);

    setTiles(prev => 
      prev.map(tile => 
        tile.id === draggedTile.id 
          ? { ...tile, position: { x: newX, y: newY } }
          : tile
      )
    );
  }, [draggedTile, dragOffset]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    if (draggedTile) {
      setDraggedTile(null);
      setDragOffset({ x: 0, y: 0 });
    }
  }, [draggedTile]);

  // Set up mouse event listeners
  React.useEffect(() => {
    if (draggedTile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedTile, handleMouseMove, handleMouseUp]);

  // Calculate container dimensions based on tiles
  const getContainerDimensions = () => {
    let maxX = 0;
    let maxY = 0;

    tiles.forEach(tile => {
      const dimensions = TILE_DIMENSIONS[tile.size];
      maxX = Math.max(maxX, tile.position.x + dimensions.width);
      maxY = Math.max(maxY, tile.position.y + dimensions.height);
    });

    return {
      width: Math.max(1200, maxX + GRID_GAP),
      height: Math.max(800, maxY + GRID_GAP)
    };
  };

  const containerDimensions = getContainerDimensions();

  return (
    <div className={`h-full overflow-auto ${className}`} data-testid={testId}>
      <div className="p-6">
        <div 
          ref={containerRef}
          className="relative bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
          style={{
            width: containerDimensions.width,
            height: containerDimensions.height,
            minHeight: '600px'
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
              isDragging={draggedTile?.id === tile.id}
            />
          ))}

          {/* Instructions overlay when no tiles are being dragged */}
          {!draggedTile && (
            <div className="absolute top-4 left-4 text-sm text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
              <p className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Drag tiles to rearrange your dashboard
              </p>
            </div>
          )}
        </div>

        {/* Development info */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>🚧 Development Mode: {tiles.length} placeholder tiles</p>
          <p>Tiles can be dragged and rearranged • Real widgets coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default TilesManager;