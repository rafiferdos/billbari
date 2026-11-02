import { createServerFn } from "@tanstack/react-start"
import crypto from "node:crypto"
import { getDatabase } from "../db/server-db"
import { getCurrentUserFn } from "../auth/auth-server"
import { fetchNescoData } from "../nesco/nesco-service"

export interface SnapshotRecord {
  id: string
  userId: string
  meterNumber: string
  snapshotDate: string
  balance: number
  readingKwh: number
  dailyEstimatedCost: number
  monthlyEstimatedCost: number
  sourceType: "nesco_live" | "manual_reading" | "sample_demo" | "automated_daily_cron"
  notes?: string
  createdAt: string
}

export const saveSnapshotFn = createServerFn({ method: "POST" })
  .validator((d: {
    meterNumber: string
    snapshotDate: string
    balance: number
    readingKwh?: number
    dailyEstimatedCost: number
    monthlyEstimatedCost: number
    sourceType: "nesco_live" | "manual_reading" | "sample_demo" | "automated_daily_cron"
    notes?: string
  }) => d)
  .handler(async ({ data }): Promise<{ success: boolean; snapshot?: SnapshotRecord; error?: string }> => {
    const user = await getCurrentUserFn()
    if (!user) {
      return { success: false, error: "স্ন্যাপশট সংরক্ষণ করতে অনুগ্রহ করে লগইন করুন।" }
    }

    const {
      meterNumber,
      snapshotDate,
      balance,
      readingKwh = 0,
      dailyEstimatedCost,
      monthlyEstimatedCost,
      sourceType,
      notes,
    } = data

    if (!meterNumber) {
      return { success: false, error: "মিটার নম্বর প্রদান আবশ্যক।" }
    }

    const db = await getDatabase()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    try {
      await db.execute({
        sql: `
          INSERT INTO snapshots (
            id, user_id, meter_number, snapshot_date, balance, reading_kwh,
            daily_estimated_cost, monthly_estimated_cost, source_type, notes, raw_data_json, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          id,
          user.id,
          meterNumber,
          snapshotDate || now,
          balance || 0,
          readingKwh || 0,
          dailyEstimatedCost || 0,
          monthlyEstimatedCost || 0,
          sourceType || "manual_reading",
          notes || null,
          JSON.stringify(data),
          now,
        ],
      })

      const snapshot: SnapshotRecord = {
        id,
        userId: user.id,
        meterNumber,
        snapshotDate: snapshotDate || now,
        balance: balance || 0,
        readingKwh: readingKwh || 0,
        dailyEstimatedCost: dailyEstimatedCost || 0,
        monthlyEstimatedCost: monthlyEstimatedCost || 0,
        sourceType: sourceType || "manual_reading",
        notes,
        createdAt: now,
      }

      return { success: true, snapshot }
    } catch {
      return { success: false, error: "স্ন্যাপশট ডেটাবেজে সংরক্ষণ করা সম্ভব হয়নি।" }
    }
  })

export const getSnapshotsFn = createServerFn({ method: "GET" })
  .validator((d?: { meterNumber?: string }) => d)
  .handler(async ({ data }): Promise<SnapshotRecord[]> => {
    const user = await getCurrentUserFn()
    if (!user) return []

    const db = await getDatabase()
    const res = data?.meterNumber
      ? await db.execute({
          sql: `
            SELECT id, user_id, meter_number, snapshot_date, balance, reading_kwh,
                   daily_estimated_cost, monthly_estimated_cost, source_type, notes, created_at
            FROM snapshots
            WHERE user_id = ? AND meter_number = ?
            ORDER BY snapshot_date DESC
          `,
          args: [user.id, data.meterNumber],
        })
      : await db.execute({
          sql: `
            SELECT id, user_id, meter_number, snapshot_date, balance, reading_kwh,
                   daily_estimated_cost, monthly_estimated_cost, source_type, notes, created_at
            FROM snapshots
            WHERE user_id = ?
            ORDER BY snapshot_date DESC
          `,
          args: [user.id],
        })

    const rows = res.rows as unknown as Array<{
      id: string
      user_id: string
      meter_number: string
      snapshot_date: string
      balance: number
      reading_kwh: number
      daily_estimated_cost: number
      monthly_estimated_cost: number
      source_type: "nesco_live" | "manual_reading" | "sample_demo"
      notes: string | null
      created_at: string
    }>

    return rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      meterNumber: String(r.meter_number),
      snapshotDate: String(r.snapshot_date),
      balance: Number(r.balance),
      readingKwh: Number(r.reading_kwh),
      dailyEstimatedCost: Number(r.daily_estimated_cost),
      monthlyEstimatedCost: Number(r.monthly_estimated_cost),
      sourceType: r.source_type,
      notes: r.notes ? String(r.notes) : undefined,
      createdAt: String(r.created_at),
    }))
  })

export const deleteSnapshotFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const user = await getCurrentUserFn()
    if (!user) return { success: false }

    const db = await getDatabase()
    await db.execute({
      sql: `DELETE FROM snapshots WHERE id = ? AND user_id = ?`,
      args: [data.id, user.id],
    })
    return { success: true }
  })

/**
 * On-demand automated daily pulse sync for subscribed (Pro / Meter Plus) users.
 * Automatically fetches fresh NESCO telemetry, computes 24h burn rate, and records snapshot.
 */
export const syncAutomatedDailyPulseFn = createServerFn({ method: "POST" })
  .validator((d?: { meterNumber?: string }) => d)
  .handler(async ({ data }): Promise<{
    success: boolean
    snapshot?: SnapshotRecord
    dailyBurn?: number
    error?: string
  }> => {
    const user = await getCurrentUserFn()
    if (!user) {
      return { success: false, error: "স্বয়ংক্রিয় লাইভ পালস সিঙ্ক করতে প্রথমে লগইন করুন।" }
    }

    const isPro = user.subscriptionTier === "detective_monthly" || user.subscriptionTier === "lifetime"
    if (!isPro) {
      return {
        success: false,
        error: "স্বয়ংক্রিয় মিডনাইট পালস সিঙ্ক ফিচারটি শুধুমাত্র মিটার প্লাস ও প্রিমিয়াম সদস্যদের জন্য উন্মুক্ত।",
      }
    }

    const db = await getDatabase()
    let targetMeter = data?.meterNumber?.replace(/[^0-9]/g, "").trim()

    if (!targetMeter) {
      // Look up favorite or first saved meter
      const savedRes = await db.execute({
        sql: `SELECT meter_number FROM saved_meters WHERE user_id = ? ORDER BY is_favorite DESC, created_at DESC LIMIT 1`,
        args: [user.id],
      })
      if (savedRes.rows.length > 0) {
        targetMeter = String(savedRes.rows[0].meter_number)
      }
    }

    if (!targetMeter || targetMeter.length < 8) {
      return { success: false, error: "সিঙ্ক করার জন্য কোনো সঠিক মিটার নম্বর পাওয়া যায়নি।" }
    }

    try {
      const nescoData = await fetchNescoData(targetMeter)
      const currentBalance = nescoData.customerInfo.balance
      const readingKwh = nescoData.monthlyUsage[0]?.usageKwh || 0

      // Look up prior snapshot for this meter to compute exact daily burn rate
      const prevRes = await db.execute({
        sql: `
          SELECT balance, snapshot_date, daily_estimated_cost
          FROM snapshots
          WHERE user_id = ? AND meter_number = ?
          ORDER BY snapshot_date DESC
          LIMIT 1
        `,
        args: [user.id, targetMeter],
      })

      let dailyBurn = 48.5
      if (prevRes.rows.length > 0) {
        const prev = prevRes.rows[0] as unknown as { balance: number; snapshot_date: string; daily_estimated_cost: number }
        const diff = prev.balance - currentBalance
        if (diff > 0) {
          const d1 = Date.now()
          const d2 = new Date(prev.snapshot_date).getTime()
          const diffDays = Math.max(1, Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24)))
          dailyBurn = Math.round((diff / diffDays) * 100) / 100
        } else {
          dailyBurn = prev.daily_estimated_cost || 48.5
        }
      }

      const id = crypto.randomUUID()
      const now = new Date().toISOString()

      await db.execute({
        sql: `
          INSERT INTO snapshots (
            id, user_id, meter_number, snapshot_date, balance, reading_kwh,
            daily_estimated_cost, monthly_estimated_cost, source_type, notes, raw_data_json, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          id,
          user.id,
          targetMeter,
          now,
          currentBalance,
          readingKwh,
          dailyBurn,
          dailyBurn * 30,
          "automated_daily_cron",
          "স্বয়ংক্রিয় মিডনাইট পালস সিঙ্ক (রাত ১২:৩০)",
          JSON.stringify({ balance: currentBalance, readingKwh, fetchedAt: now }),
          now,
        ],
      })

      const snapshot: SnapshotRecord = {
        id,
        userId: user.id,
        meterNumber: targetMeter,
        snapshotDate: now,
        balance: currentBalance,
        readingKwh,
        dailyEstimatedCost: dailyBurn,
        monthlyEstimatedCost: dailyBurn * 30,
        sourceType: "automated_daily_cron",
        notes: "স্বয়ংক্রিয় মিডনাইট পালস সিঙ্ক (রাত ১২:৩০)",
        createdAt: now,
      }

      return { success: true, snapshot, dailyBurn }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "নেসকো লাইভ পোর্টাল থেকে ডেটা সিঙ্ক করা সম্ভব হয়নি।"
      return { success: false, error: msg }
    }
  })

/**
 * Global midnight cron execution for all paid subscribers (scheduled at 12:30 AM BD / 18:30 UTC).
 */
export const triggerGlobalMidnightCronFn = createServerFn({ method: "POST" })
  .validator((d?: { secret?: string }) => d)
  .handler(async ({ data }): Promise<{
    success: boolean
    processedMeters: number
    snapshotsCreated: number
    errors: string[]
  }> => {
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && data?.secret && data.secret !== cronSecret) {
      return { success: false, processedMeters: 0, snapshotsCreated: 0, errors: ["Unauthorized cron token"] }
    }

    const db = await getDatabase()
    const usersRes = await db.execute({
      sql: `SELECT id, name FROM users WHERE subscription_tier IN ('detective_monthly', 'lifetime')`,
    })

    const users = usersRes.rows as unknown as Array<{ id: string; name: string }>
    let processedMeters = 0
    let snapshotsCreated = 0
    const errors: string[] = []

    for (const u of users) {
      const metersRes = await db.execute({
        sql: `SELECT meter_number FROM saved_meters WHERE user_id = ?`,
        args: [u.id],
      })
      const meters = metersRes.rows as unknown as Array<{ meter_number: string }>

      for (const m of meters) {
        processedMeters++
        try {
          const nescoData = await fetchNescoData(m.meter_number)
          const currentBalance = nescoData.customerInfo.balance
          const readingKwh = nescoData.monthlyUsage[0]?.usageKwh || 0

          const prevRes = await db.execute({
            sql: `SELECT balance, snapshot_date, daily_estimated_cost FROM snapshots WHERE user_id = ? AND meter_number = ? ORDER BY snapshot_date DESC LIMIT 1`,
            args: [u.id, m.meter_number],
          })

          let dailyBurn = 48.5
          if (prevRes.rows.length > 0) {
            const prev = prevRes.rows[0] as unknown as { balance: number; snapshot_date: string; daily_estimated_cost: number }
            const diff = prev.balance - currentBalance
            if (diff > 0) {
              const d1 = Date.now()
              const d2 = new Date(prev.snapshot_date).getTime()
              const diffDays = Math.max(1, Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24)))
              dailyBurn = Math.round((diff / diffDays) * 100) / 100
            } else {
              dailyBurn = prev.daily_estimated_cost || 48.5
            }
          }

          const id = crypto.randomUUID()
          const now = new Date().toISOString()

          await db.execute({
            sql: `
              INSERT INTO snapshots (
                id, user_id, meter_number, snapshot_date, balance, reading_kwh,
                daily_estimated_cost, monthly_estimated_cost, source_type, notes, raw_data_json, created_at
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            args: [
              id,
              u.id,
              m.meter_number,
              now,
              currentBalance,
              readingKwh,
              dailyBurn,
              dailyBurn * 30,
              "automated_daily_cron",
              "স্বয়ংক্রিয় মিডনাইট সিঙ্ক (রাত ১২:৩০)",
              JSON.stringify({ balance: currentBalance, readingKwh, fetchedAt: now }),
              now,
            ],
          })
          snapshotsCreated++
        } catch (err) {
          errors.push(`Meter ${m.meter_number}: ${err instanceof Error ? err.message : "Sync error"}`)
        }
      }
    }

    return { success: true, processedMeters, snapshotsCreated, errors }
  })
