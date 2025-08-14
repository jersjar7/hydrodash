// app/api/mapkit-token/route.ts
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getServerConfig } from '@/config';

export async function GET() {
  try {
    const { secrets, public: publicConfig } = getServerConfig();
    const { teamId, keyId, privateKey } = secrets.apple;

    if (!teamId || !keyId || !privateKey) {
      return NextResponse.json({ error: 'MapKit secrets missing' }, { status: 500 });
    }

    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        iss: teamId,
        iat: now,
        exp: now + 60 * 30, // 30 minutes
        origin: publicConfig.appOrigin,
      },
      privateKey,
      {
        algorithm: 'ES256',
        header: { alg: 'ES256', kid: keyId, typ: 'JWT' },
      }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('MapKit token error:', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }
}