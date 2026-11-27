// Runs on a PC in Bangladesh. NESCO answers 403 to servers abroad, so the deployed app sends its NESCO requests here.
// No accounts or settings: it opens an SSH tunnel and tells the app the current address, signed with a key
// that never leaves this PC (data/bridge-key.pem). `--public-key` prints the half that goes in the app.
import { spawn } from "node:child_process"
import { createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, sign } from "node:crypto"
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import readline from "node:readline"
import { fileURLToPath } from "node:url"
import { gzipSync } from "node:zlib"
import { MAX_SKEW_MS, seal, unseal } from "../src/features/nesco/bridge-crypto.ts"

const PORT = Number(process.env.BRIDGE_PORT) || 3001
const APP_URL = process.env.BILLBARI_APP_URL || "https://billbari.vercel.app"
const TARGET_URL = "https://customer.nesco.gov.bd/pre/panel"
const DATA_DIR = path.join(import.meta.dirname, "..", "data")
const KEY_FILE = path.join(DATA_DIR, "bridge-key.pem")
const LOG_FILE = path.join(DATA_DIR, "bridge.log")
const MAX_REQUEST_BYTES = 64 * 1024
const CHECK_EVERY_MS = 2 * 60_000
// fetch() has already decompressed the body, so these no longer describe it.
const STALE_HEADERS = ["content-encoding", "content-length", "transfer-encoding"]

export function createBridgeServer(key, send = fetch, report = () => {}) {
  return http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") return res.end("billbari-bridge")

    let job
    try {
      const chunks = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > MAX_REQUEST_BYTES) throw new Error("too large")
        chunks.push(chunk)
      }
      job = unseal(key, Buffer.concat(chunks))
      if (Math.abs(Date.now() - job.at) > MAX_SKEW_MS) throw new Error("expired")
    } catch (err) {
      report(`rejected a request (${err.code ?? err.message})`)
      return res.writeHead(404).end()
    }

    // Sizes and timings only: never the meter number or page contents.
    const started = Date.now()
    const took = () => `${Date.now() - started}ms`
    let reply
    try {
      // The target is fixed: whatever a request says, this PC only ever talks to NESCO's panel.
      const post = job.method === "POST"
      const upstream = await send(TARGET_URL, {
        method: post ? "POST" : "GET",
        headers: job.headers,
        body: post ? job.body : undefined,
        signal: AbortSignal.timeout(20_000),
      })
      const page = Buffer.from(await upstream.arrayBuffer())
      report(`${job.method} NESCO ${upstream.status}, ${page.length} bytes in ${took()}`)
      reply = {
        id: job.id,
        status: upstream.status,
        headers: [...upstream.headers].filter(([name]) => !STALE_HEADERS.includes(name)),
        // The free tunnel moves a few KB a second and a history page is ~300 KB; compressed it is ~11 KB.
        body: gzipSync(page, { level: 9 }).toString("base64"),
      }
    } catch (err) {
      reply = { id: job.id, error: err.cause?.code ?? err.name }
      report(`${job.method} NESCO failed (${reply.error}) after ${took()}`)
    }
    const sealed = seal(key, reply)
    res.on("close", () => report(`${job.method} reply ${res.writableFinished ? "sent" : "abandoned"}, ${sealed.length} bytes at ${took()}`))
    res.end(sealed)
  })
}

function loadPrivateKey() {
  if (!fs.existsSync(KEY_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    const { privateKey } = generateKeyPairSync("ed25519")
    fs.writeFileSync(KEY_FILE, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 })
  }
  return createPrivateKey(fs.readFileSync(KEY_FILE))
}

// The autostart task runs without a window, so the log file is the only record. Never log request contents.
function log(message) {
  const line = `${new Date().toISOString()} ${message}\n`
  process.stdout.write(line)
  fs.appendFileSync(LOG_FILE, line)
}

function main() {
  const privateKey = loadPrivateKey()
  if (process.argv.includes("--public-key")) {
    process.stdout.write(createPublicKey(privateKey).export({ type: "spki", format: "pem" }))
    return
  }

  const key = randomBytes(32)
  let url = ""
  let ssh
  let failures = 0
  let lastStatus = ""

  async function register() {
    const body = JSON.stringify({ url, key: key.toString("base64"), at: Date.now() })
    let status
    try {
      const res = await fetch(`${APP_URL}/api/nesco/bridge`, {
        method: "POST",
        headers: { "x-bridge-signature": sign(null, Buffer.from(body), privateKey).toString("base64") },
        body,
        signal: AbortSignal.timeout(20_000),
      })
      status = res.status === 204 ? "registered with the app" : `app refused registration (HTTP ${res.status})`
    } catch (err) {
      status = `could not reach the app (${err.cause?.code ?? err.name})`
    }
    if (status !== lastStatus) log(status)
    lastStatus = status
  }

  function openTunnel() {
    url = ""
    failures = 0
    ssh = spawn(
      "ssh",
      [
        "-o", "StrictHostKeyChecking=accept-new",
        "-o", "PubkeyAuthentication=no",
        "-o", "ServerAliveInterval=15",
        "-o", "ServerAliveCountMax=3",
        "-o", "ExitOnForwardFailure=yes",
        "-R", `80:127.0.0.1:${PORT}`,
        "nokey@localhost.run",
        "--", "--output", "json",
      ],
      { stdio: ["ignore", "pipe", "ignore"], windowsHide: true },
    )
    // The free tunnel rotates its address now and then; every new one is registered at once.
    readline.createInterface({ input: ssh.stdout }).on("line", (line) => {
      let address
      try {
        address = JSON.parse(line).data?.address
      } catch {
        return
      }
      if (!address?.endsWith(".lhr.life") || url === `https://${address}`) return
      url = `https://${address}`
      failures = 0
      log("tunnel open")
      lastStatus = ""
      register()
    })
    ssh.on("error", (err) => log(`ssh did not start (${err.code})`))
    ssh.on("close", () => {
      log("tunnel closed, reopening")
      setTimeout(openTunnel, 10_000)
    })
  }

  async function check() {
    const healthy =
      url !== "" &&
      (await fetch(`${url}/health`, { signal: AbortSignal.timeout(20_000) })
        .then(async (res) => (await res.text()) === "billbari-bridge")
        .catch(() => false))
    if (healthy) {
      failures = 0
      await register()
    } else if ((log("health check failed"), ++failures >= 2)) {
      failures = 0
      log("tunnel not answering")
      ssh.kill()
    }
  }

  const server = createBridgeServer(key, fetch, log)
  // A second copy (for example the autostart task) simply leaves the first one running.
  server.on("error", (err) => {
    log(`bridge not started (${err.code})`)
    process.exit(err.code === "EADDRINUSE" ? 0 : 1)
  })
  server.listen(PORT, "127.0.0.1", () => {
    log(`bridge listening on port ${PORT}`)
    openTunnel()
    setInterval(check, CHECK_EVERY_MS)
  })
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      ssh?.kill()
      process.exit()
    })
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
