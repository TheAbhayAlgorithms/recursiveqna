import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'recursiveqna-academic-secret-key-2026-secure';

export interface UserSession {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'user';
  field_of_interest?: string;
}

export function signToken(user: UserSession): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      field_of_interest: user.field_of_interest,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): UserSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    return decoded;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('rqna_token')?.value || cookieStore.get('edu_token')?.value;
  if (!token) return null;

  const session = verifyToken(token);
  if (!session) return null;

  // Verify user still exists in database and fetch freshest details
  const user = (await db.prepare('SELECT id, name, email, phone, role, field_of_interest FROM users WHERE id = ?').get(session.id)) as {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: 'admin' | 'user';
    field_of_interest: string;
  } | undefined;

  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    field_of_interest: user.field_of_interest,
  };
}

export async function requireAuth(): Promise<{ user?: UserSession; errorResponse?: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Authentication required. Please log in to perform this action.' },
        { status: 401 }
      ),
    };
  }
  return { user };
}

export function setAuthCookies(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  };

  response.cookies.set('rqna_token', token, cookieOptions);
  response.cookies.set('edu_token', token, cookieOptions);
}

export function clearAuthCookies(response: NextResponse): void {
  const clearOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };

  response.cookies.set('rqna_token', '', clearOptions);
  response.cookies.set('edu_token', '', clearOptions);
}

export function getPublicOrigin(request: Request): string {
  // 1. Explicit app URL if set in env
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || process.env.SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  // 2. Vercel deployment URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Proxy headers (X-Forwarded-Host / X-Forwarded-Proto)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // 4. Fallback to request URL origin
  try {
    return new URL(request.url).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

