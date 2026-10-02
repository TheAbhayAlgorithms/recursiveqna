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

    // Extract client IP for rate limiting
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // Enforce rate limits (30s cooldown, max 5/hr per email, max 20/hr per IP)
    const rateCheck = await checkAndRecordOtpRateLimits(email, clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.error, cooldownRemaining: rateCheck.cooldownRemaining },
        { status: 429 }
      );
    }

    // Generate secure 6-digit OTP and store hashed version in database
    const otp = await createAndStoreOtp(email);

    // Send email via SMTP or mock development provider
    await sendOtpEmail({ to: email, otp });

    // Generic safe response
    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email. Valid for 5 minutes.',
    });
  } catch (err: any) {
    console.error('send-otp error:', err?.message || err);
    return NextResponse.json(
      { error: 'Failed to process verification code. Please try again.' },
      { status: 500 }
    );
  }
}
