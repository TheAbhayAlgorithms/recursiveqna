import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { signToken, setAuthCookies, UserSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

function generateHandleFromEmail(email: string): string {
  const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const base = prefix.slice(0, 15) || 'scholar';
  return base;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { 
      supabaseAccessToken, 
      credential, 
      email: providedEmail, 
      name: providedName,
      isDevFallback 
    } = body;

    let verifiedEmail: string | null = null;
    let verifiedName: string | null = null;

    // 1. Verify via Supabase Access Token if provided
    if (supabaseAccessToken) {
      const supabase = getSupabase();
      if (supabase) {
        const { data: { user }, error } = await supabase.auth.getUser(supabaseAccessToken);
        if (!error && user && user.email) {
          verifiedEmail = user.email.toLowerCase().trim();
          verifiedName = (
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email.split('@')[0]
          );
        }
      }
    }

    // 2. Verify via Google Identity Services (GIS) ID Token if provided
    if (!verifiedEmail && credential && typeof credential === 'string') {
      try {
        const decoded = jwt.decode(credential) as any;
        if (decoded && decoded.email && (decoded.email_verified || decoded.iss?.includes('accounts.google.com'))) {
          verifiedEmail = String(decoded.email).toLowerCase().trim();
          verifiedName = decoded.name || decoded.given_name || verifiedEmail.split('@')[0];
        }
      } catch (e) {
        console.warn('Failed to decode Google credential token:', e);
      }
    }

    // 3. Dev Fallback or Direct Email if in development mode
    if (!verifiedEmail && providedEmail && typeof providedEmail === 'string') {
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDevFallback || isDev) {
        const cleanEmail = providedEmail.toLowerCase().trim();
        if (cleanEmail.includes('@')) {
          verifiedEmail = cleanEmail;
          verifiedName = providedName || cleanEmail.split('@')[0];
        }
      }
    }

    if (!verifiedEmail) {
      return NextResponse.json(
        { error: 'Google authentication could not be verified. Please try again.' },
        { status: 400 }
      );
    }

    // Check if user already exists in database
    let existingUser = (await db
      .prepare('SELECT id, name, email, phone, role, field_of_interest FROM users WHERE LOWER(email) = ?')
      .get(verifiedEmail)) as {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      role: 'admin' | 'user';
      field_of_interest?: string;
    } | undefined;

    let isFirstLogin = false;

    if (!existingUser) {
      isFirstLogin = true;
      const baseHandle = generateHandleFromEmail(verifiedEmail);
      let uniqueId = baseHandle;
      let counter = 1;

      // Ensure unique ID handle
      while (await db.prepare('SELECT id FROM users WHERE id = ?').get(uniqueId)) {
        uniqueId = `${baseHandle}_${counter++}`;
      }

      const displayName = verifiedName || verifiedEmail
        .split('@')[0]
        .split(/[._-]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || 'Scholar';

      const now = Date.now();

      await db.prepare(`
        INSERT INTO users (id, name, email, phone, password_hash, role, field_of_interest, created_at)
        VALUES (?, ?, ?, NULL, '', 'user', 'General', ?)
      `).run(uniqueId, displayName, verifiedEmail, now);

      existingUser = {
        id: uniqueId,
        name: displayName,
        email: verifiedEmail,
        phone: undefined,
        role: 'user',
        field_of_interest: 'General',
      };
    } else if (verifiedName && existingUser.name === 'Scholar') {
      // Update default placeholder name if we received a real name from Google
      try {
        await db.prepare('UPDATE users SET name = ? WHERE id = ?').run(verifiedName, existingUser.id);
        existingUser.name = verifiedName;
      } catch {}
    }

    const sessionUser: UserSession = {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      phone: existingUser.phone,
      role: existingUser.role,
      field_of_interest: existingUser.field_of_interest || 'General',
    };

    const token = signToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      isFirstLogin,
      message: 'Google authentication successful.',
    });

    setAuthCookies(response, token);
    return response;
  } catch (err: any) {
    console.error('Google auth error:', err?.message || err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during Google authentication.' },
      { status: 500 }
    );
  }
}
