import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to provide a solution' }, { status: 401 });
    }

    const { questionId, content, imageUrl, videoUrl } = await request.json();

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    if (!content || content.trim().length < 5) {
      return NextResponse.json({ error: 'Please provide a clear and detailed explanation in your solution' }, { status: 400 });
    }

    // Verify question exists
    const question = await db.prepare('SELECT id FROM questions WHERE id = ?').get(questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const solutionId = 'sol_' + crypto.randomUUID();
    const now = Date.now();

    await db.prepare(`
      INSERT INTO solutions (id, question_id, user_id, user_name, content, image_url, video_url, is_verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      solutionId,
      questionId,
      user.id,
      user.name,
      content.trim(),
      imageUrl || null,
      videoUrl || null,
      user.role === 'admin' ? 1 : 0, // Auto-verify if admin posts solution
      now
    );

    const created = await db.prepare('SELECT * FROM solutions WHERE id = ?').get(solutionId);

    return NextResponse.json({
      success: true,
      solution: created,
    });
  } catch (err) {
    console.error('Create solution error:', err);
    return NextResponse.json({ error: 'Failed to post solution' }, { status: 500 });
  }
}
