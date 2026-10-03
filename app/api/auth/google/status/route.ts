import { NextResponse } from 'next/server';
import { getPublicOrigin } from '@/lib/auth';

export async function GET(request: Request) {
  const origin = getPublicOrigin(request);
  const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const isConfigured = Boolean(googleClientId && googleClientSecret);

  return NextResponse.json({
    configured: isConfigured,
    clientId: googleClientId ? `${googleClientId.slice(0, 16)}...` : null,
    redirectUri: `${origin}/api/auth/google/callback`,
  });
}
