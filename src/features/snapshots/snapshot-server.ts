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

    const db = getDatabase()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    try {
      db.prepare(`
        INSERT INTO snapshots (
          id, user_id, meter_number, snapshot_date, balance, reading_kwh,
          daily_estimated_cost, monthly_estimated_cost, source_type, notes, raw_data_json, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
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
        now
      )

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
    } catch (err) {
      return { success: false, error: "স্ন্যাপশট ডেটাবেজে সংরক্ষণ করা সম্ভব হয়নি।" }
    }
  })

export const getSnapshotsFn = createServerFn({ method: "GET" })
  .validator((d?: { meterNumber?: string }) => d)
  .handler(async ({ data }): Promise<SnapshotRecord[]> => {
    const user = await getCurrentUserFn()
    if (!user) return []

    const db = getDatabase()
    let rows: Array<{
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

    if (data?.meterNumber) {
      rows = db.prepare(`
        SELECT id, user_id, meter_number, snapshot_date, balance, reading_kwh,
               daily_estimated_cost, monthly_estimated_cost, source_type, notes, created_at
        FROM snapshots
        WHERE user_id = ? AND meter_number = ?
        ORDER BY snapshot_date DESC
      `).all(user.id, data.meterNumber) as typeof rows
    } else {
      rows = db.prepare(`
        SELECT id, user_id, meter_number, snapshot_date, balance, reading_kwh,
               daily_estimated_cost, monthly_estimated_cost, source_type, notes, created_at
        FROM snapshots
        WHERE user_id = ?
        ORDER BY snapshot_date DESC
      `).all(user.id) as typeof rows
    }

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      meterNumber: r.meter_number,
      snapshotDate: r.snapshot_date,
      balance: r.balance,
      readingKwh: r.reading_kwh,
      dailyEstimatedCost: r.daily_estimated_cost,
      monthlyEstimatedCost: r.monthly_estimated_cost,
      sourceType: r.source_type,
      notes: r.notes || undefined,
      createdAt: r.created_at,
    }))
  })

export const deleteSnapshotFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const user = await getCurrentUserFn()
    if (!user) return { success: false }

    const db = getDatabase()
    db.prepare(`DELETE FROM snapshots WHERE id = ? AND user_id = ?`).run(data.id, user.id)
    return { success: true }
  })
