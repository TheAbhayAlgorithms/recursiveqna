import postgres from 'postgres';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres.huadrmmnlvzdmtqkyldc:recursiveqna%40123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require';

async function migratePostgres() {
  console.log('--- Migrating PostgreSQL ---');
  const sql = postgres(databaseUrl);
  try {
    // 1. Add email column to users
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email'
        ) THEN 
          ALTER TABLE public.users ADD COLUMN email TEXT;
        END IF; 
      END $$;
    `;
    console.log('✓ users.email column ensured');

    // 2. Add phone column to users
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone'
        ) THEN 
          ALTER TABLE public.users ADD COLUMN phone TEXT;
        END IF; 
      END $$;
    `;
    console.log('✓ users.phone column ensured');

    // 3. Allow password_hash to be nullable for passwordless/OTP users
    await sql`
      ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;
    `.catch(e => console.log('Notice on password_hash drop not null:', e.message));

    // 4. Create unique index on users.email
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users (email) WHERE email IS NOT NULL;
    `;
    console.log('✓ unique index idx_users_email ensured');

    // 5. Create otps table
    await sql`
      CREATE TABLE IF NOT EXISTS public.otps (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        expires_at BIGINT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_otps_email ON public.otps (email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_otps_expires ON public.otps (expires_at);`;
    console.log('✓ otps table and indexes ensured');

    // 6. Create rate_limits table
    await sql`
      CREATE TABLE IF NOT EXISTS public.rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 1,
        reset_at BIGINT NOT NULL,
        last_requested_at BIGINT NOT NULL
      );
    `;
    console.log('✓ rate_limits table ensured');

    // Populate abhayraj and admin emails if unset for test convenience
    await sql`UPDATE public.users SET email = 'abhayraj@recursiveqna.org' WHERE id = 'abhayraj' AND email IS NULL;`;
    await sql`UPDATE public.users SET email = 'admin@recursiveqna.org' WHERE id = 'admin' AND email IS NULL;`;

    console.log('✓ PostgreSQL migration successful!');
  } catch (err) {
    console.error('PostgreSQL migration error:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

function migrateSqlite() {
  console.log('--- Migrating SQLite ---');
  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, 'recursiveqna.db');
  const sqlite = new Database(dbPath);

  try {
    // Add columns if missing
    const tableInfo = sqlite.prepare("PRAGMA table_info('users')").all();
    const columnNames = tableInfo.map(c => c.name);

    if (!columnNames.includes('email')) {
      sqlite.exec("ALTER TABLE users ADD COLUMN email TEXT;");
      console.log('✓ SQLite users.email added');
    }
    if (!columnNames.includes('phone')) {
      sqlite.exec("ALTER TABLE users ADD COLUMN phone TEXT;");
      console.log('✓ SQLite users.phone added');
    }

    sqlite.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

      CREATE TABLE IF NOT EXISTS otps (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
      CREATE INDEX IF NOT EXISTS idx_otps_expires ON otps(expires_at);

      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 1,
        reset_at INTEGER NOT NULL,
        last_requested_at INTEGER NOT NULL
      );
    `);
    console.log('✓ SQLite tables and indexes ensured');
  } catch (err) {
    console.error('SQLite migration error:', err);
  } finally {
    sqlite.close();
  }
}

async function run() {
  await migratePostgres();
  migrateSqlite();
}

run();
