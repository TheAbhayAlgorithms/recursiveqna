import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { normalizeEmail, isValidEmail, verifyAndConsumeOtp } from '@/lib/otp';
import { signToken, setAuthCookies, UserSession } from '@/lib/auth';

function generateHandleFromEmail(email: string): string {
  const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const base = prefix.slice(0, 15) || 'user';
  return base;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = body.email;
    const rawCode = body.code;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    if (!rawCode || typeof rawCode !== 'string') {
      return NextResponse.json({ error: '6-digit verification code is required.' }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const cleanCode = rawCode.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json({ error: 'Verification code must be exactly 6 digits.' }, { status: 400 });
    }

    // Verify and consume OTP from database
    const verifyResult = await verifyAndConsumeOtp(email, cleanCode);
    if (verifyResult.status !== 'SUCCESS') {
      const statusCode = verifyResult.status === 'TOO_MANY_ATTEMPTS' ? 429 : 400;
      return NextResponse.json(
        {
          error: verifyResult.message,
          status: verifyResult.status,
          attemptsRemaining: verifyResult.attemptsRemaining,
        },
        { status: statusCode }
      );
    }

    // OTP is valid! Match existing user by email or auto-provision a new user account
    let existingUser = (await db
      .prepare('SELECT id, name, email, phone, role, field_of_interest FROM users WHERE LOWER(email) = ?')
      .get(email)) as {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      role: 'admin' | 'user';
      field_of_interest?: string;
    } | undefined;

    let isFirstLogin = false;

    if (!existingUser) {
      isFirstLogin = true;
      const baseHandle = generateHandleFromEmail(email);
      let uniqueId = baseHandle;
      let counter = 1;

      // Ensure unique ID handle
      while (await db.prepare('SELECT id FROM users WHERE id = ?').get(uniqueId)) {
        uniqueId = `${baseHandle}_${counter++}`;
      }

      // Readable name from email prefix
      const defaultName = email
        .split('@')[0]
        .split(/[._-]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || 'Academic Scholar';

      const now = Date.now();

      await db.prepare(`
        INSERT INTO users (id, name, email, phone, password_hash, role, field_of_interest, created_at)
        VALUES (?, ?, ?, NULL, '', 'user', 'General', ?)
      `).run(uniqueId, defaultName, email, now);

      existingUser = {
        id: uniqueId,
        name: defaultName,
        email,
        phone: undefined,
        role: 'user',
        field_of_interest: 'General',
      };
    }

    const sessionUser: UserSession = {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      phone: existingUser.phone,
      role: existingUser.role,
      field_of_interest: existingUser.field_of_interest,
    };

    const token = signToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      isFirstLogin: isFirstLogin || !existingUser.phone,
      message: 'Authentication successful.',
    });

    setAuthCookies(response, token);
    return response;
  } catch (err: any) {
    console.error('verify-otp error:', err?.message || err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification. Please try again.' },
      { status: 500 }
    );
  }
}
