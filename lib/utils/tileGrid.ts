// lib/utils/tileGrid.ts
// iPhone-style grid system for tile management

export type TileSize = 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'xl';

export interface TileDefinition {
  id: string;
  type: string;
  size: TileSize;
  title: string;
  color: string;
  position: { x: number; y: number };
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridPosition {
  gridX: number;
  gridY: number;
}

// Tile size definitions - all dimensions are multiples of GRID_SPACING for perfect alignment
export const TILE_DIMENSIONS = {
  small: { width: 200, height: 200 },   // 10x10 grid cells
  medium: { width: 420, height: 200 },  // 21x10 grid cells  
  large: { width: 420, height: 420 },   // 21x21 grid cells
  wide: { width: 640, height: 200 },    // 32x10 grid cells
  tall: { width: 200, height: 420 },    // 10x21 grid cells
  xl: { width: 640, height: 420 },      // 32x21 grid cells
};

// Universal spacing - everything uses this single value (like iPhone apps)
export const GRID_SPACING = 20;

/**
 * Snaps any position to the nearest grid point (iPhone-style)
 * Always snaps regardless of distance - no threshold needed
 */
export const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SPACING) * GRID_SPACING;
};

/**
 * Snaps a position object to grid
 */
export const snapPositionToGrid = (position: { x: number; y: number }): { x: number; y: number } => {
  return {
    x: snapToGrid(position.x),
    y: snapToGrid(position.y)
  };
};

/**
 * Converts pixel coordinates to grid coordinates
 */
export const pixelToGrid = (x: number, y: number): GridPosition => {
  return {
    gridX: Math.round(x / GRID_SPACING),
    gridY: Math.round(y / GRID_SPACING)
  };
};

/**
 * Converts grid coordinates to pixel coordinates
 */
export const gridToPixel = (gridX: number, gridY: number): { x: number; y: number } => {
  return {
    x: gridX * GRID_SPACING,
    y: gridY * GRID_SPACING
  };
};

/**
 * Converts a tile to a rectangle
 */
export const tileToRectangle = (tile: TileDefinition): Rectangle => {
  const dimensions = TILE_DIMENSIONS[tile.size];
  return {
    x: tile.position.x,
    y: tile.position.y,
    width: dimensions.width,
    height: dimensions.height
  };
};

/**
 * Simple overlap check for tiles
 */
export const tilesOverlap = (tile1: TileDefinition, tile2: TileDefinition): boolean => {
  const rect1 = tileToRectangle(tile1);
  const rect2 = tileToRectangle(tile2);
  
  return !(rect1.x + rect1.width <= rect2.x || 
           rect2.x + rect2.width <= rect1.x || 
           rect1.y + rect1.height <= rect2.y || 
           rect2.y + rect2.height <= rect1.y);
};

/**
 * Gets all grid positions occupied by a tile
 */
export const getTileGridPositions = (tile: TileDefinition): GridPosition[] => {
  const dimensions = TILE_DIMENSIONS[tile.size];
  const startGrid = pixelToGrid(tile.position.x, tile.position.y);
  const gridWidth = Math.ceil(dimensions.width / GRID_SPACING);
  const gridHeight = Math.ceil(dimensions.height / GRID_SPACING);
  
  const positions: GridPosition[] = [];
  
  for (let gx = startGrid.gridX; gx < startGrid.gridX + gridWidth; gx++) {
    for (let gy = startGrid.gridY; gy < startGrid.gridY + gridHeight; gy++) {
      positions.push({ gridX: gx, gridY: gy });
    }
  }
  
  return positions;
};

/**
 * Creates a set of occupied grid position strings for fast lookup
 */
export const getOccupiedGridSet = (tiles: TileDefinition[], excludeId?: string): Set<string> => {
  const occupiedPositions = new Set<string>();
  
  tiles.forEach(tile => {
    if (tile.id !== excludeId) {
      getTileGridPositions(tile).forEach(pos => {
        occupiedPositions.add(`${pos.gridX},${pos.gridY}`);
      });
    }
  });
  
  return occupiedPositions;
};

/**
 * Checks if a tile can be placed at a specific grid position
 */
export const canPlaceTileAt = (
  tileSize: TileSize, 
  gridX: number, 
  gridY: number, 
  occupiedSet: Set<string>
): boolean => {
  // Ensure position is not negative
  if (gridX < 0 || gridY < 0) return false;
  
  const dimensions = TILE_DIMENSIONS[tileSize];
  const gridWidth = Math.ceil(dimensions.width / GRID_SPACING);
  const gridHeight = Math.ceil(dimensions.height / GRID_SPACING);
  
  // Check if all grid cells needed by this tile are free
  for (let gx = gridX; gx < gridX + gridWidth; gx++) {
    for (let gy = gridY; gy < gridY + gridHeight; gy++) {
      if (occupiedSet.has(`${gx},${gy}`)) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Finds the nearest available grid position for a tile (iPhone-style)
 * Uses expanding square search to find the closest valid position
 */
export const findNearestAvailablePosition = (
  targetTile: TileDefinition, 
  targetPosition: { x: number; y: number },
  otherTiles: TileDefinition[]
): { x: number; y: number } => {
  // Convert target position to grid coordinates
  const targetGrid = pixelToGrid(targetPosition.x, targetPosition.y);
  
  // Get all occupied grid positions from other tiles
  const occupiedPositions = getOccupiedGridSet(otherTiles, targetTile.id);
  
  // Check if target position is available
  if (canPlaceTileAt(targetTile.size, targetGrid.gridX, targetGrid.gridY, occupiedPositions)) {
    return gridToPixel(targetGrid.gridX, targetGrid.gridY);
  }
  
  // Search in expanding squares for nearest available position
  for (let radius = 1; radius <= 50; radius++) {
    // Check all positions in the current radius
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        // Only check the perimeter of the current square for efficiency
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        
        const testGridX = targetGrid.gridX + dx;
        const testGridY = targetGrid.gridY + dy;
        
        if (canPlaceTileAt(targetTile.size, testGridX, testGridY, occupiedPositions)) {
          return gridToPixel(testGridX, testGridY);
        }
      }
    }
  }
  
  // Fallback to original snapped position (even if it overlaps)
  return gridToPixel(targetGrid.gridX, targetGrid.gridY);
};

/**
 * Calculates container dimensions based on tile positions
 * Ensures container is large enough with generous padding for dragging
 */
export const calculateContainerDimensions = (tiles: TileDefinition[]) => {
  if (tiles.length === 0) {
    return {
      width: 1600,
      height: 1200
    };
  }

  let maxX = 0;
  let maxY = 0;
  const generousPadding = 600; // Extra space for dragging tiles around

  tiles.forEach(tile => {
    const dimensions = TILE_DIMENSIONS[tile.size];
    maxX = Math.max(maxX, tile.position.x + dimensions.width);
    maxY = Math.max(maxY, tile.position.y + dimensions.height);
  });

  return {
    width: Math.max(1600, maxX + generousPadding),
    height: Math.max(1200, maxY + generousPadding)
  };
};

/**
 * Validates that all tiles are properly positioned and don't overlap
 */
export const validateTilePositions = (tiles: TileDefinition[]): boolean => {
  // Check that all tiles are on grid
  for (const tile of tiles) {
    if (tile.position.x % GRID_SPACING !== 0 || tile.position.y % GRID_SPACING !== 0) {
      return false;
    }
  }
  
  // Check for overlaps
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tilesOverlap(tiles[i], tiles[j])) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Auto-arranges tiles in a clean grid layout (iPhone-style)
 * Places tiles left-to-right, top-to-bottom with consistent spacing
 */
export const autoArrangeTiles = (tiles: TileDefinition[]): TileDefinition[] => {
  const arranged: TileDefinition[] = [];
  let currentX = GRID_SPACING;
  let currentY = GRID_SPACING;
  let rowHeight = 0;
  const maxRowWidth = 1400; // Maximum width before wrapping to next row
  
  tiles.forEach(tile => {
    const dimensions = TILE_DIMENSIONS[tile.size];
    
    // Check if we need to wrap to next row
    if (currentX + dimensions.width > maxRowWidth) {
      currentX = GRID_SPACING;
      currentY += rowHeight + GRID_SPACING;
      rowHeight = 0;
    }
    
    arranged.push({
      ...tile,
      position: { x: currentX, y: currentY }
    });
    
    currentX += dimensions.width + GRID_SPACING;
    rowHeight = Math.max(rowHeight, dimensions.height);
  });
  
  return arranged;
};

/**
 * Gets the grid dimensions (width x height in grid cells) for a tile size
 */
export const getTileGridDimensions = (tileSize: TileSize): { gridWidth: number; gridHeight: number } => {
  const dimensions = TILE_DIMENSIONS[tileSize];
  return {
    gridWidth: Math.ceil(dimensions.width / GRID_SPACING),
    gridHeight: Math.ceil(dimensions.height / GRID_SPACING)
  };
};

/**
 * Utility to debug grid positions - converts all tile positions to grid coordinates
 */
export const debugTilePositions = (tiles: TileDefinition[]): void => {
  console.log('=== Tile Grid Positions ===');
  tiles.forEach(tile => {
    const grid = pixelToGrid(tile.position.x, tile.position.y);
    const dimensions = getTileGridDimensions(tile.size);
    console.log(`${tile.title}: Grid(${grid.gridX},${grid.gridY}) Size(${dimensions.gridWidth}x${dimensions.gridHeight}) Pixel(${tile.position.x},${tile.position.y})`);
  });
};