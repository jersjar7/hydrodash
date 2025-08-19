// app/api/return-periods/[reachId]/route.ts
/**
 * Next.js API Route to proxy return periods requests
 * This bypasses CORS restrictions by making the request server-side
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/secrets.local';

export async function GET(
  request: NextRequest,
  { params }: { params: { reachId: string } }
) {
  const { reachId } = params;

  try {
    // Validate reach ID
    if (!reachId || reachId.trim() === '') {
      return NextResponse.json(
        { error: 'Reach ID is required' },
        { status: 400 }
      );
    }

    // Build external API URL
    const externalUrl = new URL('/return-period', config.public.api.returnPeriodsBaseUrl);
    externalUrl.searchParams.set('comids', reachId);
    externalUrl.searchParams.set('key', config.secrets.api.returnPeriodsApiKey);

    console.log(`[API] Proxying return periods request for reach ${reachId}`);
    console.log(`[API] External URL: ${externalUrl.toString()}`);

    // Make request to external API (server-side, no CORS issues)
    const response = await fetch(externalUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': `HydroDash/${config.public.app.version}`,
      },
    });

    // Log response details
    console.log(`[API] External API response status: ${response.status}`);

    if (!response.ok) {
      console.error(`[API] External API error: ${response.status} ${response.statusText}`);
      
      // Try to get error details
      let errorDetails = '';
      try {
        errorDetails = await response.text();
        console.error(`[API] Error response body:`, errorDetails);
      } catch (e) {
        console.error(`[API] Could not read error response`);
      }

      return NextResponse.json(
        { 
          error: `External API error: ${response.status} ${response.statusText}`,
          details: errorDetails
        },
        { status: response.status }
      );
    }

    // Parse and return the data
    const data = await response.json();
    
    console.log(`[API] Successfully proxied return periods for reach ${reachId}`);
    console.log(`[API] Response data:`, data);

    // Return the data with proper headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error(`[API] Proxy error for reach ${reachId}:`, error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}