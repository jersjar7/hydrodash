// hooks/useSavedPlaces.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SavedPlace, ReachId } from '@/types';

// Local storage key
const SAVED_PLACES_KEY = 'hydrodash-saved-places';

// Hook options
interface UseSavedPlacesOptions {
  /** Auto-save to localStorage on changes */
  autoSave?: boolean;
  /** Maximum number of saved places */
  maxPlaces?: number;
}

// Add place input (some fields are optional/auto-generated)
interface AddPlaceInput {
  name: string;
  reachId?: ReachId;
  lat?: number;
  lon?: number;
  notes?: string;
  photoUrl?: string;
  isPrimary?: boolean;
}

// Update place input (all fields optional except id)
interface UpdatePlaceInput {
  id: string;
  name?: string;
  reachId?: ReachId;
  lat?: number;
  lon?: number;
  notes?: string;
  photoUrl?: string;
  isPrimary?: boolean;
}

// Hook return type
interface UseSavedPlacesReturn {
  // State
  places: SavedPlace[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addPlace: (place: AddPlaceInput) => Promise<SavedPlace>;
  removePlace: (placeId: string) => Promise<void>;
  updatePlace: (updates: UpdatePlaceInput) => Promise<SavedPlace | null>;
  clearAllPlaces: () => Promise<void>;
  
  // Utilities
  getPlaceById: (placeId: string) => SavedPlace | null;
  getPlaceByReachId: (reachId: ReachId) => SavedPlace | null;
  getPrimaryPlace: () => SavedPlace | null;
  setPrimaryPlace: (placeId: string) => Promise<void>;
  
  // Queries
  hasPlace: (reachId: ReachId) => boolean;
  getPlaceCount: () => number;
  canAddMore: () => boolean;
  
  // Persistence
  saveToStorage: () => void;
  loadFromStorage: () => void;
  exportPlaces: () => string;
  importPlaces: (jsonData: string) => Promise<void>;
}

// ========================================
// Primary Hook: useSavedPlaces
// ========================================

/**
 * React hook for managing user's saved river monitoring locations
 * 
 * @param options - Configuration options
 * @returns Object with places array and management functions
 * 
 * @example
 * ```tsx
 * const { 
 *   places, 
 *   addPlace, 
 *   removePlace, 
 *   hasPlace,
 *   isLoading 
 * } = useSavedPlaces();
 * 
 * // Add a new place
 * const handleAddPlace = async () => {
 *   try {
 *     await addPlace({
 *       name: 'Provo River',
 *       reachId: '10376192',
 *       type: 'recreation'
 *     });
 *   } catch (error) {
 *     console.error('Failed to add place:', error);
 *   }
 * };
 * 
 * // Check if already saved
 * const isSaved = hasPlace('10376192');
 * ```
 */
export function useSavedPlaces(
  options: UseSavedPlacesOptions = {}
): UseSavedPlacesReturn {
  const {
    autoSave = true,
    maxPlaces = 50,
  } = options;

  // State
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // Persistence Functions
  // ========================================

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(places));
      setError(null);
      
      // Dispatch custom event to notify other hook instances
      window.dispatchEvent(new CustomEvent('saved-places-changed', {
        detail: { places, source: 'useSavedPlaces' }
      }));
      
    } catch (err) {
      const errorMsg = 'Failed to save places to localStorage';
      console.error(errorMsg, err);
      setError(errorMsg);
    }
  }, [places]);

  const loadFromStorage = useCallback(() => {
    try {
      setIsLoading(true);
      const stored = localStorage.getItem(SAVED_PLACES_KEY);
      
      if (stored) {
        const parsed: SavedPlace[] = JSON.parse(stored);
        
        // Validate data structure
        const validPlaces = parsed.filter(place => 
          place && 
          typeof place.id === 'string' && 
          typeof place.name === 'string' &&
          typeof place.createdAt === 'string'
        );
        
        setPlaces(validPlaces);
        console.log(`Loaded ${validPlaces.length} saved places from localStorage`);
      }
      
      setError(null);
    } catch (err) {
      const errorMsg = 'Failed to load places from localStorage';
      console.error(errorMsg, err);
      setError(errorMsg);
      setPlaces([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load from storage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Listen for storage changes from other components/tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SAVED_PLACES_KEY) {
        console.log('🔄 Saved places changed in another component, reloading...');
        loadFromStorage();
      }
    };

    const handleCustomChange = (e: CustomEvent) => {
      // Avoid infinite loops by checking if this instance caused the change
      if (e.detail.source !== 'useSavedPlaces') {
        console.log('🔄 Saved places changed via custom event, reloading...');
        loadFromStorage();
      }
    };

    // Listen for changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for changes from other components in same tab
    window.addEventListener('saved-places-changed', handleCustomChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('saved-places-changed', handleCustomChange as EventListener);
    };
  }, [loadFromStorage]);

  // Auto-save when places change
  useEffect(() => {
    if (!isLoading && autoSave && places.length >= 0) {
      saveToStorage();
    }
  }, [places, autoSave, saveToStorage, isLoading]);

  // ========================================
  // Core CRUD Operations
  // ========================================

  const addPlace = useCallback(async (input: AddPlaceInput): Promise<SavedPlace> => {
    try {
      // Validate input
      if (!input.name.trim()) {
        throw new Error('Place name is required');
      }

      if (!input.reachId && (!input.lat || !input.lon)) {
        throw new Error('Either reachId or coordinates (lat/lon) are required');
      }

      // Check for duplicates
      if (input.reachId) {
        const existing = places.find(p => p.reachId === input.reachId);
        if (existing) {
          throw new Error(`Place with reach ID ${input.reachId} already exists`);
        }
      }

      // Check max places limit
      if (places.length >= maxPlaces) {
        throw new Error(`Maximum ${maxPlaces} places allowed`);
      }

      // Create new place
      const now = new Date().toISOString();
      const newPlace: SavedPlace = {
        id: generatePlaceId(),
        name: input.name.trim(),
        reachId: input.reachId,
        lat: input.lat,
        lon: input.lon,
        notes: input.notes,
        photoUrl: input.photoUrl,
        isPrimary: input.isPrimary || false,
        createdAt: now,
        updatedAt: now,
      };

      // If this is primary, clear other primary flags
      let updatedPlaces = places;
      if (newPlace.isPrimary) {
        updatedPlaces = places.map(p => ({ ...p, isPrimary: false }));
      }

      setPlaces([...updatedPlaces, newPlace]);
      setError(null);
      
      console.log(`✅ Added saved place: ${newPlace.name}`);
      return newPlace;
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add place';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [places, maxPlaces]);

  const removePlace = useCallback(async (placeId: string): Promise<void> => {
    try {
      const placeExists = places.some(p => p.id === placeId);
      if (!placeExists) {
        throw new Error(`Place with ID ${placeId} not found`);
      }

      setPlaces(prev => prev.filter(p => p.id !== placeId));
      setError(null);
      
      console.log(`🗑️ Removed saved place: ${placeId}`);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove place';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [places]);

  const updatePlace = useCallback(async (updates: UpdatePlaceInput): Promise<SavedPlace | null> => {
    try {
      const existingPlace = places.find(p => p.id === updates.id);
      if (!existingPlace) {
        throw new Error(`Place with ID ${updates.id} not found`);
      }

      // Create updated place
      const updatedPlace: SavedPlace = {
        ...existingPlace,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // If setting as primary, clear other primary flags
      let updatedPlaces = places;
      if (updates.isPrimary) {
        updatedPlaces = places.map(p => ({ ...p, isPrimary: false }));
      }

      // Update the specific place
      const finalPlaces = updatedPlaces.map(p => 
        p.id === updates.id ? updatedPlace : p
      );

      setPlaces(finalPlaces);
      setError(null);
      
      console.log(`📝 Updated saved place: ${updatedPlace.name}`);
      return updatedPlace;
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update place';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [places]);

  const clearAllPlaces = useCallback(async (): Promise<void> => {
    try {
      setPlaces([]);
      setError(null);
      console.log('🧹 Cleared all saved places');
    } catch (err) {
      const errorMsg = 'Failed to clear places';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // ========================================
  // Utility Functions
  // ========================================

  const getPlaceById = useCallback((placeId: string): SavedPlace | null => {
    return places.find(p => p.id === placeId) || null;
  }, [places]);

  const getPlaceByReachId = useCallback((reachId: ReachId): SavedPlace | null => {
    return places.find(p => p.reachId === reachId) || null;
  }, [places]);

  const getPrimaryPlace = useCallback((): SavedPlace | null => {
    return places.find(p => p.isPrimary) || null;
  }, [places]);

  const setPrimaryPlace = useCallback(async (placeId: string): Promise<void> => {
    const place = getPlaceById(placeId);
    if (!place) {
      throw new Error(`Place with ID ${placeId} not found`);
    }

    // Clear all primary flags, then set this one
    const updatedPlaces = places.map(p => ({
      ...p,
      isPrimary: p.id === placeId,
      updatedAt: p.id === placeId ? new Date().toISOString() : p.updatedAt,
    }));

    setPlaces(updatedPlaces);
  }, [places, getPlaceById]);

  // ========================================
  // Query Functions
  // ========================================

  const hasPlace = useCallback((reachId: ReachId): boolean => {
    return places.some(p => p.reachId === reachId);
  }, [places]);

  const getPlaceCount = useCallback((): number => {
    return places.length;
  }, [places]);

  const canAddMore = useCallback((): boolean => {
    return places.length < maxPlaces;
  }, [places, maxPlaces]);

  // ========================================
  // Import/Export Functions
  // ========================================

  const exportPlaces = useCallback((): string => {
    return JSON.stringify(places, null, 2);
  }, [places]);

  const importPlaces = useCallback(async (jsonData: string): Promise<void> => {
    try {
      const imported: SavedPlace[] = JSON.parse(jsonData);
      
      if (!Array.isArray(imported)) {
        throw new Error('Invalid format: expected array of places');
      }

      // Validate imported data
      const validPlaces = imported.filter(place => 
        place && 
        typeof place.id === 'string' && 
        typeof place.name === 'string'
      );

      if (validPlaces.length === 0) {
        throw new Error('No valid places found in import data');
      }

      setPlaces(validPlaces);
      setError(null);
      
      console.log(`📥 Imported ${validPlaces.length} places`);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to import places';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // ========================================
  // Return Hook Interface
  // ========================================

  return {
    // State
    places,
    isLoading,
    error,
    
    // Actions
    addPlace,
    removePlace,
    updatePlace,
    clearAllPlaces,
    
    // Utilities
    getPlaceById,
    getPlaceByReachId,
    getPrimaryPlace,
    setPrimaryPlace,
    
    // Queries
    hasPlace,
    getPlaceCount,
    canAddMore,
    
    // Persistence
    saveToStorage,
    loadFromStorage,
    exportPlaces,
    importPlaces,
  };
}

// ========================================
// Helper Functions
// ========================================

/**
 * Generate a unique ID for a new place
 */
function generatePlaceId(): string {
  return `place_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ========================================
// Utility Hooks
// ========================================

/**
 * Hook to check if a specific reach is saved
 * Useful for "Add to Saved Places" button states
 */
export function useIsPlaceSaved(reachId: ReachId | null) {
  const { hasPlace } = useSavedPlaces();
  return reachId ? hasPlace(reachId) : false;
}

/**
 * Hook to get a saved place by reach ID
 * Useful for displaying saved place info
 */
export function useSavedPlace(reachId: ReachId | null) {
  const { getPlaceByReachId } = useSavedPlaces();
  return reachId ? getPlaceByReachId(reachId) : null;
}