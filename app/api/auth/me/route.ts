import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch (err) {
    console.error('Auth check error:', err);
    return NextResponse.json({ user: null });
  }
}
