import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { clientId, clientSecret } = await request.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Both Google Client ID and Google Client Secret are required.' },
        { status: 400 }
      );
    }

    const cleanClientId = String(clientId).trim();
    const cleanSecret = String(clientSecret).trim();

    // 1. Update runtime environment in process immediately
    process.env.GOOGLE_CLIENT_ID = cleanClientId;
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = cleanClientId;
    process.env.GOOGLE_CLIENT_SECRET = cleanSecret;

    // 2. Persist to .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Remove old google credentials if present
    const filteredLines = envContent
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim();
        return (
          !trimmed.startsWith('GOOGLE_CLIENT_ID=') &&
          !trimmed.startsWith('GOOGLE_CLIENT_SECRET=') &&
          !trimmed.startsWith('NEXT_PUBLIC_GOOGLE_CLIENT_ID=')
        );
      });

    filteredLines.push(
      '',
      '# Google OAuth Credentials',
      `GOOGLE_CLIENT_ID=${cleanClientId}`,
      `NEXT_PUBLIC_GOOGLE_CLIENT_ID=${cleanClientId}`,
      `GOOGLE_CLIENT_SECRET=${cleanSecret}`
    );

    fs.writeFileSync(envPath, filteredLines.join('\n').trim() + '\n', 'utf8');

    return NextResponse.json({
      success: true,
      message: 'Google credentials configured successfully!',
    });
  } catch (error: any) {
    console.error('Failed to configure Google credentials:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update Google credentials.' },
      { status: 500 }
    );
  }
}
