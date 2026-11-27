// Captures NESCO portal HTML as redacted test fixtures.
// Usage: node scripts/capture-nesco-fixture.mjs <meterNo>
import { mkdirSync, writeFileSync } from "node:fs"
import * as cheerio from "cheerio"

const meter = (process.argv[2] || "").replace(/[^0-9]/g, "")
if (meter.length < 8) {
  console.error("Usage: node scripts/capture-nesco-fixture.mjs <meterNo>")
  process.exit(1)
}

const OUT = "tests/fixtures/nesco"
const PORTAL = process.env.NESCO_PROXY_URL || process.env.NESCO_PORTAL_URL || "https://customer.nesco.gov.bd/pre/panel"
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7",
}
// Over-redacting is fine for a fixture; under-redacting is not.
const SENSITIVE_LABEL = /নাম|name|পিতা|স্বামী|father|husband|ঠিকানা|address|মোবাইল|mobile|phone|ইমেইল|email|এনআইডি|nid|অফিস|office|ফিডার|feeder|স্থাপন|install/i
const NUMBER_LABEL = /মিটার\s*(নম্বর|নং)|meter\s*(no|number)|গ্রাহক\s*(নম্বর|নং)|কনজ্যুমার|(customer|consumer)\s*(no|number)/i
const SENSITIVE_ATTR = /customer|name|address|mobile|phone|meter|account|cust|consumer|order|seq|organization|office|feeder/i
// NESCO puts each input inside the label's next sibling, several label/input pairs per row.
// With no sibling match, take every input in the parent: over-redaction is the safe failure.
const inputsFor = ($, label) => {
  const next = $(label).next()
  const own = next.is("input") ? next : next.find("input")
  return own.length ? own : $(label).parent().find("input")
}

const ascii = (s) => s.replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d))
const bangla = (s) => s.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d])
// every way a value can appear once cheerio serializes it
const escaped = (s) => s.replace(/&/g, "&amp;").replace(/ /g, "&nbsp;")
const forms = (s) => [...new Set([s, bangla(s), escaped(s), escaped(s).replace(/"/g, "&quot;"), escaped(s).replace(/</g, "&lt;").replace(/>/g, "&gt;")])]

const get = await fetch(PORTAL, { headers: HEADERS, signal: AbortSignal.timeout(25000) })
if (!get.ok) throw new Error(`GET ${get.status}`)
const panel = await get.text()
const cookie = (get.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ")
const csrf = (panel.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i) ||
  panel.match(/name=["']_token["']\s+value=["']([^"']+)["']/i))?.[1]
if (!csrf) throw new Error("No CSRF token")

const post = (submit) =>
  fetch(PORTAL, {
    method: "POST",
    headers: {
      ...HEADERS,
      "Cookie": cookie,
      "Referer": PORTAL,
      "Origin": "https://customer.nesco.gov.bd",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ _token: csrf, cust_no: meter, submit }).toString(),
    signal: AbortSignal.timeout(25000),
  })

mkdirSync(OUT, { recursive: true })

const pages = {}
for (const [file, submit] of [["recharge", "রিচার্জ হিস্ট্রি"], ["monthly", "মাসিক ব্যবহার"]]) {
  const res = await post(submit)
  if (!res.ok) throw new Error(`${file} POST ${res.status}`)
  pages[file] = await res.text()
  writeFileSync(`${OUT}/${file}.raw.html`, pages[file])
}

const downloads = []
for (const [kind, submit] of [
  ["certificate", "সার্টিফিকেট ডাউনলোড করুন"],
  ["recharge", "রিচার্জ হিস্ট্রি ডাউনলোড করুন"],
  ["monthly", "মাসিক ব্যবহার ডাউনলোড করুন"],
]) {
  const res = await post(submit)
  const body = await res.arrayBuffer() // size only; PDF bodies are never saved
  downloads.push({ kind, status: res.status, contentType: res.headers.get("content-type"), bytes: body.byteLength })
}
writeFileSync(`${OUT}/downloads.json`, JSON.stringify(downloads, null, 2) + "\n")

// Collect the private values from every page first, so a value seen on one page is removed from all.
const secrets = new Map([[meter, "12345678"]])
const labels = []
for (const html of Object.values(pages)) {
  const $ = cheerio.load(html)
  $("#con_info_div label").each((_, el) => {
    const label = $(el).text().replace(/\s+/g, " ").trim()
    if (!labels.includes(label)) labels.push(label)
    const replacement = NUMBER_LABEL.test(label) ? "12345678" : SENSITIVE_LABEL.test(label) ? "REDACTED" : null
    if (!replacement) return
    inputsFor($, el).each((__, input) => {
      const value = String($(input).val() || "").trim()
      if (value.length >= 3) secrets.set(replacement === "12345678" ? ascii(value) : value, replacement)
    })
  })
  $("[data-customername]").each((_, el) => {
    const v = $(el).attr("data-customername")?.trim()
    if (v && v.length >= 3) secrets.set(v, "REDACTED")
  })
}

const fakeTokens = new Map()
const dataAttrs = new Set()
for (const [file, html] of Object.entries(pages)) {
  const $ = cheerio.load(html)
  $("script, style, noscript, meta, link, iframe").remove()
  $('input[name="_token"], input[name="cust_no"]').attr("value", "")
  $("#con_info_div label").each((_, el) => {
    const label = $(el).text()
    if (NUMBER_LABEL.test(label)) inputsFor($, el).attr("value", "12345678")
    else if (SENSITIVE_LABEL.test(label)) inputsFor($, el).attr("value", "REDACTED")
  })
  $("*").contents().filter((_, node) => node.type === "comment").remove()
  $("*").each((_, el) => {
    for (const attr of Object.keys(el.attribs || {})) {
      if (!attr.startsWith("data-")) continue
      dataAttrs.add(attr)
      if (attr === "data-salename" || attr === "data-token" || !SENSITIVE_ATTR.test(attr)) continue
      $(el).attr(attr, /order|seq/i.test(attr) ? "1" : "REDACTED")
    }
  })

  let out = $.html()
  for (const [secret, replacement] of [...secrets].sort((a, b) => b[0].length - a[0].length)) {
    for (const form of forms(secret)) out = out.split(form).join(replacement)
  }
  // 16–20 digit vending tokens → numbered fakes in the same format
  out = out.replace(/(?<![\d০-৯])[\d০-৯](?:[- ]?[\d০-৯]){15,19}(?![\d০-৯])/g, (token) => {
    const key = ascii(token).replace(/\D/g, "")
    if (!fakeTokens.has(key)) fakeTokens.set(key, String(fakeTokens.size + 1).padStart(key.length, "0"))
    const digits = [...fakeTokens.get(key)]
    return token.replace(/[\d০-৯]/g, () => digits.shift())
  })
  out = out.replace(/(?<!\d)(?:\+?88)?01[3-9]\d{8}(?!\d)/g, "01000000000")

  const leaked = [...secrets.keys()].filter((s) => s !== "12345678" && forms(s).some((f) => out.includes(f)))
  if (leaked.length) throw new Error(`${file}: ${leaked.length} private value(s) survived redaction; nothing written`)
  writeFileSync(`${OUT}/${file}.html`, out)
}

console.log("con_info_div labels:", labels)
console.log("data attributes:", [...dataAttrs].sort())
console.log("downloads:", downloads)
console.log("arrear div:", cheerio.load(pages.recharge)("#arrear_notice_div").attr("style") ?? "(no style or absent)",
  "present:", cheerio.load(pages.recharge)("#arrear_notice_div").length > 0)
