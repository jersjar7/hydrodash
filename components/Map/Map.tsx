// components/Map/Map.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { appConfig } from '@/config';

type OnReady = (map: mapboxgl.Map) => void;

interface MapProps {
  className?: string;
  onReady?: OnReady;
  /** Called with reachId (station_id / STATIONID) when user clicks a stream */
  onPickReach?: (reachId: string) => void;
}

export default function Map({ className, onReady, onPickReach }: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    publicToken,
    tilesetId,
    sourceLayer,
    baseStyle,
  } = appConfig.public.map.mapbox;
  const { defaultCenter, defaultZoom } = appConfig.public.map;

  useEffect(() => {
    try {
      if (!containerRef.current) return;

      mapboxgl.accessToken = publicToken;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: baseStyle,
        center: [defaultCenter.lng, defaultCenter.lat],
        zoom: defaultZoom,
      });

      map.on('load', () => {
        // 1) Add vector source (your tileset)
        if (!map.getSource('streams')) {
          map.addSource('streams', {
            type: 'vector',
            url: `mapbox://${tilesetId}`,
          });
        }

        // 2) Add a line layer for streams
        if (!map.getLayer('streams-line')) {
          map.addLayer({
            id: 'streams-line',
            type: 'line',
            source: 'streams',
            'source-layer': sourceLayer, // "streams2-7jgd8p"
            paint: {
              'line-color': '#1e40af',
              'line-width': 1.5,
            },
          });
        }

        // 3) Click → reachId
        const clickHandler = (e: mapboxgl.MapLayerMouseEvent) => {
          const feat = e.features?.[0];
          const props = feat?.properties as Record<string, unknown> | undefined;
          const reachId = String(
            (props?.station_id as string | undefined) ??
            (props?.STATIONID as string | undefined) ??
            ''
          );
          if (reachId && onPickReach) onPickReach(reachId);
        };

        map.on('click', 'streams-line', clickHandler);
        (map as any).__hd_clickHandler = clickHandler;

        setIsLoading(false);
        onReady?.(map);
      });

      mapRef.current = map;

      return () => {
        const m = mapRef.current;
        if (m && (m as any).__hd_clickHandler) {
          m.off('click', 'streams-line', (m as any).__hd_clickHandler);
        }
        if (m) m.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Map failed to load');
      setIsLoading(false);
    }
  }, [publicToken, tilesetId, sourceLayer, baseStyle, defaultCenter, defaultZoom, onReady, onPickReach]);

  return (
    <div className={className ?? 'w-full h-full rounded-lg overflow-hidden relative'}>
      <div ref={containerRef} className="w-full h-full" />
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-600">Loading map…</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <div className="text-red-600 text-center p-4">
            <div className="font-medium">Map Error</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
