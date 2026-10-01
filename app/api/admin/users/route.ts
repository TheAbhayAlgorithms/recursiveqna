import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const users = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.role,
        u.field_of_interest,
        u.created_at,
        (SELECT COUNT(*) FROM questions WHERE user_id = u.id) as questions_count,
        (SELECT COUNT(*) FROM solutions WHERE user_id = u.id) as solutions_count
      FROM users u
      ORDER BY u.created_at DESC
    `).all();

    return NextResponse.json({ users });
  } catch (err) {
    console.error('Admin users error:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { targetUserId, newRole } = await request.json();

    if (!targetUserId || !['admin', 'user'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid user or role' }, { status: 400 });
    }

    // Protect main admin from self-demotion
    if (targetUserId === 'admin' && newRole !== 'admin') {
      return NextResponse.json({ error: 'Cannot demote the primary root admin account' }, { status: 400 });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, targetUserId);

    return NextResponse.json({ success: true, message: `User role updated to ${newRole}` });
  } catch (err) {
    console.error('Admin role update error:', err);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('id');

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (targetUserId === 'admin' || targetUserId === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own active admin account' }, { status: 400 });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(targetUserId);

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
