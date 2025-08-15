// app/page.tsx (example)
'use client';

import { useState } from 'react';
import Map from '@/components/Map/Map';

export default function Page() {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [reachId, setReachId] = useState<string | null>(null);

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">HydroDash (Mapbox)</h1>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="h-[70vh] rounded-lg border overflow-hidden">
          <Map onReady={setMap} onPickReach={setReachId} />
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="font-semibold mb-2">Selected Reach</div>
          <div className="text-sm">
            {reachId ? <code>{reachId}</code> : 'Click a stream'}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Map loaded: {map ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    </div>
  );
}
