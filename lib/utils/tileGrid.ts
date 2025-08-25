// lib/utils/tileGrid.ts
// Pure grid engine for iPhone-style tile snapping with perfect 20px gutters
// 
// This system works like iPhone app icons:
// - All tiles snap to a strict grid with consistent spacing
// - No overlapping is allowed
// - Tiles always find the nearest available position when dropped

export type TileSize = 'small' | 'medium' | 'wide' | 'large' | 'tall';

/**
 * Pixel coordinates (top-left corner)
 */
export interface Point { 
  x: number; 
  y: number; 
}

/**
 * Grid coordinates (column, row) - like spreadsheet cells
 */
export interface GridCoord { 
  col: number; 
  row: number; 
}

/**
 * Tile definition with position and metadata
 */
export interface TileDefinition {
  id: string;
  type: string;
  size: TileSize;
  title: string;
  color?: string;
  position: Point; // pixel coordinates of top-left corner
}

// ============================================================================
// GRID FOUNDATION - The mathematical basis for iPhone-style snapping
// ============================================================================

/**
 * Universal gutter spacing between tiles (like iPhone app spacing)
 * This creates the visual gaps between all tiles
 */
export const GRID_SPACING = 20;

/**
 * Base cell size - the fundamental building block
 * All tiles are multiples of this size (like iPhone app icon size)
 */
export const CELL = 200;

/**
 * Distance between tile origins on the grid
 * Formula: CELL + GRID_SPACING = 200 + 20 = 220px
 * 
 * This means tile origins can only be at:
 * - 20px (first position with leading gutter)
 * - 240px (20 + 220)  
 * - 460px (20 + 220*2)
 * - 680px (20 + 220*3)
 * - etc.
 * 
 * This creates perfect 20px gaps between all tiles automatically!
 */
const STEP = CELL + GRID_SPACING;

/**
 * Tile dimensions and grid spans
 * 
 * Each tile size defines:
 * - width/height: Actual pixel dimensions
 * - spanCols/spanRows: How many grid cells it occupies
 * 
 * Examples:
 * - small (1×1): 200×200px, occupies 1 column × 1 row
 * - medium (2×1): 420×200px, occupies 2 columns × 1 row  
 * - wide (3×1): 640×200px, occupies 3 columns × 1 row
 * 
 * The math: medium width = 2*CELL + 1*GRID_SPACING = 2*200 + 20 = 420px
 */
export const TILE_DIMENSIONS: Record<TileSize, { 
  width: number; 
  height: number; 
  spanCols: number; 
  spanRows: number; 
}> = {
  // Single cell - the basic building block
  small:  { 
    width: CELL,                          // 200px
    height: CELL,                         // 200px
    spanCols: 1, spanRows: 1 
  },
  
  // Two cells wide with one gutter between
  medium: { 
    width: CELL * 2 + GRID_SPACING,      // 420px = 200*2 + 20
    height: CELL,                         // 200px
    spanCols: 2, spanRows: 1 
  },
  
  // Three cells wide with two gutters between  
  wide:   { 
    width: CELL * 3 + GRID_SPACING * 2,  // 640px = 200*3 + 20*2
    height: CELL,                         // 200px
    spanCols: 3, spanRows: 1 
  },
  
  // Square - two cells in both directions
  large:  { 
    width: CELL * 2 + GRID_SPACING,      // 420px
    height: CELL * 2 + GRID_SPACING,     // 420px  
    spanCols: 2, spanRows: 2 
  },
  
  // Vertical rectangle - two cells tall
  tall:   { 
    width: CELL,                          // 200px
    height: CELL * 2 + GRID_SPACING,     // 420px = 200*2 + 20
    spanCols: 1, spanRows: 2 
  },
};

// ============================================================================
// GRID COORDINATE SYSTEM - Converting between pixels and grid positions
// ============================================================================

/**
 * Snaps any pixel position to the nearest valid grid origin
 * 
 * This ensures tiles can ONLY be positioned at valid grid intersections,
 * creating perfect iPhone-style alignment.
 * 
 * Valid origins: 20, 240, 460, 680, 900...
 * 
 * @param p - Raw pixel coordinates (from mouse drag, etc.)
 * @returns Snapped pixel coordinates aligned to grid
 */
export function snapPositionToGrid(p: Point): Point {
  // Convert to grid coordinates (rounds to nearest grid cell)
  const col = Math.max(0, Math.round((p.x - GRID_SPACING) / STEP));
  const row = Math.max(0, Math.round((p.y - GRID_SPACING) / STEP));
  
  // Convert back to pixels (now perfectly aligned)
  return gridToPixel({ col, row });
}

/**
 * Converts pixel coordinates to grid cell coordinates
 * 
 * Example: pixel (460, 240) → grid (2, 1)
 * This means column 2, row 1 (zero-indexed)
 * 
 * @param p - Pixel coordinates
 * @returns Grid cell coordinates
 */
export function pixelToGrid(p: Point): GridCoord {
  return {
    col: Math.max(0, Math.round((p.x - GRID_SPACING) / STEP)),
    row: Math.max(0, Math.round((p.y - GRID_SPACING) / STEP)),
  };
}

/**
 * Converts grid cell coordinates to pixel coordinates
 * 
 * Example: grid (2, 1) → pixel (460, 240)
 * 
 * Formula: pixel = GRID_SPACING + (grid_position * STEP)
 * For col 2: 20 + (2 * 220) = 460px
 * 
 * @param g - Grid cell coordinates  
 * @returns Pixel coordinates of top-left corner
 */
export function gridToPixel(g: GridCoord): Point {
  return {
    x: GRID_SPACING + g.col * STEP,
    y: GRID_SPACING + g.row * STEP,
  };
}

// ============================================================================
// COLLISION DETECTION - Preventing tiles from overlapping
// ============================================================================

/**
 * Gets the span information for a tile size
 * 
 * @param size - Tile size
 * @returns How many columns and rows this tile occupies
 */
function spansFor(size: TileSize): { spanCols: number; spanRows: number } {
  const { spanCols, spanRows } = TILE_DIMENSIONS[size];
  return { spanCols, spanRows };
}

/**
 * Checks if two rectangles overlap
 * 
 * Uses standard rectangle intersection algorithm.
 * Two rectangles DON'T overlap if one is completely to the left, right, 
 * above, or below the other.
 * 
 * @param a - First rectangle
 * @param b - Second rectangle
 * @returns True if rectangles overlap
 */
function rectOverlap(
  a: { x: number; y: number; w: number; h: number }, 
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return !(a.x + a.w <= b.x || 
           b.x + b.w <= a.x || 
           a.y + a.h <= b.y || 
           b.y + b.h <= a.y);
}

/**
 * Converts a tile to a rectangle for collision detection
 * 
 * @param tile - Tile to convert
 * @returns Rectangle with x, y, width, height
 */
function tileRect(tile: TileDefinition): { x: number; y: number; w: number; h: number } {
  const d = TILE_DIMENSIONS[tile.size];
  return { 
    x: tile.position.x, 
    y: tile.position.y, 
    w: d.width, 
    h: d.height 
  };
}

/**
 * Checks if a tile would collide with any tiles in a list
 * 
 * This is the core collision detection function used to prevent overlapping.
 * 
 * @param candidate - Tile to test for collisions
 * @param others - List of existing tiles to check against
 * @returns True if candidate would overlap with any existing tile
 */
export function collides(candidate: TileDefinition, others: TileDefinition[]): boolean {
  const candidateRect = tileRect(candidate);
  return others.some(tile => rectOverlap(candidateRect, tileRect(tile)));
}

// ============================================================================
// CONTAINER DIMENSIONS - Creating perfectly sized grid containers
// ============================================================================

/**
 * Calculates exact container dimensions based on tile positions
 * 
 * This ensures the container width/height are exact multiples of the grid,
 * preventing tiles from snapping outside the visible area.
 * 
 * The container will have:
 * - Leading gutter: GRID_SPACING
 * - Columns: each STEP wide (CELL + GRID_SPACING) 
 * - Trailing space for dragging
 * 
 * @param tiles - Current tiles to analyze
 * @param minColumns - Minimum columns even if tiles don't fill them
 * @returns Exact container dimensions and grid info
 */
export function calculateContainerDimensions(
  tiles: TileDefinition[], 
  minColumns = 4
): { width: number; height: number; columns: number; rows: number } {
  
  // Find the rightmost and bottommost grid positions
  let maxCol = 0;
  let maxRow = 0;
  
  for (const tile of tiles) {
    const origin = pixelToGrid(tile.position);
    const { spanCols, spanRows } = spansFor(tile.size);
    
    // Track the furthest extent of each tile
    maxCol = Math.max(maxCol, origin.col + spanCols);
    maxRow = Math.max(maxRow, origin.row + spanRows);
  }
  
  // Ensure minimum size for usability
  const columns = Math.max(minColumns, maxCol);
  const rows = Math.max(3, maxRow); // At least 3 rows for breathing room
  
  // Calculate exact pixel dimensions
  // Formula: leading_gutter + (columns * step_size)
  // This creates a container that's perfectly aligned to the grid
  const width = GRID_SPACING + columns * STEP;
  const height = GRID_SPACING + rows * STEP;
  
  return { width, height, columns, rows };
}

// ============================================================================
// BOUNDARY CHECKING - Keeping tiles within the container
// ============================================================================

/**
 * Checks if a tile at a given grid position would fit within column bounds
 * 
 * Prevents tiles from extending beyond the right edge of the container.
 * 
 * @param g - Grid position to test
 * @param size - Size of tile to place
 * @param maxColumns - Maximum columns in container
 * @returns True if tile fits within bounds
 */
function withinColumns(g: GridCoord, size: TileSize, maxColumns: number): boolean {
  const { spanCols } = spansFor(size);
  return g.col + spanCols <= maxColumns;
}

// ============================================================================
// INTELLIGENT POSITIONING - Finding the best spot for tiles
// ============================================================================

/**
 * Finds the nearest available position for a tile using spiral search
 * 
 * This is the core iPhone-style positioning algorithm:
 * 1. Try to place the tile at the desired position
 * 2. If blocked, search in expanding rings around the desired position  
 * 3. Return the closest available spot that fits the tile
 * 
 * The search pattern looks like:
 *   4 3 2 3 4
 *   3 2 1 2 3  
 *   2 1 X 1 2  ← X is desired position
 *   3 2 1 2 3
 *   4 3 2 3 4
 * 
 * Numbers indicate search order - finds closest available spot.
 * 
 * @param tile - Tile to position
 * @param desiredPx - Desired pixel position (from user drag)
 * @param others - Existing tiles to avoid
 * @param containerColumns - Container width in columns (for bounds checking)
 * @returns Best available pixel position
 */
export function findNearestAvailablePosition(
  tile: TileDefinition, 
  desiredPx: Point, 
  others: TileDefinition[], 
  containerColumns?: number
): Point {
  
  // Convert desired position to grid coordinates and snap to valid position
  const desired = pixelToGrid(snapPositionToGrid(desiredPx));

  // Get tile span info for boundary checking
  const { spanCols, spanRows } = spansFor(tile.size);
  
  // Determine container bounds
  const { columns: usedColumns } = calculateContainerDimensions(others);
  const maxColumns = Math.max(usedColumns, containerColumns ?? usedColumns);

  // Track visited positions to avoid duplicate checks
  const seen = new Set<string>();
  const encode = (c: GridCoord) => `${c.col}:${c.row}`;

  /**
   * Spiral search algorithm - expands outward in rings
   * 
   * For each radius (distance from desired position):
   * 1. Generate all positions at that distance (forming a "ring")
   * 2. Test each position in the ring
   * 3. Return the first valid position found
   * 
   * This guarantees finding the closest available position.
   */
  for (let radius = 0; radius <= 200; radius++) { // Reasonable upper bound
    
    // Generate all positions in the current ring
    const ring: GridCoord[] = [];
    
    if (radius === 0) {
      // Special case: radius 0 is just the center point
      ring.push(desired);
    } else {
      // Generate the perimeter of the square at this radius
      
      // Top and bottom edges
      for (let dx = -radius; dx <= radius; dx++) {
        ring.push({ col: desired.col + dx, row: desired.row - radius }); // Top edge
        ring.push({ col: desired.col + dx, row: desired.row + radius });  // Bottom edge
      }
      
      // Left and right edges (excluding corners already added)
      for (let dy = -radius + 1; dy <= radius - 1; dy++) {
        ring.push({ col: desired.col - radius, row: desired.row + dy }); // Left edge
        ring.push({ col: desired.col + radius, row: desired.row + dy }); // Right edge
      }
    }

    // Test each position in the current ring
    for (const cell of ring) {
      // Skip invalid positions
      if (cell.col < 0 || cell.row < 0) continue;
      if (!withinColumns(cell, tile.size, Math.max(maxColumns, spanCols))) continue;

      // Convert to pixel coordinates and create candidate tile
      const px = gridToPixel(cell);
      const candidate: TileDefinition = { ...tile, position: px };
      
      // If no collision, we found our spot!
      if (!collides(candidate, others)) {
        return px;
      }
    }
  }

  // Fallback to snapped desired position if nothing found
  // (This shouldn't happen in practice with reasonable container sizes)
  return gridToPixel(desired);
}

// ============================================================================
// VALIDATION - Ensuring grid integrity
// ============================================================================

/**
 * Validates that all tiles are properly positioned and don't overlap
 * 
 * Checks two things:
 * 1. All tiles are aligned to the grid (no off-grid positions)
 * 2. No tiles overlap with each other
 * 
 * Useful for debugging and ensuring data integrity.
 * 
 * @param tiles - Tiles to validate
 * @returns True if all tiles are valid
 */
export function validateTilePositions(tiles: TileDefinition[]): boolean {
  // Check 1: Grid alignment
  // Every tile position should match its snapped position
  const aligned = tiles.every(tile => {
    const snapped = snapPositionToGrid(tile.position);
    return snapped.x === tile.position.x && snapped.y === tile.position.y;
  });
  
  if (!aligned) {
    console.warn('Some tiles are not aligned to grid');
    return false;
  }

  // Check 2: No collisions
  // Test each tile against all other tiles
  for (let i = 0; i < tiles.length; i++) {
    const currentTile = tiles[i];
    const otherTiles = tiles.filter((_, j) => j !== i);
    
    if (collides(currentTile, otherTiles)) {
      console.warn(`Tile ${currentTile.id} overlaps with another tile`);
      return false;
    }
  }

  return true;
}

// ============================================================================
// AUTO-ARRANGEMENT - Automatic tile organization
// ============================================================================

/**
 * Automatically arranges tiles in a clean grid layout
 * 
 * Places tiles left-to-right, top-to-bottom like text, wrapping to new rows
 * when the current row is full. Creates a neat, organized layout.
 * 
 * Algorithm:
 * 1. Start at position (0,0) 
 * 2. For each tile, find the next available space
 * 3. Mark the space as occupied
 * 4. Move to next position, wrapping rows as needed
 * 
 * @param tiles - Tiles to arrange
 * @param columns - Maximum columns before wrapping
 * @returns New tiles array with arranged positions
 */
export function autoArrangeTiles(tiles: TileDefinition[], columns = 4): TileDefinition[] {
  let col = 0;
  let row = 0;
  
  // Track which grid cells are occupied
  // occupied[row][col] = true means that cell is taken
  const occupied: boolean[][] = [];
  const occ = (c: number, r: number) => occupied[r]?.[c];
  const mark = (c: number, r: number) => { 
    (occupied[r] ||= []); 
    occupied[r][c] = true; 
  };

  /**
   * Finds the next available position for a tile of given size
   * 
   * Advances through the grid left-to-right, top-to-bottom until
   * it finds a spot where the entire tile fits.
   * 
   * @param spanCols - Tile width in columns
   * @param spanRows - Tile height in rows  
   * @returns Grid coordinates where tile can be placed
   */
  const placeAt = (spanCols: number, spanRows: number): GridCoord => {
    while (true) {
      // Check if tile fits at current position
      let fits = true;
      
      for (let dy = 0; dy < spanRows; dy++) {
        for (let dx = 0; dx < spanCols; dx++) {
          const testCol = col + dx;
          const testRow = row + dy;
          
          // Tile extends beyond column limit or cell is occupied
          if (testCol >= columns || occ(testCol, testRow)) {
            fits = false;
            break;
          }
        }
        if (!fits) break;
      }
      
      if (fits) {
        // Mark all cells as occupied
        for (let dy = 0; dy < spanRows; dy++) {
          for (let dx = 0; dx < spanCols; dx++) {
            mark(col + dx, row + dy);
          }
        }
        return { col, row };
      }
      
      // Advance to next position
      col++;
      if (col >= columns) {
        col = 0;
        row++;
      }
    }
  };

  // Arrange each tile
  return tiles.map(tile => {
    const { spanCols, spanRows } = spansFor(tile.size);
    const gridPosition = placeAt(spanCols, spanRows);
    const pixelPosition = gridToPixel(gridPosition);
    
    return { ...tile, position: pixelPosition };
  });
}

// ============================================================================
// DEBUGGING UTILITIES - Development and troubleshooting tools  
// ============================================================================

/**
 * Utility to debug grid positions - logs tile positions in a readable format
 * 
 * Useful during development to understand where tiles are positioned
 * and verify grid alignment.
 * 
 * @param tiles - Tiles to debug
 */
export function debugTilePositions(tiles: TileDefinition[]): void {
  console.log('=== Tile Grid Debug Information ===');
  console.log(`Grid: ${GRID_SPACING}px gutters, ${CELL}px cells, ${STEP}px steps`);
  console.log('');
  
  tiles.forEach((tile, index) => {
    const grid = pixelToGrid(tile.position);
    const dimensions = spansFor(tile.size);
    const pixelDims = TILE_DIMENSIONS[tile.size];
    
    console.log(`${index + 1}. ${tile.title}:`);
    console.log(`   Size: ${tile.size} (${dimensions.spanCols}×${dimensions.spanRows} grid cells)`);
    console.log(`   Grid: col ${grid.col}, row ${grid.row}`);
    console.log(`   Pixel: (${tile.position.x}, ${tile.position.y}) ${pixelDims.width}×${pixelDims.height}px`);
    console.log('');
  });
  
  const containerDims = calculateContainerDimensions(tiles);
  console.log(`Container: ${containerDims.width}×${containerDims.height}px (${containerDims.columns}×${containerDims.rows} grid)`);
  console.log(`Valid layout: ${validateTilePositions(tiles) ? '✅' : '❌'}`);
}