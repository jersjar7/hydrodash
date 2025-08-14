// components/Map/RiverOverlay.tsx
'use client';
import { useEffect, useRef } from 'react';

interface RiverOverlayProps {
  map: mapkit.Map | null;
  geojson: any;
  lineColor?: string;
  lineWidth?: number;
}

export default function RiverOverlay({ 
  map, 
  geojson, 
  lineColor = '#1e40af', 
  lineWidth = 3 
}: RiverOverlayProps) {
  const overlaysRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map || !geojson?.features?.length) return;

    const mapkitInstance = (window as any).mapkit;
    if (!mapkitInstance) return;

    const newOverlays: any[] = [];

    try {
      // Create individual polyline overlays for each feature
      geojson.features.forEach((feature: any) => {
        if (feature.geometry.type === 'LineString') {
          const coordinates = feature.geometry.coordinates.map((coord: number[]) => 
            new mapkitInstance.Coordinate(coord[1], coord[0]) // lat, lng
          );

          const polyline = new mapkitInstance.PolylineOverlay(coordinates, {
            style: new mapkitInstance.Style({
              lineWidth,
              strokeColor: lineColor,
              strokeOpacity: 0.8,
            })
          });

          map.addOverlay(polyline);
          newOverlays.push(polyline);
        }
      });

      overlaysRef.current = newOverlays;
      console.log(`Added ${newOverlays.length} river overlays`);
    } catch (error) {
      console.error('Error creating overlays:', error);
    }

    return () => {
      overlaysRef.current.forEach(overlay => {
        if (map && overlay) {
          try {
            map.removeOverlay(overlay);
          } catch (error) {
            console.error('Error removing overlay:', error);
          }
        }
      });
      overlaysRef.current = [];
    };
  }, [map, geojson, lineColor, lineWidth]);

  return null;
}