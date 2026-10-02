import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Both current password and new password are required.' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return NextResponse.json(
        { error: 'New password must be at least 4 characters long.' },
        { status: 400 }
      );
    }

    const user = (await db.prepare('SELECT * FROM users WHERE id = ?').get(currentUser.id)) as {
      id: string;
      password_hash: string;
    } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Current password is incorrect.' },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword.trim(), 10);
    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, currentUser.id);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update password.' },
      { status: 500 }
    );
  }
}
