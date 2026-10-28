import Database from "better-sqlite3"
import fs from "node:fs"
import path from "node:path"

let dbInstance: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (dbInstance) return dbInstance

  const dataDir = path.resolve(process.cwd(), "data")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = path.join(dataDir, "billbari.db")
  const db = new Database(dbPath)

  // Enable WAL mode for high concurrency
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT NOT NULL,
      google_id TEXT UNIQUE,
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_meters (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      meter_number TEXT NOT NULL,
      customer_number TEXT,
      customer_name TEXT,
      address TEXT,
      tariff TEXT,
      sanctioned_load TEXT,
      alias TEXT,
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, meter_number)
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      meter_number TEXT NOT NULL,
      snapshot_date TEXT NOT NULL,
      balance REAL,
      reading_kwh REAL,
      daily_estimated_cost REAL,
      monthly_estimated_cost REAL,
      source_type TEXT NOT NULL, -- 'nesco_live' | 'manual_reading' | 'sample_demo'
      notes TEXT,
      raw_data_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cached_meter_data (
      meter_number TEXT PRIMARY KEY,
      customer_number TEXT,
      cached_at TEXT NOT NULL,
      data_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_saved_meters_user ON saved_meters(user_id);
    CREATE INDEX IF NOT EXISTS idx_snapshots_user_meter ON snapshots(user_id, meter_number);
    CREATE INDEX IF NOT EXISTS idx_snapshots_date ON snapshots(snapshot_date);
  `)

  dbInstance = db
  return db
}
