// app/api/reaches/[reachId]/route.ts
/**
 * API Route: GET /api/reaches/[reachId]
 * Returns river reach metadata (name, coordinates, available series)
 * 
 * Examples:
 * - GET /api/reaches/10376192 → reach metadata
 * - Used when streams are clicked on map to get basic info
 */

import { NextRequest, NextResponse } from 'next/server';
import type { RiverReach, ApiResponse } from '@/types';
import { getReachMetadata } from '@/services/noaaService';
import { toReachId } from '@/lib/utils/ids';
import { ApiError } from '@/types/utils';

type ReachApiResponse = ApiResponse<RiverReach>;

export async function GET(
  request: NextRequest,
  { params }: { params: { reachId: string } }
): Promise<NextResponse<ReachApiResponse>> {
  try {
    // Extract reachId from URL params
    const rawReachId = params.reachId;
    
    if (!rawReachId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing reachId parameter'
        },
        { status: 400 }
      );
    }

    const reachId = toReachId(rawReachId);
    
    // Basic reachId format validation
    if (!isValidReachId(reachId)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid reachId format'
        },
        { status: 400 }
      );
    }

    console.log(`Fetching metadata for reach ${reachId}`);

    // Fetch reach metadata using existing service
    const reachData = await getReachMetadata(reachId);
    
    if (!reachData) {
      return NextResponse.json(
        {
          ok: false,
          error: `Reach ${reachId} not found`
        },
        { status: 404 }
      );
    }

    console.log(`✓ Successfully returned metadata for ${reachData.name || reachId}`);

    // Success response
    return NextResponse.json(
      {
        ok: true,
        data: reachData
      },
      { 
        status: 200,
        headers: {
          // Cache metadata for 1 hour (doesn't change often)
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
        }
      }
    );

  } catch (error) {
    console.error(`Reach metadata API error for reach ${params.reachId}:`, error);
    
    // Handle structured API errors
    if (ApiError.isApiError(error)) {
      const statusCode = error.statusCode >= 400 && error.statusCode < 600 
        ? error.statusCode 
        : 500;
        
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          context: error.details || undefined
        },
        { status: statusCode }
      );
    }
    
    // Handle unexpected errors
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error while fetching reach metadata'
      },
      { status: 500 }
    );
  }
}

/**
 * Validate reachId format
 * NOAA reach IDs are typically 8-10 digit numbers
 */
function isValidReachId(reachId: string): boolean {
  return /^\d+$/.test(reachId) && reachId.length >= 3 && reachId.length <= 15;
}

/**
 * Optional: Add OPTIONS handler for CORS if needed
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}