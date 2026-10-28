import http from "node:http"

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

server.listen(PORT, () => {
  console.log("===============================================================")
  console.log(`⚡ বিলবাড়ি (BillBari) বাংলাদেশ প্রক্সি ব্রিজ সফলভাবে চালু হয়েছে!`)
  console.log(`👉 লোকাল পোর্ট: http://localhost:${PORT}`)
  console.log(`🎯 টার্গেট: ${TARGET_URL}`)
  console.log("===============================================================")
  console.log(`💡 Vercel-এর সাথে যুক্ত করার নিয়ম:`)
  console.log(`   ১. Cloudflare টানেল চালান: npx cloudflared tunnel --url http://localhost:${PORT}`)
  console.log(`   ২. টানেল যে পাবলিক HTTPS লিংক দেবে, সেটি Vercel-এর Environment Variables-এ দিন:`)
  console.log(`      NESCO_PROXY_URL = https://your-tunnel-link.trycloudflare.com`)
  console.log(`   ৩. ব্যস! Vercel সরাসরি এই ব্রিজের মাধ্যমে নেসকো লাইভ ডেটা আনবে!`)
  console.log("===============================================================")
})
