// Shared by the app and scripts/bd-bridge.mjs, which Node runs directly: keep imports to node: modules.
// The tunnel provider terminates TLS, so everything between app and bridge is also encrypted here.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

export const MAX_SKEW_MS = 5 * 60_000

export interface BridgeRequest {
  id: string
  at: number
  method: string
  headers: Record<string, string>
  body?: string
}

export type BridgeReply = { id: string } & (
  | { error: string }
  | { status: number; headers: [string, string][]; body: string }
)

export function seal(key: Buffer, value: unknown): Buffer {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), data])
}

/** Throws unless `sealed` was produced with the same key and left unchanged. */
export function unseal<T>(key: Buffer, sealed: Buffer): T {
  const decipher = createDecipheriv("aes-256-gcm", key, sealed.subarray(0, 12), { authTagLength: 16 })
  decipher.setAuthTag(sealed.subarray(12, 28))
  return JSON.parse(Buffer.concat([decipher.update(sealed.subarray(28)), decipher.final()]).toString()) as T
}
