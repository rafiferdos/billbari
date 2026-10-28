import { createClient, type Client } from "@libsql/client"
import fs from "node:fs"
import path from "node:path"

let dbInstance: Client | null = null
let initPromise: Promise<void> | null = null

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  google_id TEXT UNIQUE,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_expires_at TEXT,
  subscription_started_at TEXT,
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
  source_type TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'bkash',
  plan_type TEXT NOT NULL,
  amount_bdt REAL NOT NULL,
  sender_number TEXT,
  trx_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_meters_user ON saved_meters(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_meter ON snapshots(user_id, meter_number);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_trx_id ON payments(trx_id);
`

export async function getDatabase(): Promise<Client> {
  if (!dbInstance) {
    const tursoUrl = process.env.TURSO_DATABASE_URL
    const tursoToken = process.env.TURSO_AUTH_TOKEN

    if (tursoUrl) {
      dbInstance = createClient({
        url: tursoUrl,
        authToken: tursoToken,
      })
    } else {
      const dataDir = path.resolve(process.cwd(), "data")
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      const dbPath = path.join(dataDir, "billbari.db")
      dbInstance = createClient({
        url: `file:${dbPath}`,
      })
    }
  }

  if (!initPromise) {
    initPromise = (async () => {
      try {
        await dbInstance!.executeMultiple(SCHEMA_SQL)
      } catch (err) {
        console.warn("Base schema executeMultiple warning:", err)
      }

      // Safe column migrations for existing databases
      try {
        await dbInstance!.execute("ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free'")
      } catch {}
      try {
        await dbInstance!.execute("ALTER TABLE users ADD COLUMN subscription_expires_at TEXT")
      } catch {}
      try {
        await dbInstance!.execute("ALTER TABLE users ADD COLUMN subscription_started_at TEXT")
      } catch {}
    })().catch((err) => {
      console.error("Database schema initialization error:", err)
      initPromise = null
    })
  }

  await initPromise
  return dbInstance
}
