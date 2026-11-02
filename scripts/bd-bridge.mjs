import http from "node:http"
import { spawn } from "node:child_process"

const PORT = Number(process.env.BRIDGE_PORT) || 3001
const TARGET_URL = "https://customer.nesco.gov.bd/pre/panel"

const server = http.createServer(async (req, res) => {
  // Set CORS headers so it can be queried from any domain
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "*")

  if (req.method === "OPTIONS") {
    res.writeHead(200)
    res.end()
    return
  }

  const clientIp = req.socket.remoteAddress || "unknown"
  console.log(`[Bridge ${new Date().toLocaleTimeString()}] ${req.method} request received from ${clientIp}`)

  try {
    const chunks = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const bodyBuffer = Buffer.concat(chunks)

    const headers = {
      "User-Agent": req.headers["user-agent"] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": req.headers["accept"] || "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7",
      "Origin": "https://customer.nesco.gov.bd",
      "Referer": TARGET_URL,
    }

    if (req.headers["cookie"]) {
      headers["Cookie"] = req.headers["cookie"]
    }
    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"]
    }

    const fetchRes = await fetch(TARGET_URL, {
      method: req.method,
      headers,
      body: req.method === "POST" ? bodyBuffer : undefined,
    })

    const setCookies = fetchRes.headers.getSetCookie?.() || []
    if (setCookies.length > 0) {
      res.setHeader("set-cookie", setCookies)
    }
    res.setHeader("Content-Type", fetchRes.headers.get("content-type") || "text/html; charset=UTF-8")
    res.writeHead(fetchRes.status)

    const resBuffer = await fetchRes.arrayBuffer()
    res.end(Buffer.from(resBuffer))
    console.log(`[Bridge ${new Date().toLocaleTimeString()}] Forwarded -> NESCO Status ${fetchRes.status}`)
  } catch (err) {
    console.error(`[Bridge Error]:`, err)
    res.writeHead(502, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Failed to forward request to NESCO portal", detail: String(err) }))
  }
})

let tunnelProcess = null

function startAutoTunnel() {
  console.log("🔗 স্বয়ংক্রিয় পাবলিক টানেল সংযোগ তৈরি হচ্ছে...")
  tunnelProcess = spawn("ssh", [
    "-o", "StrictHostKeyChecking=no",
    "-o", "ServerAliveInterval=30",
    "-R", `80:localhost:${PORT}`,
    "nokey@localhost.run",
  ])

  let captured = false

  tunnelProcess.stdout.on("data", (data) => {
    const text = data.toString()
    const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.(?:lhr\.life|localhost\.run)/)
    if (match && !captured) {
      captured = true
      console.log("===============================================================")
      console.log(`🎉 পাবলিক টানেল সফলভাবে চালু হয়েছে!`)
      console.log(`🌐 লাইভ ব্রিজ URL: ${match[0]}`)
      console.log(`👉 Vercel ড্যাশবোর্ডে Environment Variables-এ দিন:`)
      console.log(`   NESCO_PROXY_URL = ${match[0]}`)
      console.log(`⚡ ব্যাস! Vercel সরাসরি এই ব্রিজের মাধ্যমে নেসকো লাইভ ডেটা আনবে (কোনো 403 এরর ছাড়া)!`)
      console.log("===============================================================")
    }
  })

  tunnelProcess.on("close", (code) => {
    if (code !== 0) {
      console.log(`⚠️ টানেল সংযোগ বিচ্ছিন্ন হয়েছে, ৫ সেকেন্ড পর পুনরায় চেষ্টা করা হচ্ছে...`)
      setTimeout(startAutoTunnel, 5000)
    }
  })
}

server.listen(PORT, () => {
  console.log("===============================================================")
  console.log(`⚡ বিলবাড়ি (BillBari) বাংলাদেশ প্রক্সি ব্রিজ সফলভাবে চালু হয়েছে!`)
  console.log(`👉 লোকাল পোর্ট: http://localhost:${PORT}`)
  console.log(`🎯 টার্গেট: ${TARGET_URL}`)
  console.log("===============================================================")

  // Automatically launch SSH tunnel
  startAutoTunnel()
})

process.on("SIGINT", () => {
  if (tunnelProcess) tunnelProcess.kill()
  process.exit()
})

process.on("SIGTERM", () => {
  if (tunnelProcess) tunnelProcess.kill()
  process.exit()
})
