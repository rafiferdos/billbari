import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { getDatabase } from "../src/features/db/server-db"
import { getSavedMetersFn, saveMeterFn } from "../src/features/auth/auth-server"
import {
  deleteSnapshotFn,
  getSnapshotsFn,
  saveSnapshotFn,
  syncAutomatedDailyPulseFn,
  triggerGlobalMidnightCronFn,
} from "../src/features/snapshots/snapshot-server"
import { Route as cronRoute } from "../src/routes/api/cron/daily-pulse"

const session = vi.hoisted(() => {
  process.env.TURSO_DATABASE_URL = ":memory:" // never touch a real database
  return { token: undefined as string | undefined }
})

// Run server functions as plain functions, with the cookie under test control.
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      validator: () => builder,
      handler: (fn: (ctx: unknown) => unknown) => (ctx: unknown = {}) => fn(ctx),
    }
    return builder
  },
}))
vi.mock("@tanstack/react-start/server", () => ({
  getCookie: () => session.token,
  setCookie: () => {},
  deleteCookie: () => {},
}))

const past = new Date(Date.now() - 86_400_000).toISOString()
const future = new Date(Date.now() + 86_400_000).toISOString()
const accounts = {
  free: { tier: "free", expires: null, meter: "11111111" },
  lapsed: { tier: "detective_monthly", expires: past, meter: "22222222" },
  monthly: { tier: "detective_monthly", expires: future, meter: "12345678" },
  lifetime: { tier: "lifetime", expires: null, meter: "11019842510" },
} as const
const as = (name: keyof typeof accounts | null) => {
  session.token = name ? `token-${name}` : undefined
}
const snapshot = { meterNumber: "12345678", snapshotDate: "2026-11-27", balance: 100, dailyEstimatedCost: 0, monthlyEstimatedCost: 0, sourceType: "manual_reading" as const }
const count = async (sql: string) => Number((await (await getDatabase()).execute(sql)).rows[0].n)

beforeAll(async () => {
  const db = await getDatabase()
  for (const [id, a] of Object.entries(accounts)) {
    await db.execute({
      sql: "INSERT INTO users (id, email, name, subscription_tier, subscription_expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id, `${id}@example.test`, id, a.tier, a.expires, past, past],
    })
    await db.execute({
      sql: "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
      args: [`token-${id}`, id, future, past],
    })
  }
})

describe.each(["free", "lapsed"] as const)("%s account", (name) => {
  it("cannot write or read snapshots, but can delete its own", async () => {
    as(name)
    expect(await saveSnapshotFn({ data: snapshot })).toEqual({ success: false, error: "এই ফিচারটি প্রো প্ল্যানে পাওয়া যায়।" })
    await (await getDatabase()).execute({
      sql: "INSERT INTO snapshots (id, user_id, meter_number, snapshot_date, source_type, created_at) VALUES (?, ?, '12345678', ?, 'manual_reading', ?)",
      args: [`old-${name}`, name, past, past],
    })
    expect(await getSnapshotsFn()).toEqual([])
    expect(await syncAutomatedDailyPulseFn({ data: { meterNumber: "12345678" } })).toMatchObject({ success: false, error: "এই ফিচারটি প্রো প্ল্যানে পাওয়া যায়।" })
    // lapsed data is kept
    expect(await count(`SELECT COUNT(*) AS n FROM snapshots WHERE user_id = '${name}'`)).toBe(1)
    expect(await deleteSnapshotFn({ data: { id: `old-${name}` } })).toEqual({ success: true })
  })

  it("saves one meter, may re-save it, and is refused a second", async () => {
    as(name)
    const first = accounts[name].meter
    expect((await saveMeterFn({ data: { meterNumber: first } })).success).toBe(true)
    expect((await saveMeterFn({ data: { meterNumber: ` ${first} `, alias: "home" } })).success).toBe(true)
    expect(await saveMeterFn({ data: { meterNumber: "33333333" } })).toEqual({
      success: false,
      error: "ফ্রি প্ল্যানে ১টি মিটার সংরক্ষণ করা যায়। আরও মিটারের জন্য প্রো নিন।",
    })
    expect(await getSavedMetersFn()).toHaveLength(1)
  })
})

describe.each(["monthly", "lifetime"] as const)("%s account", (name) => {
  it("can use snapshots and several meters", async () => {
    as(name)
    expect((await saveSnapshotFn({ data: snapshot })).success).toBe(true)
    expect(await getSnapshotsFn()).toHaveLength(1)
    expect((await saveMeterFn({ data: { meterNumber: accounts[name].meter } })).success).toBe(true)
    expect((await saveMeterFn({ data: { meterNumber: name === "monthly" ? "11019842510" : "12345678" } })).success).toBe(true)
  })
})

describe("signed out", () => {
  it("is asked to sign in", async () => {
    as(null)
    expect(await saveSnapshotFn({ data: snapshot })).toEqual({ success: false, error: "এই ফিচার ব্যবহার করতে লগইন করুন।" })
    expect(await getSnapshotsFn()).toEqual([])
    expect(await syncAutomatedDailyPulseFn({})).toMatchObject({ success: false, error: "এই ফিচার ব্যবহার করতে লগইন করুন।" })
  })
})

describe("midnight cron", () => {
  afterEach(() => vi.unstubAllEnvs())

  const snapshots = () => count("SELECT COUNT(*) AS n FROM snapshots")
  const call = (method: "GET" | "POST", query = "", headers?: Record<string, string>) =>
    (cronRoute.options.server!.handlers as Record<string, (c: { request: Request }) => Promise<Response>>)[method]({
      request: new Request(`http://localhost/api/cron/daily-pulse${query}`, { method, headers }),
    })

  it.each([
    ["no secret configured, none sent", "", undefined],
    ["no secret configured, one sent", "", "anything"],
    ["none sent", "s3cret", undefined],
    ["empty one sent", "s3cret", ""],
    ["wrong one sent", "s3cret", "guess"],
  ])("does nothing: %s", async (_, configured, sent) => {
    vi.stubEnv("CRON_SECRET", configured)
    const before = await snapshots()
    expect(await triggerGlobalMidnightCronFn({ data: { secret: sent } })).toEqual({
      success: false, processedMeters: 0, snapshotsCreated: 0, errors: ["Unauthorized cron token"],
    })
    expect(await snapshots()).toBe(before)
  })

  it.each(["GET", "POST"] as const)("answers 401 to %s without the secret", async (method) => {
    vi.stubEnv("CRON_SECRET", "s3cret")
    expect((await call(method)).status).toBe(401)
  })

  it.each([
    ["bearer header", "", { authorization: "Bearer s3cret" }],
    ["query string", "?secret=s3cret", undefined],
  ])("accepts the secret as a %s and processes only unexpired subscribers", async (_, query, headers) => {
    vi.stubEnv("CRON_SECRET", "s3cret")
    const res = await call("GET", query, headers)
    expect(res.status).toBe(200)
    // monthly and lifetime have 2 saved sample meters each; free and lapsed are skipped
    expect(await res.json()).toMatchObject({ processedMeters: 4, snapshotsCreated: 4, errors: [] })
  })
})
