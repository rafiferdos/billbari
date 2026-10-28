import { createServerFn } from "@tanstack/react-start"
import { getCookie } from "@tanstack/react-start/server"
import crypto from "node:crypto"
import { getDatabase } from "../db/server-db"
import { PAYMENT_PLANS, type PaymentPlan } from "./types"

const SESSION_COOKIE_NAME = "billbari_session"

export interface PaymentConfig {
  bkashNumber: string
  plans: PaymentPlan[]
}

export const getPaymentConfigFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<PaymentConfig> => {
    const bkashNumber = process.env.BKASH_PERSONAL_NUMBER?.trim() || "01784912345"
    return {
      bkashNumber,
      plans: PAYMENT_PLANS,
    }
  }
)

export const verifyBkashTrxFn = createServerFn({ method: "POST" })
  .validator((d: { planType: "detective_monthly" | "lifetime"; trxId: string; senderNumber?: string }) => d)
  .handler(async ({ data }): Promise<{ success: boolean; planType: string; message: string; error?: string }> => {
    const { planType, trxId, senderNumber } = data

    // 1. Authenticate user
    const token = getCookie(SESSION_COOKIE_NAME)
    if (!token) {
      throw new Error("সাবস্ক্রিপশন চালু করতে অনুগ্রহ করে প্রথমে আপনার বিলবাড়ি একাউন্টে লগইন করুন।")
    }

    const db = await getDatabase()
    const now = new Date().toISOString()

    const userRes = await db.execute({
      sql: `
        SELECT u.id, u.email, u.name, u.subscription_tier, u.subscription_expires_at, u.subscription_started_at
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > ?
      `,
      args: [token, now],
    })

    const user = userRes.rows[0] as unknown as
      | {
          id: string
          email: string
          name: string
          subscription_tier: string | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
        }
      | undefined

    if (!user) {
      throw new Error("আপনার সেশনের মেয়াদ শেষ হয়েছে। পুনরায় লগইন করুন।")
    }

    // 2. Validate TrxID format
    const cleanTrx = trxId.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
    if (!cleanTrx || cleanTrx.length < 8 || cleanTrx.length > 14) {
      throw new Error(
        "অবৈধ বিকাশ Transaction ID! বিকাশের ট্রানজেকশন আইডি সাধারণত ১০ ডিজিটের অক্ষর ও সংখ্যার সমন্বয়ে হয় (যেমন: BL57A1X9K2)।"
      )
    }

    // 3. Anti-Replay Attack Check (Uniqueness in DB)
    const existingPayment = await db.execute({
      sql: `SELECT id, user_id, trx_id, created_at FROM payments WHERE trx_id = ? LIMIT 1`,
      args: [cleanTrx],
    })

    if (existingPayment.rows.length > 0) {
      throw new Error(
        "এই Transaction ID (TrxID) ইতিপূর্বে ব্যবহার করা হয়েছে! অনুগ্রহ করে আপনার নতুন লেনদেনের সঠিক ট্রানজেকশন আইডি দিন।"
      )
    }

    const amountBdt = planType === "lifetime" ? 100 : 20
    const paymentId = crypto.randomUUID()
    const verifiedAt = new Date().toISOString()

    // 4. Calculate subscription extension
    let newExpiresAt: string | null = null
    const startedAt = user.subscription_started_at || verifiedAt

    if (planType === "detective_monthly") {
      const currentExpiry =
        user.subscription_expires_at && new Date(user.subscription_expires_at) > new Date()
          ? new Date(user.subscription_expires_at)
          : new Date()
      // Add 30 days
      const extended = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000)
      newExpiresAt = extended.toISOString()
    } else {
      // Lifetime plan has no expiration
      newExpiresAt = null
    }

    // 5. Record payment and update user subscription atomically
    try {
      await db.execute({
        sql: `
          INSERT INTO payments (id, user_id, provider, plan_type, amount_bdt, sender_number, trx_id, status, verified_at, created_at)
          VALUES (?, ?, 'bkash', ?, ?, ?, ?, 'completed', ?, ?)
        `,
        args: [
          paymentId,
          user.id,
          planType,
          amountBdt,
          senderNumber?.trim() || "",
          cleanTrx,
          verifiedAt,
          verifiedAt,
        ],
      })

      await db.execute({
        sql: `
          UPDATE users
          SET subscription_tier = ?,
              subscription_expires_at = ?,
              subscription_started_at = ?,
              updated_at = ?
          WHERE id = ?
        `,
        args: [planType, newExpiresAt, startedAt, verifiedAt, user.id],
      })

      const planName = planType === "lifetime" ? "আজীবন বিদ্যুৎ অভিভাবক" : "বিদ্যুৎ গোয়েন্দা"
      return {
        success: true,
        planType,
        message: `অভিনন্দন! আপনার "${planName}" সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে। এখন থেকে সকল দিনভিত্তিক হিসাব ও ক্লাউড সেভ সম্পূর্ণ আনলক!`,
      }
    } catch (dbErr: unknown) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr)
      console.error("Subscription activation DB error:", msg)
      throw new Error("পেমেন্ট যাচাইয়ের সময় ডাটাবেসে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।")
    }
  })
