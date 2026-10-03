import nodemailer from 'nodemailer';

export interface SendOtpEmailParams {
  to: string;
  otp: string;
}

export async function sendOtpEmail({ to, otp }: SendOtpEmailParams): Promise<{ success: boolean; messageId?: string }> {
  const provider = (process.env.EMAIL_PROVIDER || 'mock').toLowerCase();
  const isProd = process.env.NODE_ENV === 'production';

  // Strict security check: mock mode MUST NOT be enabled in production
  if (provider === 'mock') {
    if (isProd) {
      throw new Error('SECURITY VIOLATION: EMAIL_PROVIDER=mock is strictly prohibited in production environments.');
    }

    console.log('\n======================================================');
    console.log(' [MOCK EMAIL SERVICE - DEVELOPMENT ONLY]');
    console.log(` To:      ${to}`);
    console.log(` OTP:     ${otp}`);
    console.log(' Details: Valid for 5 minutes. Single-use only.');
    console.log('======================================================\n');

    return { success: true, messageId: 'mock-' + Date.now() };
  }

  // SMTP Mode
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || (user ? `"RecursiveQnA Security" <${user}>` : '"RecursiveQnA Security" <no-reply@recursiveqna.org>');

  if (!host || !user || !pass) {
    throw new Error('Incomplete SMTP configuration. Please define SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    pool: true,
    maxConnections: 5,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: isProd,
    },
  });

  const subject = `Your RecursiveQnA Verification Code: ${otp}`;
  const textContent = `Your RecursiveQnA verification code is: ${otp}\n\nThis code is valid for 5 minutes. If you didn't request this, ignore this email.\n\n— The RecursiveQnA Team`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">RecursiveQnA</h1>
      <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;">Authentication & Security</p>
    </div>
    <div style="padding: 32px 28px;">
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
        Hello,
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
        Please use the following 6-digit one-time code to authenticate your session:
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <div style="display: inline-block; background: #f1f5f9; border: 2px dashed #93c5fd; border-radius: 12px; padding: 16px 36px;">
          <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #1e40af; margin-right: -10px;">${otp}</span>
        </div>
      </div>
      <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
        Valid for <strong>5 minutes</strong>. If you didn't request this, ignore this email.
      </p>
    </div>
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
      RecursiveQnA · Open Academic Inquiry & Peer Solutions
    </div>
  </div>
</body>
</html>
`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: textContent,
    html: htmlContent,
  });

  return { success: true, messageId: info.messageId };
}
