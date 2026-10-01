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

    const qRow = (await db.prepare('SELECT COUNT(*) as count FROM questions').get()) as any;
    const sRow = (await db.prepare('SELECT COUNT(*) as count FROM solutions').get()) as any;
    const tRow = (await db.prepare('SELECT COUNT(*) as count FROM thoughts').get()) as any;
    const uRow = (await db.prepare('SELECT COUNT(*) as count FROM users').get()) as any;

    const totalQuestions = Number(qRow?.count || 0);
    const totalSolutions = Number(sRow?.count || 0);
    const totalThoughts = Number(tRow?.count || 0);
    const totalUsers = Number(uRow?.count || 0);

    const fieldBreakdown = await db.prepare(`
      SELECT field, COUNT(*) as count 
      FROM questions 
      GROUP BY field 
      ORDER BY count DESC
    `).all();

    const recentQuestions = await db.prepare(`
      SELECT id, title, user_name, field, created_at,
        (SELECT COUNT(*) FROM solutions WHERE question_id = questions.id) as solutions_count
      FROM questions
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    const recentSolutions = await db.prepare(`
      SELECT s.id, s.question_id, s.user_name, s.content, s.created_at, q.title as question_title
      FROM solutions s
      LEFT JOIN questions q ON s.question_id = q.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `).all();

    const recentThoughts = await db.prepare(`
      SELECT t.id, t.question_id, t.user_name, t.content, t.created_at, q.title as question_title
      FROM thoughts t
      LEFT JOIN questions q ON t.question_id = q.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `).all();

    return NextResponse.json({
      stats: {
        totalQuestions,
        totalSolutions,
        totalThoughts,
        totalUsers,
      },
      fieldBreakdown,
      recentQuestions,
      recentSolutions,
      recentThoughts,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
