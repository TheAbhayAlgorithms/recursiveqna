import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { userId, name, password, field_of_interest } = await request.json();

    if (!userId || !name || !password) {
      return NextResponse.json({ error: 'User ID, full name, and password are required' }, { status: 400 });
    }

    const cleanUserId = userId.trim().toLowerCase();
    if (cleanUserId.length < 3) {
      return NextResponse.json({ error: 'User ID must be at least 3 characters long' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Check if user ID already exists
    const existing = await db.prepare('SELECT id FROM users WHERE LOWER(id) = ?').get(cleanUserId);
    if (existing) {
      return NextResponse.json({ error: 'This User ID is already taken. Please choose another.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = Date.now();
    const role = cleanUserId === 'admin' ? 'admin' : 'user';

    await db.prepare(`
      INSERT INTO users (id, name, password_hash, role, field_of_interest, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(cleanUserId, name.trim(), passwordHash, role, field_of_interest || 'General', now);

    const sessionUser = {
      id: cleanUserId,
      name: name.trim(),
      role: role as 'admin' | 'user',
      field_of_interest: field_of_interest || 'General',
    };

    const token = signToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    response.cookies.set('rqna_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set('edu_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Internal server error during registration' }, { status: 500 });
  }
}
