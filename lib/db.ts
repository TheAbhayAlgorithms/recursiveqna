import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'data', 'eduquest.db');

interface GlobalWithDb {
  __eduquest_db?: Database.Database;
  __eduquest_db_initialized?: boolean;
}

const globalObj = globalThis as unknown as GlobalWithDb;

function getDatabase(): Database.Database {
  if (!globalObj.__eduquest_db) {
    const db = new Database(dbPath, { timeout: 20000 });
    // Enable WAL mode for high concurrency
    try {
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      db.pragma('busy_timeout = 20000');
    } catch {
      // ignore if already configured
    }
    globalObj.__eduquest_db = db;
  }
  return globalObj.__eduquest_db;
}

const db = getDatabase();

if (!globalObj.__eduquest_db_initialized) {
  globalObj.__eduquest_db_initialized = true;
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    field_of_interest TEXT DEFAULT 'General',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    field TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS solutions (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    is_verified INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS thoughts (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    solution_id TEXT,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY(solution_id) REFERENCES solutions(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_questions_field ON questions(field, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_solutions_qid ON solutions(question_id, created_at ASC);
  CREATE INDEX IF NOT EXISTS idx_thoughts_qid ON thoughts(question_id, created_at ASC);
  CREATE INDEX IF NOT EXISTS idx_thoughts_sid ON thoughts(solution_id, created_at ASC);
`);

try {
  db.exec(`ALTER TABLE thoughts ADD COLUMN solution_id TEXT;`);
} catch {}


// Pre-seed Admin and Demo Student account if empty
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const adminPassHash = bcrypt.hashSync('admin123', 10);
  const studentPassHash = bcrypt.hashSync('student123', 10);
  const now = Date.now();

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, password_hash, role, field_of_interest, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('admin', 'Academic Administrator', adminPassHash, 'admin', 'Administration', now);
  insertUser.run('alex_student', 'Alex Rivera', studentPassHash, 'user', 'Mathematics & Computer Science', now);
  insertUser.run('sophia_phy', 'Sophia Chen', studentPassHash, 'user', 'Physics & Engineering', now);

  // Pre-seed sample realistic educational questions
  const insertQuestion = db.prepare(`
    INSERT OR IGNORE INTO questions (id, user_id, user_name, title, content, field, image_url, video_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const q1Id = 'q_euler_identity';
  insertQuestion.run(
    q1Id,
    'alex_student',
    'Alex Rivera',
    'How do we derive Euler’s Formula e^(i*pi) + 1 = 0 from Taylor series expansion?',
    'I understand that Euler’s identity links five fundamental mathematical constants (e, i, pi, 1, and 0). However, I need a rigorous breakdown of how expanding e^(ix) via Maclaurin series separates into real and imaginary parts to produce cos(x) + i*sin(x). Could someone explain each step clearly?',
    'Mathematics',
    null,
    null,
    now - 3600000 * 5
  );

  const q2Id = 'q_dijkstra_astar';
  insertQuestion.run(
    q2Id,
    'sophia_phy',
    'Sophia Chen',
    'When does A* search algorithm degrade to Dijkstra, and why must the heuristic be admissible?',
    'We are analyzing pathfinding algorithms in our graph theory seminar. Could someone explain the theoretical constraint of admissibility (h(n) <= true cost) and consistency? What happens if h(n) = 0 for all nodes?',
    'Computer Science',
    null,
    null,
    now - 3600000 * 2
  );

  // Pre-seed sample solution
  const insertSolution = db.prepare(`
    INSERT OR IGNORE INTO solutions (id, question_id, user_id, user_name, content, image_url, video_url, is_verified, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSolution.run(
    'sol_1',
    q1Id,
    'admin',
    'Academic Administrator',
    'Here is the complete algebraic proof via Taylor series:\n\n1. The Taylor expansion of e^z around 0 is:\ne^z = 1 + z + z^2/2! + z^3/3! + z^4/4! + ...\n\n2. Substitute z = ix (where i^2 = -1, i^3 = -i, i^4 = 1):\ne^(ix) = 1 + ix - x^2/2! - ix^3/3! + x^4/4! + ix^5/5! - ...\n\n3. Regroup into real and imaginary terms:\nReal part: (1 - x^2/2! + x^4/4! - ...) = cos(x)\nImaginary part: i * (x - x^3/3! + x^5/5! - ...) = i * sin(x)\n\n4. Therefore: e^(ix) = cos(x) + i*sin(x).\nWhen x = π: e^(iπ) = cos(π) + i*sin(π) = -1 + 0 = -1.\nRearranging yields: e^(iπ) + 1 = 0. Q.E.D.',
    null,
    null,
    1,
    now - 3600000 * 3
  );

  // Pre-seed sample thought
  const insertThought = db.prepare(`
    INSERT OR IGNORE INTO thoughts (id, question_id, user_id, user_name, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertThought.run(
    'th_1',
    q1Id,
    'sophia_phy',
    'Sophia Chen',
    'Richard Feynman famously called this "the most remarkable formula in mathematics". The geometric visualization on the complex unit circle makes it so intuitive!',
    now - 3600000 * 2
  );
  }
}

export default db;
