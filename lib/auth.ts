import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'recursiveqna-academic-secret-key-2026-secure';

export interface UserSession {
  id: string;
  name: string;
  role: 'admin' | 'user';
  field_of_interest?: string;
}

export function signToken(user: UserSession): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role,
      field_of_interest: user.field_of_interest,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): UserSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    return decoded;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('rqna_token')?.value || cookieStore.get('edu_token')?.value;
  if (!token) return null;

  const session = verifyToken(token);
  if (!session) return null;

  // Verify user still exists in database
  const user = (await db.prepare('SELECT id, name, role, field_of_interest FROM users WHERE id = ?').get(session.id)) as {
    id: string;
    name: string;
    role: 'admin' | 'user';
    field_of_interest: string;
  } | undefined;

  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    field_of_interest: user.field_of_interest,
  };
}
