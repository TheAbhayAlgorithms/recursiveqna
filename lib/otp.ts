import crypto from 'crypto';
import db from './db';

const OTP_SECRET = process.env.JWT_SECRET || 'recursiveqna-otp-salt-secret-2026';
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const EMAIL_HOURLY_LIMIT = 5;
const IP_HOURLY_LIMIT = 20;
const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function normalizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 254) return false;
  // RFC 5322 standard compliant email regex
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(normalized);
}

export function hashOtp(email: string, otp: string): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${email.trim().toLowerCase()}:${otp}`)
    .digest('hex');
}

export function generateOtp(): string {
  // Generates cryptographically secure 6-digit number between 100000 and 999999
  return crypto.randomInt(100000, 1000000).toString();
}

export interface RateLimitCheckResult {
  allowed: boolean;
  error?: string;
  cooldownRemaining?: number;
}

export async function checkAndRecordOtpRateLimits(email: string, ip: string): Promise<RateLimitCheckResult> {
  const normalizedEmail = normalizeEmail(email);
  const now = Date.now();

  const emailKey = `email:${normalizedEmail}`;
  const ipKey = `ip:${ip || 'unknown'}`;

  // 1. Check IP rate limit (20 requests per hour)
  const ipRecord = (await db.prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?').get(ipKey)) as {
    count: number;
    reset_at: number;
  } | undefined;

  if (ipRecord) {
    if (now < ipRecord.reset_at) {
      if (ipRecord.count >= IP_HOURLY_LIMIT) {
        return {
          allowed: false,
          error: 'Too many requests from this network. Please try again later.',
        };
      }
    }
  }

  // 2. Check Email rate limit and cooldown (30s cooldown, max 5 requests per hour)
  const emailRecord = (await db.prepare('SELECT count, reset_at, last_requested_at FROM rate_limits WHERE key = ?').get(emailKey)) as {
    count: number;
    reset_at: number;
    last_requested_at: number;
  } | undefined;

  if (emailRecord) {
    // 30 second resend cooldown
    const elapsedSinceLast = now - emailRecord.last_requested_at;
    if (elapsedSinceLast < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsedSinceLast) / 1000);
      return {
        allowed: false,
        error: `Please wait ${waitSeconds}s before requesting a new code.`,
        cooldownRemaining: waitSeconds,
      };
    }

    // 5 per hour limit
    if (now < emailRecord.reset_at) {
      if (emailRecord.count >= EMAIL_HOURLY_LIMIT) {
        const minutesLeft = Math.ceil((emailRecord.reset_at - now) / 60000);
        return {
          allowed: false,
          error: `Too many code requests for this email. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        };
      }
    }
  }

  // Record/Update IP rate limit
  if (!ipRecord || now >= ipRecord.reset_at) {
    await db.prepare(`
      INSERT INTO rate_limits (key, count, reset_at, last_requested_at)
      VALUES (?, 1, ?, ?)
      ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at, last_requested_at = excluded.last_requested_at
    `).run(ipKey, now + ONE_HOUR_MS, now);
  } else {
    await db.prepare('UPDATE rate_limits SET count = count + 1, last_requested_at = ? WHERE key = ?').run(now, ipKey);
  }

  // Record/Update Email rate limit
  if (!emailRecord || now >= emailRecord.reset_at) {
    await db.prepare(`
      INSERT INTO rate_limits (key, count, reset_at, last_requested_at)
      VALUES (?, 1, ?, ?)
      ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at, last_requested_at = excluded.last_requested_at
    `).run(emailKey, now + ONE_HOUR_MS, now);
  } else {
    await db.prepare('UPDATE rate_limits SET count = count + 1, last_requested_at = ? WHERE key = ?').run(now, emailKey);
  }

  return { allowed: true };
}

export async function createAndStoreOtp(email: string): Promise<string> {
  const normalizedEmail = normalizeEmail(email);
  const otp = generateOtp();
  const otpHash = hashOtp(normalizedEmail, otp);
  const now = Date.now();
  const expiresAt = now + OTP_EXPIRY_MS;
  const id = 'otp_' + crypto.randomUUID();

  // Invalidate any previous OTPs for this email to enforce single active OTP
  await db.prepare('DELETE FROM otps WHERE email = ?').run(normalizedEmail);

  // Store new hashed OTP
  await db.prepare(`
    INSERT INTO otps (id, email, otp_hash, expires_at, attempts, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(id, normalizedEmail, otpHash, expiresAt, now);

  return otp;
}

export type VerifyOtpStatus = 'SUCCESS' | 'INVALID_CODE' | 'EXPIRED' | 'TOO_MANY_ATTEMPTS' | 'NOT_FOUND';

export interface VerifyOtpResult {
  status: VerifyOtpStatus;
  message: string;
  attemptsRemaining?: number;
}

export async function verifyAndConsumeOtp(email: string, code: string): Promise<VerifyOtpResult> {
  const normalizedEmail = normalizeEmail(email);
  const cleanCode = (code || '').trim();
  const now = Date.now();

  const record = (await db.prepare('SELECT id, otp_hash, expires_at, attempts FROM otps WHERE email = ?').get(normalizedEmail)) as {
    id: string;
    otp_hash: string;
    expires_at: number | string;
    attempts: number;
  } | undefined;

  // Clean up any stale expired records for other emails
  try {
    await db.prepare('DELETE FROM otps WHERE expires_at < ? AND email != ?').run(now, normalizedEmail);
  } catch {}

  if (!record) {
    return {
      status: 'NOT_FOUND',
      message: 'No active code found. Please request a new verification code.',
    };
  }

  // Check expiration
  if (now > Number(record.expires_at)) {
    await db.prepare('DELETE FROM otps WHERE id = ?').run(record.id);
    return {
      status: 'EXPIRED',
      message: 'Verification code has expired. Please request a new one.',
    };
  }

  // Check max attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    await db.prepare('DELETE FROM otps WHERE id = ?').run(record.id);
    return {
      status: 'TOO_MANY_ATTEMPTS',
      message: 'Too many incorrect attempts. This code has been invalidated. Please request a new one.',
    };
  }

  // Hash user-provided code and compare
  const candidateHash = hashOtp(normalizedEmail, cleanCode);
  const isMatch = crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(record.otp_hash));

  if (!isMatch) {
    const newAttempts = record.attempts + 1;
    if (newAttempts >= MAX_ATTEMPTS) {
      await db.prepare('DELETE FROM otps WHERE id = ?').run(record.id);
      return {
        status: 'TOO_MANY_ATTEMPTS',
        message: 'Too many incorrect attempts. This code has been invalidated. Please request a new one.',
      };
    } else {
      await db.prepare('UPDATE otps SET attempts = ? WHERE id = ?').run(newAttempts, record.id);
      const remaining = MAX_ATTEMPTS - newAttempts;
      return {
        status: 'INVALID_CODE',
        message: `Incorrect verification code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`,
        attemptsRemaining: remaining,
      };
    }
  }

  // Success: Single-use, delete immediately
  await db.prepare('DELETE FROM otps WHERE id = ?').run(record.id);

  return {
    status: 'SUCCESS',
    message: 'Verification successful.',
  };
}
