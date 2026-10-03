import { NextResponse } from 'next/server';
import { normalizeEmail, isValidEmail, checkAndRecordOtpRateLimits, createAndStoreOtp } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = body.email;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // Check rate limits & 30s resend cooldown
    const rateCheck = await checkAndRecordOtpRateLimits(email, clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.error, cooldownRemaining: rateCheck.cooldownRemaining },
        { status: 429 }
      );
    }

    const otp = await createAndStoreOtp(email);
    await sendOtpEmail({ to: email, otp });

    return NextResponse.json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (err: any) {
    console.error('resend-otp error:', err?.message || err);
    return NextResponse.json(
      { error: err?.message?.includes('SMTP') ? 'Email service temporarily unavailable. Please try again in a moment.' : (err?.message || 'Failed to resend verification code. Please try again.') },
      { status: 500 }
    );
  }
}
