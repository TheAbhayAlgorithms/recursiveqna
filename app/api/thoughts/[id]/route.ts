import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// DELETE: Strict admin-only thought deletion!
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Only the platform administrator can delete thoughts.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    db.prepare('DELETE FROM thoughts WHERE id = ?').run(id);

    return NextResponse.json({
      success: true,
      message: 'Thought deleted successfully by administrator.',
    });
  } catch (err) {
    console.error('Delete thought error:', err);
    return NextResponse.json({ error: 'Failed to delete thought' }, { status: 500 });
  }
}
