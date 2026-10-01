import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json({ error: 'User ID and password are required' }, { status: 400 });
    }

    const cleanUserId = userId.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(id) = ?').get(cleanUserId) as {
      id: string;
      name: string;
      password_hash: string;
      role: 'admin' | 'user';
      field_of_interest: string;
    } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Invalid User ID or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid User ID or password' }, { status: 401 });
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      role: user.role,
      field_of_interest: user.field_of_interest,
    };

    const token = signToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    response.cookies.set('edu_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
