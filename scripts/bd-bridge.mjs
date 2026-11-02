import http from "node:http"
import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

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

function getCloudflaredBin() {
  const homeBin = path.join(os.homedir(), ".local", "bin", "cloudflared")
  if (fs.existsSync(homeBin)) return homeBin
  return "cloudflared"
}

function startAutoTunnel() {
  console.log("🔗 স্বয়ংক্রিয় ক্লাউডফ্লেয়ার টানেল সংযোগ তৈরি হচ্ছে...")
  const cloudflaredBin = getCloudflaredBin()
  
  try {
    tunnelProcess = spawn(cloudflaredBin, ["tunnel", "--url", `http://localhost:${PORT}`])

    let captured = false

    const handleOutput = (data) => {
      const text = data.toString()
      const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.trycloudflare\.com/)
      if (match && !captured) {
        captured = true
        console.log("===============================================================")
        console.log(`🎉 Cloudflare Dhaka টানেল সফলভাবে চালু হয়েছে!`)
        console.log(`🌐 লাইভ ব্রিজ URL: ${match[0]}`)
        console.log(`👉 Vercel ড্যাশবোর্ডে Environment Variables-এ দিন:`)
        console.log(`   NESCO_PROXY_URL = ${match[0]}`)
        console.log(`⚡ ব্যাস! Vercel সরাসরি এই ব্রিজের মাধ্যমে নেসকো লাইভ ডেটা আনবে (কোনো 502/403 এরর ছাড়া)!`)
        console.log("===============================================================")
      }
    }

    tunnelProcess.stdout.on("data", handleOutput)
    tunnelProcess.stderr.on("data", handleOutput)

    tunnelProcess.on("error", () => {
      console.log("⚠️ cloudflared চালু হতে সমস্যা হয়েছে, SSH টানেল চেষ্টা করা হচ্ছে...")
      startSshTunnel()
    })

    tunnelProcess.on("close", (code) => {
      if (code !== 0 && !captured) {
        startSshTunnel()
      }
    })
  } catch {
    startSshTunnel()
  }
}

function startSshTunnel() {
  console.log("🔗 SSH টানেল সংযোগ তৈরি হচ্ছে...")
  tunnelProcess = spawn("ssh", [
    "-o", "StrictHostKeyChecking=no",
    "-o", "ServerAliveInterval=15",
    "-o", "ServerAliveCountMax=3",
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
      console.log(`🎉 SSH টানেল চালু হয়েছে!`)
      console.log(`🌐 লাইভ ব্রিজ URL: ${match[0]}`)
      console.log(`👉 Vercel ড্যাশবোর্ডে Environment Variables-এ দিন:`)
      console.log(`   NESCO_PROXY_URL = ${match[0]}`)
      console.log("===============================================================")
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
