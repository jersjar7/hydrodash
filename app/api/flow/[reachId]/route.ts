// app/api/flow/[reachId]/route.ts
/**
 * API Route: GET /api/flow/[reachId]
 * App Router version - returns normalized streamflow forecast
 * 
 * Query Parameters:
 * - range: 'short' | 'medium' | 'long' | 'all' (default: 'short')
 * 
 * Examples:
 * - GET /api/flow/10376192 → short-range forecast (18-hour)
 * - GET /api/flow/10376192?range=medium → medium-range forecast (~10-day)
 * - GET /api/flow/10376192?range=long → long-range forecast (~30-day)
 * - GET /api/flow/10376192?range=all → all available ranges combined
 */

import { NextRequest, NextResponse } from 'next/server';
import type { NormalizedFlowForecast, ApiResponse, ReachId } from '@/types';
import { 
  getShortRangeForecast,
  getMediumRangeForecast, 
  getLongRangeForecast,
  getAllRangeForecasts 
} from '@/services/noaaService';
import { toReachId } from '@/lib/utils/ids';
import { ApiError } from '@/types/utils';

type FlowApiResponse = ApiResponse<NormalizedFlowForecast>;
type ForecastRange = 'short' | 'medium' | 'long' | 'all';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reachId: string }> }
): Promise<NextResponse<FlowApiResponse>> {
  let reachId: ReachId;
  let rawReachId: string = 'unknown';
  
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    rawReachId = resolvedParams.reachId;
    
    if (!rawReachId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing reachId parameter'
        },
        { status: 400 }
      );
    }

    // Convert to branded ReachId type
    reachId = toReachId(rawReachId);
    
    // Basic reachId format validation
    if (!isValidReachId(rawReachId)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid reachId format'
        },
        { status: 400 }
      );
    }

    // Extract and validate range parameter
    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get('range') || 'short';
    
    if (!isValidRange(rangeParam)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid range parameter. Must be one of: short, medium, long, all. Got: ${rangeParam}`
        },
        { status: 400 }
      );
    }

    const range = rangeParam as ForecastRange;

    // Fetch forecast data using the appropriate service function
    let forecast: NormalizedFlowForecast;
    
    switch (range) {
      case 'short':
        console.log(`Fetching short-range forecast for reach ${reachId}`);
        forecast = await getShortRangeForecast(reachId);
        break;
        
      case 'medium':
        console.log(`Fetching medium-range forecast for reach ${reachId}`);
        forecast = await getMediumRangeForecast(reachId);
        break;
        
      case 'long':
        console.log(`Fetching long-range forecast for reach ${reachId}`);
        forecast = await getLongRangeForecast(reachId);
        break;
        
      case 'all':
        console.log(`Fetching all available forecasts for reach ${reachId}`);
        forecast = await getAllRangeForecasts(reachId);
        break;
        
      default:
        // TypeScript should catch this, but just in case
        return NextResponse.json(
          {
            ok: false,
            error: `Unsupported range: ${range}`
          },
          { status: 400 }
        );
    }
    
    // Validate we got data back
    if (!forecast || !forecast.series || forecast.series.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `No ${range} forecast data found for reach ${reachId}`
        },
        { status: 404 }
      );
    }

    // Add metadata about the request to the response
    const responseData = {
      ...forecast,
      metadata: {
        requestedRange: range,
        availableHorizons: forecast.series.map(s => s.horizon),
        totalDataPoints: forecast.series.reduce((sum, s) => sum + s.points.length, 0),
        fetchedAt: new Date().toISOString()
      }
    };

    console.log(`✓ Successfully returned ${range} forecast with ${responseData.metadata.totalDataPoints} total data points`);

    // Success response
    return NextResponse.json(
      {
        ok: true,
        data: responseData
      },
      { 
        status: 200,
        headers: {
          // Cache short-range for 5 minutes, longer ranges for 15 minutes
          'Cache-Control': range === 'short' 
            ? 'public, s-maxage=300, stale-while-revalidate=600'
            : 'public, s-maxage=900, stale-while-revalidate=1800'
        }
      }
    );

  } catch (error) {
    console.error(`Flow API error for reach ${rawReachId}:`, error);
    
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
        error: 'Internal server error while fetching flow data'
      },
      { status: 500 }
    );
  }
}

/**
 * Validate reachId format (works on raw string)
 * NOAA reach IDs are typically 8-10 digit numbers
 */
function isValidReachId(reachId: string): boolean {
  return /^\d+$/.test(reachId) && reachId.length >= 3 && reachId.length <= 15;
}

/**
 * Validate range parameter
 */
function isValidRange(range: string): range is ForecastRange {
  return ['short', 'medium', 'long', 'all'].includes(range);
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