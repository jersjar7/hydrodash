// components/Map/Map.tsx
'use client';
import { useEffect, useRef, useState } from 'react';

interface MapProps {
  center: { lat: number; lon: number };
  zoom?: number;
  onReady?: (map: mapkit.Map) => void;
  className?: string;
}

export default function Map({ center, zoom = 7, onReady, className }: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapkit.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function initMap() {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch token
        const res = await fetch('/api/mapkit-token');
        if (!res.ok) {
          throw new Error(`Token fetch failed: ${res.status}`);
        }
        const { token } = await res.json();

        // 2. Load MapKit JS if needed (check window object properly)
        if (typeof window !== 'undefined' && !(window as any).mapkit) {
          // Check if script tag already exists before appending
          if (!document.querySelector('script[src^="https://cdn.apple-mapkit.com/mk/"]')) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
              script.async = true;
              script.onload = () => resolve();
              script.onerror = () => reject(new Error('MapKit failed to load'));
              document.head.appendChild(script);
            });
          }
        }

        if (canceled) return;

        // 3. Initialize MapKit (check if already initialized)
        const mapkitInstance = (window as any).mapkit;
        if (!mapkitInstance) {
          throw new Error('MapKit failed to load');
        }

        // Only initialize if not already done
        if (!mapkitInstance._initialized) {
          mapkitInstance.init({
            authorizationCallback: (done: (token: string) => void) => done(token),
            language: 'en',
          });
          (mapkitInstance as any)._initialized = true;
        }

        // 4. Create map
        const container = containerRef.current;
        if (!container) return;

        const map = new mapkitInstance.Map(container, {
          center: new mapkitInstance.Coordinate(center.lat, center.lon),
          showsZoomControl: true,
          showsMapTypeControl: false,
          colorScheme: 'light',
        });

        // 5. Set region based on zoom
        map.region = new mapkitInstance.CoordinateRegion(
          new mapkitInstance.Coordinate(center.lat, center.lon),
          new mapkitInstance.CoordinateSpan(1 / zoom, 1 / zoom)
        );

        mapRef.current = map;
        setIsLoading(false);
        onReady?.(map);
      } catch (error) {
        console.error('Map initialization failed:', error);
        setError(error instanceof Error ? error.message : 'Map failed to load');
        setIsLoading(false);
      }
    }

    initMap();

    return () => {
      canceled = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [center.lat, center.lon, zoom, onReady]);

  return (
    <div className={className ?? 'w-full h-full rounded-lg overflow-hidden relative'}>
      <div ref={containerRef} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-gray-600">Loading map...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg">
          <div className="text-red-600 text-center p-4">
            <div className="font-medium">Map Error</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}