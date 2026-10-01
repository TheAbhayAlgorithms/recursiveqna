import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const solutionId = searchParams.get('solutionId');
    const questionId = searchParams.get('questionId');

    if (solutionId) {
      const thoughts = await db.prepare(`
        SELECT t.*, u.role as user_role
        FROM thoughts t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.solution_id = ?
        ORDER BY t.created_at ASC
      `).all(solutionId);
      return NextResponse.json({ thoughts });
    }

    if (questionId) {
      const thoughts = await db.prepare(`
        SELECT t.*, u.role as user_role
        FROM thoughts t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.question_id = ?
        ORDER BY t.created_at ASC
      `).all(questionId);
      return NextResponse.json({ thoughts });
    }

    return NextResponse.json({ error: 'solutionId or questionId required' }, { status: 400 });
  } catch (err) {
    console.error('Fetch thoughts error:', err);
    return NextResponse.json({ error: 'Failed to fetch thoughts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to share thoughts or opinions' }, { status: 401 });
    }

    const { questionId: rawQuestionId, solutionId, content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    let finalQuestionId = rawQuestionId;

    // If solutionId is provided, verify solution and resolve question_id
    if (solutionId) {
      const sol = (await db.prepare('SELECT question_id FROM solutions WHERE id = ?').get(solutionId)) as { question_id: string } | undefined;
      if (!sol) {
        return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
      }
      finalQuestionId = sol.question_id;
    }

    if (!finalQuestionId) {
      return NextResponse.json({ error: 'A question or solution reference is required' }, { status: 400 });
    }

    const thoughtId = 'th_' + crypto.randomUUID();
    const now = Date.now();

    await db.prepare(`
      INSERT INTO thoughts (id, question_id, solution_id, user_id, user_name, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(thoughtId, finalQuestionId, solutionId || null, user.id, user.name, content.trim(), now);

    const created = await db.prepare(`
      SELECT t.*, u.role as user_role 
      FROM thoughts t 
      LEFT JOIN users u ON t.user_id = u.id 
      WHERE t.id = ?
    `).get(thoughtId);

    return NextResponse.json({
      success: true,
      thought: created,
    });
  } catch (err) {
    console.error('Create thought error:', err);
    return NextResponse.json({ error: 'Failed to share opinion' }, { status: 500 });
  }
}
