import { generateKeyPairSync, randomBytes, sign } from "node:crypto"
import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
// @ts-expect-error: a plain Node script without type declarations
import { createBridgeServer } from "../scripts/bd-bridge.mjs"
import { getDatabase } from "../src/features/db/server-db"
import { bridgeFetch, getBridge, registerBridge } from "../src/features/nesco/bridge"

const key = randomBytes(32)
const PORTAL = "https://customer.nesco.gov.bd/pre/panel"

describe("app to bridge", () => {
  const nesco = vi.fn(async () => {
    const headers = new Headers({ "content-type": "text/html" })
    headers.append("set-cookie", "a=1; path=/")
    headers.append("set-cookie", "b=2; path=/")
    return new Response("রিচার্জ", { headers })
  })
  let server: Server
  let url = ""

  beforeAll(async () => {
    server = createBridgeServer(key, nesco)
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done))
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })
  afterAll(() => {
    server.close()
  })

  const ask = (bridge: { key?: Buffer; seenAt?: number }) =>
    bridgeFetch(
      { url, key, seenAt: Date.now(), ...bridge },
      { method: "POST", headers: { Cookie: "a=1" }, body: "cust_no=99999999", signal: AbortSignal.timeout(5000) },
    )

  it("relays the request to NESCO only, keeping cookies and Bangla text", async () => {
    const res = await ask({})
    expect(await res.text()).toBe("রিচার্জ")
    expect(res.headers.getSetCookie()).toEqual(["a=1; path=/", "b=2; path=/"])
    expect(nesco).toHaveBeenCalledWith(PORTAL, expect.objectContaining({ method: "POST", body: "cust_no=99999999" }))
  })

  it("refuses a caller without the key and never contacts NESCO for it", async () => {
    nesco.mockClear()
    await expect(ask({ key: randomBytes(32) })).rejects.toMatchObject({ cause: { code: "BRIDGE_404" } })
    expect(nesco).not.toHaveBeenCalled()
  })

  it("reports a silent bridge as offline", async () => {
    await expect(ask({ seenAt: Date.now() - 60 * 60_000 })).rejects.toMatchObject({
      message: "fetch failed",
      cause: { code: "BRIDGE_OFFLINE" },
    })
  })
})

describe("bridge registration", () => {
  const pair = generateKeyPairSync("ed25519")
  const publicKey = pair.publicKey.export({ type: "spki", format: "pem" }).toString()
  const register = (over: object = {}, signer = pair.privateKey) => {
    const body = JSON.stringify({ url: "https://one.lhr.life", key: key.toString("base64"), at: Date.now(), ...over })
    return registerBridge(body, sign(null, Buffer.from(body), signer).toString("base64"), publicKey)
  }
  const clear = async () => (await getDatabase()).execute("DELETE FROM nesco_bridge")
  beforeAll(clear)
  afterAll(clear)

  it("stores only fresh, https, correctly signed addresses", async () => {
    expect(await register({}, generateKeyPairSync("ed25519").privateKey)).toBe(false)
    expect(await register({ at: Date.now() - 60 * 60_000 })).toBe(false)
    expect(await register({ url: "http://one.lhr.life" })).toBe(false)
    expect(await getBridge()).toBeNull()

    expect(await register()).toBe(true)
    expect(await getBridge()).toMatchObject({ url: "https://one.lhr.life", key })
  })

  it("ignores a replayed older registration", async () => {
    await register({ url: "https://new.lhr.life", at: Date.now() })
    await register({ url: "https://old.lhr.life", at: Date.now() - 60_000 })
    expect((await getBridge())?.url).toBe("https://new.lhr.life")
  })
})
