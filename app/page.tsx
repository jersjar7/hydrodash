// app/page.tsx
'use client';
import { useState } from 'react';
import Map from '@/components/Map/Map';
import RiverOverlay from '@/components/Map/RiverOverlay';

export default function TestMapPage() {
  const [map, setMap] = useState<mapkit.Map | null>(null);

  // Sample GeoJSON for testing (Utah rivers)
  const testRiverData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Jordan River' },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-111.9400, 40.7680], // Salt Lake City area
            [-111.9300, 40.7500],
            [-111.9200, 40.7300],
            [-111.9100, 40.7100],
          ],
        },
      },
      {
        type: 'Feature',
        properties: { name: 'Provo River' },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-111.6500, 40.2300], // Provo area
            [-111.6400, 40.2200],
            [-111.6300, 40.2100],
            [-111.6200, 40.2000],
          ],
        },
      },
    ],
  } as const;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          HydroDash MapKit Test
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">Map View</h2>
              <div className="h-96 w-full">
                <Map 
                  center={{ lat: 40.7608, lon: -111.8910 }} // Salt Lake City
                  zoom={10} 
                  onReady={setMap}
                  className="w-full h-full rounded-lg border"
                />
                {map && (
                  <RiverOverlay 
                    map={map} 
                    geojson={testRiverData as any}
                    lineColor="#2563eb"
                    lineWidth={4}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-3">Map Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Map Loaded:</span>
                  <span className={map ? 'text-green-600' : 'text-red-600'}>
                    {map ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rivers Shown:</span>
                  <span className="text-blue-600">2</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-3">Test Data</h3>
              <ul className="text-sm space-y-1">
                <li>• Jordan River (Salt Lake)</li>
                <li>• Provo River (Provo)</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-3">Next Steps</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>✓ MapKit JS integration</li>
                <li>✓ GeoJSON river overlay</li>
                <li>○ NOAA API integration</li>
                <li>○ Real river data</li>
                <li>○ Flow forecasting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}