import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// DELETE: Strict Admin-only solution deletion!
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    // STRICT PRIVILEGE CHECK: ONLY ADMIN CAN DELETE SOLUTIONS!
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Only the platform administrator has permission to delete solutions.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const solution = db.prepare('SELECT id FROM solutions WHERE id = ?').get(id);
    if (!solution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM solutions WHERE id = ?').run(id);

    return NextResponse.json({
      success: true,
      message: 'Solution deleted successfully by administrator.',
    });
  } catch (err) {
    console.error('Delete solution error:', err);
    return NextResponse.json({ error: 'Failed to delete solution' }, { status: 500 });
  }
}

// PATCH: Toggle verified solution
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { isVerified } = await request.json();

    const solution = db.prepare(`
      SELECT s.*, q.user_id as question_author_id
      FROM solutions s
      JOIN questions q ON s.question_id = q.id
      WHERE s.id = ?
    `).get(id) as { id: string; question_author_id: string; is_verified: number } | undefined;

    if (!solution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
    }

    // Only Admin or the Question Author can verify a solution
    if (user.role !== 'admin' && user.id !== solution.question_author_id) {
      return NextResponse.json(
        { error: 'Only the question author or an administrator can verify solutions.' },
        { status: 403 }
      );
    }

    const newStatus = isVerified ? 1 : 0;
    db.prepare('UPDATE solutions SET is_verified = ? WHERE id = ?').run(newStatus, id);

    return NextResponse.json({
      success: true,
      isVerified: newStatus === 1,
    });
  } catch (err) {
    console.error('Verify solution error:', err);
    return NextResponse.json({ error: 'Failed to update solution' }, { status: 500 });
  }
}
