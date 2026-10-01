import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to upload media' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const mimeType = file.type;
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Only image and video files are supported' }, { status: 400 });
    }

    // Limit video to 100MB, images to 20MB
    const maxBytes = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File size exceeds limit (${isVideo ? '100MB for videos' : '20MB for images'})` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.name) || (isImage ? '.jpg' : '.mp4');
    const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '');
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      type: isImage ? 'image' : 'video',
      originalName: file.name,
      size: file.size,
    });
  } catch (err) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}
