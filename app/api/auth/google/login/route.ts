import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '/';

  const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${origin}/api/auth/google/callback`;

  // 1. Direct Google OAuth flow (Preferred if GOOGLE_CLIENT_ID is set)
  if (googleClientId) {
    const state = Buffer.from(JSON.stringify({ redirect })).toString('base64');
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', googleClientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('prompt', 'select_account'); // Forces Google account selection
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('state', state);

    return NextResponse.redirect(googleAuthUrl.toString());
  }

  // 2. Supabase OAuth flow (if Google Provider is enabled in Supabase)
  const supabase = getSupabase();
  if (supabase) {
    const callbackUrl = `${origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (!error && data?.url) {
      return NextResponse.redirect(data.url);
    }
  }

  // 3. Neither configured: redirect back to login with informative status
  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('redirect', redirect);
  loginUrl.searchParams.set('error', 'google_not_configured');
  return NextResponse.redirect(loginUrl.toString());
}
