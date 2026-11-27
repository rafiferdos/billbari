// NESCO answers 403 to servers outside Bangladesh, so the deployed app reaches it through scripts/bd-bridge.mjs.
// The bridge reports its current tunnel address to /api/nesco/bridge; nothing has to be configured by hand.
import { randomUUID, verify } from "node:crypto"
import { gunzipSync } from "node:zlib"
import { getDatabase } from "@/features/db/server-db"
import { MAX_SKEW_MS, seal, unseal } from "./bridge-crypto"
import type { BridgeReply, BridgeRequest } from "./bridge-crypto"
import { BRIDGE_PUBLIC_KEY } from "./bridge-public-key"

const OFFLINE_AFTER_MS = 15 * 60_000

export interface Bridge {
  url: string
  key: Buffer
  seenAt: number
}

/** Accepts a registration only when signed by the bridge PC's private key, and never an older one. */
export async function registerBridge(body: string, signature: string, publicKey = BRIDGE_PUBLIC_KEY): Promise<boolean> {
  if (!verify(null, Buffer.from(body), publicKey, Buffer.from(signature, "base64"))) return false

  const { url, key, at } = JSON.parse(body) as { url?: string; key?: string; at?: number }
  if (!url?.startsWith("https://") || !key || Buffer.from(key, "base64").length !== 32) return false
  if (!at || Math.abs(Date.now() - at) > MAX_SKEW_MS) return false

  const db = await getDatabase()
  await db.execute({
    sql: `INSERT INTO nesco_bridge (id, url, key, seen_at) VALUES (1, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET url = excluded.url, key = excluded.key, seen_at = excluded.seen_at
          WHERE excluded.seen_at > nesco_bridge.seen_at`,
    args: [url, key, at],
  })
  return true
}

export async function getBridge(): Promise<Bridge | null> {
  const db = await getDatabase()
  const row = (await db.execute("SELECT url, key, seen_at FROM nesco_bridge WHERE id = 1")).rows.at(0)
  if (!row) return null
  return { url: String(row.url), key: Buffer.from(String(row.key), "base64"), seenAt: Number(row.seen_at) }
}

// Same shape as Node's own connection errors, so callers treat both alike.
const unreachable = (code: string) => new TypeError("fetch failed", { cause: { code } })

export async function bridgeFetch(
  bridge: Bridge,
  init: { method?: string; headers: Record<string, string>; body?: string; signal: AbortSignal },
): Promise<Response> {
  if (Date.now() - bridge.seenAt > OFFLINE_AFTER_MS) throw unreachable("BRIDGE_OFFLINE")

  const request: BridgeRequest = {
    id: randomUUID(),
    at: Date.now(),
    method: init.method ?? "GET",
    headers: init.headers,
    body: init.body,
  }
  const res = await fetch(bridge.url, { method: "POST", body: new Uint8Array(seal(bridge.key, request)), signal: init.signal })
  if (!res.ok) throw unreachable(`BRIDGE_${res.status}`)

  const sealed = Buffer.from(await res.arrayBuffer())
  let reply: BridgeReply
  try {
    reply = unseal<BridgeReply>(bridge.key, sealed)
  } catch {
    throw unreachable("BRIDGE_REPLY")
  }
  if (reply.id !== request.id) throw unreachable("BRIDGE_REPLY")
  if ("error" in reply) throw unreachable(reply.error)
  return new Response(gunzipSync(Buffer.from(reply.body, "base64")), { status: reply.status, headers: reply.headers })
}
