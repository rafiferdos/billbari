import { createServerFn } from "@tanstack/react-start"
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server"
import crypto from "node:crypto"
import { getDatabase } from "../db/server-db"
import type { User, SavedMeter } from "./types"

const SESSION_COOKIE_NAME = "billbari_session"
const SESSION_DURATION_DAYS = 30

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return `${salt}:${derivedKey.toString("hex")}`
}

function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(":")
  if (!salt || !key) return false
  const derivedKey = crypto.scryptSync(password, salt, 64)
  const keyBuffer = Buffer.from(key, "hex")
  return crypto.timingSafeEqual(derivedKey, keyBuffer)
}

async function createSessionToken(userId: string): Promise<string> {
  const db = await getDatabase()
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const createdAt = new Date().toISOString()

  await db.execute({
    sql: `
      INSERT INTO sessions (token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `,
    args: [token, userId, expiresAt, createdAt],
  })

  setCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  })

  return token
}

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(async (): Promise<User | null> => {
  const token = getCookie(SESSION_COOKIE_NAME)
  if (!token) return null

  const db = await getDatabase()
  const now = new Date().toISOString()

  const res = await db.execute({
    sql: `
      SELECT u.id, u.email, u.name, u.avatar_url, u.google_id, u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > ?
    `,
    args: [token, now],
  })

  const row = res.rows[0] as unknown as
    | { id: string; email: string; name: string; avatar_url: string | null; google_id: string | null; created_at: string }
    | undefined

  if (!row) return null

  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    googleId: row.google_id ? String(row.google_id) : null,
    createdAt: String(row.created_at),
  }
})

export const registerFn = createServerFn({ method: "POST" })
  .validator((d: { name: string; email: string; password: string }) => d)
  .handler(async ({ data }): Promise<{ success: boolean; user?: User; error?: string }> => {
    const { name, email, password } = data
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return { success: false, error: "নাম, সঠিক ইমেইল এবং অন্তত ৬ অক্ষরের পাসওয়ার্ড দিন।" }
    }

    const cleanEmail = email.trim().toLowerCase()
    const db = await getDatabase()

    const existingRes = await db.execute({
      sql: `SELECT id FROM users WHERE email = ?`,
      args: [cleanEmail],
    })
    if (existingRes.rows.length > 0) {
      return { success: false, error: "এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে।" }
    }

    const userId = crypto.randomUUID()
    const passwordHash = hashPassword(password)
    const now = new Date().toISOString()

    try {
      await db.execute({
        sql: `
          INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [userId, cleanEmail, passwordHash, name.trim(), now, now],
      })

      await createSessionToken(userId)

      const user: User = {
        id: userId,
        email: cleanEmail,
        name: name.trim(),
        avatarUrl: null,
        googleId: null,
        createdAt: now,
      }

      return { success: true, user }
    } catch {
      return { success: false, error: "রেজিস্ট্রেশন সম্পন্ন করতে সমস্যা হয়েছে।" }
    }
  })

export const loginFn = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }): Promise<{ success: boolean; user?: User; error?: string }> => {
    const { email, password } = data
    if (!email?.trim() || !password) {
      return { success: false, error: "ইমেইল এবং পাসওয়ার্ড প্রদান করুন।" }
    }

    const cleanEmail = email.trim().toLowerCase()
    const db = await getDatabase()

    const res = await db.execute({
      sql: `
        SELECT id, email, password_hash, name, avatar_url, google_id, created_at
        FROM users
        WHERE email = ?
      `,
      args: [cleanEmail],
    })

    const userRow = res.rows[0] as unknown as
      | { id: string; email: string; password_hash: string | null; name: string; avatar_url: string | null; google_id: string | null; created_at: string }
      | undefined

    if (!userRow || !userRow.password_hash) {
      return { success: false, error: "ভুল ইমেইল বা পাসওয়ার্ড। পুনরায় চেষ্টা করুন।" }
    }

    const valid = verifyPassword(password, userRow.password_hash)
    if (!valid) {
      return { success: false, error: "ভুল ইমেইল বা পাসওয়ার্ড। পুনরায় চেষ্টা করুন।" }
    }

    await createSessionToken(String(userRow.id))

    const user: User = {
      id: String(userRow.id),
      email: String(userRow.email),
      name: String(userRow.name),
      avatarUrl: userRow.avatar_url ? String(userRow.avatar_url) : null,
      googleId: userRow.google_id ? String(userRow.google_id) : null,
      createdAt: String(userRow.created_at),
    }

    return { success: true, user }
  })

export const getGoogleAuthUrlFn = createServerFn({ method: "POST" })
  .validator((d?: { origin?: string }) => d)
  .handler(async ({ data }): Promise<{ url: string }> => {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      throw new Error("GOOGLE_CLIENT_ID কনফিগার করা নেই। অনুগ্রহ করে Vercel বা .env-এ গুগল ক্লায়েন্ট আইডি দিন।")
    }

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      (data?.origin ? `${data.origin}/api/auth/callback/google` : "http://localhost:3000/api/auth/callback/google")

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      prompt: "select_account",
    })

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    }
  })

export const logoutFn = createServerFn({ method: "POST" }).handler(async (): Promise<{ success: boolean }> => {
  const token = getCookie(SESSION_COOKIE_NAME)
  if (token) {
    const db = await getDatabase()
    await db.execute({
      sql: `DELETE FROM sessions WHERE token = ?`,
      args: [token],
    })
  }

  deleteCookie(SESSION_COOKIE_NAME, {
    path: "/",
  })

  return { success: true }
})

export const saveMeterFn = createServerFn({ method: "POST" })
  .validator((d: { meterNumber: string; customerNumber?: string; customerName?: string; address?: string; tariff?: string; sanctionedLoad?: string; alias?: string }) => d)
  .handler(async ({ data }): Promise<{ success: boolean; meter?: SavedMeter; error?: string }> => {
    const user = await getCurrentUserFn()
    if (!user) {
      return { success: false, error: "মিটার সংরক্ষণ করতে প্রথমে লগইন করুন।" }
    }

    const { meterNumber, customerNumber, customerName, address, tariff, sanctionedLoad, alias } = data
    if (!meterNumber?.trim()) {
      return { success: false, error: "মিটার নম্বর অনুপস্থিত।" }
    }

    const db = await getDatabase()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    try {
      await db.execute({
        sql: `
          INSERT INTO saved_meters (id, user_id, meter_number, customer_number, customer_name, address, tariff, sanctioned_load, alias, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, meter_number) DO UPDATE SET
            customer_number = excluded.customer_number,
            customer_name = excluded.customer_name,
            address = excluded.address,
            tariff = excluded.tariff,
            sanctioned_load = excluded.sanctioned_load,
            alias = excluded.alias,
            updated_at = excluded.updated_at
        `,
        args: [id, user.id, meterNumber.trim(), customerNumber || null, customerName || null, address || null, tariff || null, sanctionedLoad || null, alias || null, now, now],
      })

      return {
        success: true,
        meter: {
          id,
          userId: user.id,
          meterNumber: meterNumber.trim(),
          customerNumber,
          customerName,
          address,
          tariff,
          sanctionedLoad,
          alias,
          isFavorite: false,
          createdAt: now,
          updatedAt: now,
        },
      }
    } catch {
      return { success: false, error: "মিটার সংরক্ষণ করতে সমস্যা হয়েছে।" }
    }
  })

export const getSavedMetersFn = createServerFn({ method: "GET" }).handler(async (): Promise<SavedMeter[]> => {
  const user = await getCurrentUserFn()
  if (!user) return []

  const db = await getDatabase()
  const res = await db.execute({
    sql: `
      SELECT id, user_id, meter_number, customer_number, customer_name, address, tariff, sanctioned_load, alias, is_favorite, created_at, updated_at
      FROM saved_meters
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `,
    args: [user.id],
  })

  const rows = res.rows as unknown as Array<{
    id: string
    user_id: string
    meter_number: string
    customer_number: string | null
    customer_name: string | null
    address: string | null
    tariff: string | null
    sanctioned_load: string | null
    alias: string | null
    is_favorite: number
    created_at: string
    updated_at: string
  }>

  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.user_id),
    meterNumber: String(r.meter_number),
    customerNumber: r.customer_number ? String(r.customer_number) : undefined,
    customerName: r.customer_name ? String(r.customer_name) : undefined,
    address: r.address ? String(r.address) : undefined,
    tariff: r.tariff ? String(r.tariff) : undefined,
    sanctionedLoad: r.sanctioned_load ? String(r.sanctioned_load) : undefined,
    alias: r.alias ? String(r.alias) : undefined,
    isFavorite: Boolean(r.is_favorite),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }))
})

export const deleteSavedMeterFn = createServerFn({ method: "POST" })
  .validator((d: { meterNumber: string }) => d)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const user = await getCurrentUserFn()
    if (!user) return { success: false }

    const db = await getDatabase()
    await db.execute({
      sql: `DELETE FROM saved_meters WHERE user_id = ? AND meter_number = ?`,
      args: [user.id, data.meterNumber],
    })
    return { success: true }
  })
