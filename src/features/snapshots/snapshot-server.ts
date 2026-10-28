import { createServerFn } from "@tanstack/react-start"
import crypto from "node:crypto"
import { getDatabase } from "../db/server-db"
import { getCurrentUserFn } from "../auth/auth-server"

export interface SnapshotRecord {
  id: string
  userId: string
  meterNumber: string
  snapshotDate: string
  balance: number
  readingKwh: number
  dailyEstimatedCost: number
  monthlyEstimatedCost: number
  sourceType: "nesco_live" | "manual_reading" | "sample_demo"
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
    sourceType: "nesco_live" | "manual_reading" | "sample_demo"
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
