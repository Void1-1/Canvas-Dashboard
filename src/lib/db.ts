import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { encryptCanvasToken, isEncryptedCanvasToken } from './encryption';

const dbPath = process.env.SQLITE_DB_PATH ?? path.join(process.cwd(), 'data', 'canvas-dashboard.db');

let db: Database.Database | null = null;

function ensureDataDir() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getDb(): Database.Database {
  if (!db) {
    ensureDataDir();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('secure_delete = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      canvas_api_base TEXT NOT NULL,
      canvas_api_token TEXT NOT NULL,
      password_changed_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

    CREATE TABLE IF NOT EXISTS user_password_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON user_password_history(user_id);

    CREATE TRIGGER IF NOT EXISTS limit_password_history
    AFTER INSERT ON user_password_history
    BEGIN
      DELETE FROM user_password_history
      WHERE user_id = NEW.user_id
        AND id NOT IN (
          SELECT id FROM user_password_history
          WHERE user_id = NEW.user_id
          ORDER BY created_at DESC, id DESC
          LIMIT 24
        );
    END;

    CREATE TABLE IF NOT EXISTS user_login_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      ip TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON user_login_history(user_id);

    CREATE TABLE IF NOT EXISTS revoked_sessions (
      jti TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_revoked_sessions_expires_at ON revoked_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS user_sessions (
      jti TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
  `);

  // Ensure password_changed_at column exists and is backfilled for existing users
  const userColumns = database.prepare('PRAGMA table_info(users)').all() as { name: string }[];
  const hasPasswordChangedAtColumn = userColumns.some((column) => column.name === 'password_changed_at');
  if (!hasPasswordChangedAtColumn) {
    database.exec(`
      ALTER TABLE users ADD COLUMN password_changed_at INTEGER;
      UPDATE users SET password_changed_at = created_at WHERE password_changed_at IS NULL;
    `);
  }

  // OAuth columns migration
  const hasOauthStatus = userColumns.some((column) => column.name === 'oauth_status');
  if (!hasOauthStatus) {
    database.exec(`ALTER TABLE users ADD COLUMN oauth_status TEXT NOT NULL DEFAULT 'manual';`);
  }

  const hasRefreshToken = userColumns.some((column) => column.name === 'canvas_refresh_token');
  if (!hasRefreshToken) {
    database.exec(`ALTER TABLE users ADD COLUMN canvas_refresh_token TEXT;`);
  }

  const hasTokenExpiresAt = userColumns.some((column) => column.name === 'canvas_token_expires_at');
  if (!hasTokenExpiresAt) {
    database.exec(`ALTER TABLE users ADD COLUMN canvas_token_expires_at INTEGER;`);
  }

  // canvas_token_set_at: tracks when the manual Canvas API token was last stored.
  // Used to warn users before their token expires (~120 days for Canvas dev tokens).
  // Backfilled from created_at for existing manual users.
  const hasTokenSetAt = userColumns.some((column) => column.name === 'canvas_token_set_at');
  if (!hasTokenSetAt) {
    database.exec(`
      ALTER TABLE users ADD COLUMN canvas_token_set_at INTEGER;
      UPDATE users SET canvas_token_set_at = created_at WHERE oauth_status = 'manual' OR oauth_status IS NULL;
    `);
  }

  // display_name: optional user-facing name shown in the UI instead of username.
  const hasDisplayName = userColumns.some((column) => column.name === 'display_name');
  if (!hasDisplayName) {
    database.exec(`ALTER TABLE users ADD COLUMN display_name TEXT;`);
  }

  // Backfill legacy plaintext Canvas tokens to encrypted form, if an encryption key is configured.
  const hasEncryptionKey = !!process.env.CANVAS_ENCRYPTION_KEY;
  if (hasEncryptionKey) {
    const users = database
      .prepare('SELECT id, canvas_api_token FROM users')
      .all() as { id: string; canvas_api_token: string }[];
    const updateStmt = database.prepare(
      'UPDATE users SET canvas_api_token = ? WHERE id = ?'
    );

    for (const user of users) {
      if (!user.canvas_api_token || isEncryptedCanvasToken(user.canvas_api_token)) {
        continue;
      }
      const encrypted = encryptCanvasToken(user.canvas_api_token);
      updateStmt.run(encrypted, user.id);
    }
  }
}
