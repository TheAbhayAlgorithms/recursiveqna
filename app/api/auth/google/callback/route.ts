import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { signToken, setAuthCookies, getPublicOrigin, UserSession } from '@/lib/auth';

function generateHandleFromEmail(email: string): string {
  const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const base = prefix.slice(0, 15) || 'scholar';
  return base;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getPublicOrigin(request);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');


  let redirectDestination = '/';
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      if (decoded.redirect) redirectDestination = decoded.redirect;
    } catch {}
  }

  if (error || !code) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', error || 'google_auth_failed');
    return NextResponse.redirect(loginUrl.toString());
  }

  const googleClientId = (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)?.trim();
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = `${origin}/api/auth/google/callback`;


  if (!googleClientId || !googleClientSecret) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'google_credentials_missing');
    return NextResponse.redirect(loginUrl.toString());
  }

  try {
    // 1. Exchange code for Google access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('error', tokenData.error_description || 'token_exchange_failed');
      return NextResponse.redirect(loginUrl.toString());
    }

    // 2. Fetch verified Google user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    if (!userRes.ok || !userData.email) {
      console.error('Failed to fetch Google user profile:', userData);
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('error', 'failed_fetching_profile');
      return NextResponse.redirect(loginUrl.toString());
    }

    const email = userData.email.toLowerCase().trim();
    const name = userData.name || userData.given_name || email.split('@')[0];

    // 3. Find or auto-provision scholar user in database
    let existingUser = (await db
      .prepare('SELECT id, name, email, phone, role, field_of_interest FROM users WHERE LOWER(email) = ?')
      .get(email)) as {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      role: 'admin' | 'user';
      field_of_interest?: string;
    } | undefined;

    if (!existingUser) {
      const baseHandle = generateHandleFromEmail(email);
      let uniqueId = baseHandle;
      let counter = 1;

      while (await db.prepare('SELECT id FROM users WHERE id = ?').get(uniqueId)) {
        uniqueId = `${baseHandle}_${counter++}`;
      }

      const now = Date.now();
      await db.prepare(`
        INSERT INTO users (id, name, email, phone, password_hash, role, field_of_interest, created_at)
        VALUES (?, ?, ?, NULL, '', 'user', 'General', ?)
      `).run(uniqueId, name, email, now);

      existingUser = {
        id: uniqueId,
        name,
        email,
        phone: undefined,
        role: 'user',
        field_of_interest: 'General',
      };
    }

    // 4. Issue authenticated session JWT
    const sessionUser: UserSession = {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      phone: existingUser.phone,
      role: existingUser.role,
      field_of_interest: existingUser.field_of_interest || 'General',
    };

    const token = signToken(sessionUser);

    const destination = redirectDestination && redirectDestination !== '/'
      ? redirectDestination
      : (sessionUser.role === 'admin' ? '/admin' : '/');

    const response = NextResponse.redirect(new URL(destination, origin));
    setAuthCookies(response, token);
    return response;
  } catch (err: any) {
    console.error('Google OAuth callback error:', err?.message || err);
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'server_error_oauth');
    return NextResponse.redirect(loginUrl.toString());
  }
}
