import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser, signToken, setAuthCookies } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to update your profile.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawPhone = body.phone;
    const cleanPhone = typeof rawPhone === 'string' ? rawPhone.trim() : null;

    await db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(cleanPhone || null, user.id);

    const updatedUser = {
      ...user,
      phone: cleanPhone || undefined,
    };

    const token = signToken(updatedUser);
    const response = NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Mobile number updated successfully.',
    });

    setAuthCookies(response, token);
    return response;
  } catch (err: any) {
    console.error('update-phone error:', err?.message || err);
    return NextResponse.json(
      { error: 'Failed to update phone number. Please try again.' },
      { status: 500 }
    );
  }
}
