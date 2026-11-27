import { existsSync, readFileSync } from "node:fs"
import * as cheerio from "cheerio"
import { afterEach, describe, expect, it, vi } from "vitest"
import { toNum } from "../src/features/nesco/parse-utils"
import {
  fetchNescoData,
  parseConsumptionTable,
  parseCustomerInfo,
  parseRechargeTable,
} from "../src/features/nesco/nesco-service"

const info = (rows: [string, string][], extra = "") =>
  `<div id="con_info_div">${rows.map(([l, v]) => `<div class="form-group"><label>${l}</label><input class="form-control" value="${v}"></div>`).join("")}</div>${extra}`

// The live portal's layout: several pairs per row, each input inside the label's next sibling.
const portalRow = (rows: [string, string][]) =>
  `<div id="con_info_div"><div class="form-group row">${rows.map(([l, v]) => `<label>${l}</label><div class="col-md-2"><input class="form-control" value="${v}"></div>`).join("")}</div></div>`

describe("parseCustomerInfo", () => {
  it("maps known labels and keeps every field in order", () => {
    const c = parseCustomerInfo(cheerio.load(info([["গ্রাহকের নাম", "TEST"], ["ফিডার", "F-1"], ["অনুমোদিত লোড", "3"], ["অবশিষ্ট ব্যালেন্স", "1,234.50"], ["ব্যালেন্স আপডেটের সময়", "27-11-2026 01:00"]])), "12345678")
    expect(c.name).toBe("TEST")
    expect(c.feederName).toBe("F-1")
    expect(c.approvedLoadKw).toBe(3)
    expect(c.balance).toBe(1234.5)
    expect(c.balanceUpdatedAt).toBe("27-11-2026 01:00")
    expect(c.fields.map((f) => f.label)).toEqual(["গ্রাহকের নাম", "ফিডার", "অনুমোদিত লোড", "অবশিষ্ট ব্যালেন্স", "ব্যালেন্স আপডেটের সময়"])
  })

  it("pairs each label with its own input when a row holds several", () => {
    const c = parseCustomerInfo(cheerio.load(portalRow([["সংশ্লিষ্ট বিদ্যুৎ অফিস", "OFFICE"], ["ফিডারের নাম", " FEEDER "], ["কনজ্যুমার নম্বর", "99887766"], ["মিটার নম্বর", "11223344"], ["অনুমোদিত ট্যারিফ", "LT-E"]])), "11223344")
    expect(c).toMatchObject({ electricityOffice: "OFFICE", feederName: "FEEDER", customerNumber: "99887766", meterNumber: "11223344", tariff: "LT-E" })
  })

  it("reads the balance and its time when NESCO puts both in one label", () => {
    const c = parseCustomerInfo(cheerio.load(portalRow([["মিনিমাম রিচার্জের পরিমাণ (টাকা)", "105"], ["অবশিষ্ট ব্যালেন্স (টাকা)(সময়ঃ 27 November 2026 12:00:00 AM )", " 412.50 "]])), "12345678")
    expect(c.balance).toBe(412.5)
    expect(c.balanceUpdatedAt).toBe("27 November 2026 12:00:00 AM")
  })

  it("arrear notice: hidden → null, visible → text", () => {
    expect(parseCustomerInfo(cheerio.load(info([], `<div id="arrear_notice_div" style="display:none">x</div>`)), "1").arrearNotice).toBeNull()
    expect(parseCustomerInfo(cheerio.load(info([], `<div id="arrear_notice_div" style="color:red; display: none;">x</div>`)), "1").arrearNotice).toBeNull()
    expect(parseCustomerInfo(cheerio.load(info([], `<div id="arrear_notice_div">  বকেয়া ৳৫০০  </div>`)), "1").arrearNotice).toBe("বকেয়া ৳৫০০")
  })

  it("never throws on an empty page", () => {
    const c = parseCustomerInfo(cheerio.load("<html></html>"), "12345678")
    expect(c.meterNumber).toBe("12345678")
    expect(c.balance).toBe(0)
    expect(c.fields).toEqual([])
    expect(parseRechargeTable(cheerio.load("<html></html>"))).toEqual([])
    expect(parseConsumptionTable(cheerio.load("<html></html>"))).toEqual([])
  })
})

describe("parseRechargeTable", () => {
  it("reads receipt data attributes and prefers data-token", () => {
    const cells = ["1", `<a class="consumerRechargeData" data-token="1111-2222-3333-4444-5555" data-order="77" data-salename="bKash" data-seq="">0000-0000-0000-0000-0000</a>`, "40", "168", "0", "38.1", "0", "-3.81", "557.71", "800", "59.65", "BKASH", "15-NOV-2026 2:15 PM", "Success"]
    const [record] = parseRechargeTable(cheerio.load(`<table class="bfont_post"><tbody><tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr></tbody></table>`))
    expect(record.token).toBe("1111-2222-3333-4444-5555")
    expect(record.receipt).toEqual({ orderNo: "77", saleName: "bKash" })
    expect(record.amountBdt).toBe(800)
    expect(record.netEnergyBdt).toBe(557.71)
  })
})

describe("multi-token vends", () => {
  it("lists every token without NESCO's inline markup", () => {
    const cells = ["1", `<a class="consumerRechargeData" data-token="1111-2222-3333-4444-5555,&lt;br&gt;6666-7777-8888-9999-0000">x</a>`, "0", "0", "0", "0", "0", "0", "900", "1000"]
    const [record] = parseRechargeTable(cheerio.load(`<table class="bfont_post"><tbody><tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr></tbody></table>`))
    expect(record.token).toBe("1111-2222-3333-4444-5555, 6666-7777-8888-9999-0000")
  })
})

describe("toNum", () => {
  it("handles Bangla digits, commas and junk", () => {
    expect(toNum("১,২৩৪.৫০")).toBe(1234.5)
    expect(toNum("৳ -12.5 ")).toBe(-12.5)
    expect(toNum("")).toBe(0)
    expect(toNum(undefined)).toBe(0)
  })
})

describe("fetchNescoData", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("serves built-in sample meters without calling the portal", async () => {
    const network = vi.fn()
    vi.stubGlobal("fetch", network)
    for (const meter of ["12345678", "11019842510"]) {
      expect((await fetchNescoData(meter)).dataSource).toBe("sample_demo")
    }
    expect(network).not.toHaveBeenCalled()
  })

  it("keeps the Bangla error when the portal blocks the request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 403 })))
    vi.spyOn(console, "warn").mockImplementation(() => {})
    await expect(fetchNescoData("99999999")).rejects.toThrow("HTTP 403 Forbidden")
  })
})

const fixture = (name: string) => new URL(`./fixtures/nesco/${name}.html`, import.meta.url)
const hasFixtures = existsSync(fixture("recharge")) && existsSync(fixture("monthly"))

describe.skipIf(!hasFixtures)("real fixtures", () => {
  const load = (name: string) => cheerio.load(readFileSync(fixture(name), "utf8"))

  it("parses every customer field under its own key", () => {
    const c = parseCustomerInfo(load("recharge"), "12345678")
    expect(c.fields).toHaveLength(15)
    expect(c).toMatchObject({
      name: "REDACTED", address: "REDACTED", electricityOffice: "REDACTED", feederName: "REDACTED",
      meterNumber: "12345678", customerNumber: "12345678", approvedLoadKw: 4, tariff: "LT-A",
      balance: 412.5, balanceUpdatedAt: "27 November 2026 12:00:00 AM", arrearNotice: null,
    })
  })

  it("parses recharges and months", () => {
    const recharges = parseRechargeTable(load("recharge"))
    expect(recharges).toHaveLength(101)
    expect(recharges.every((r) => r.token.split(", ").every((t) => /^\d{4}(-\d{4}){4}$/.test(t)))).toBe(true)
    expect(recharges[0]).toMatchObject({
      amountBdt: 1800, netEnergyBdt: 1722.86, powerKwh: 184.26, vat: 85.71, subsidy: -8.57,
      via: "ROCKET", date: "17-NOV-2026 7:14 PM", status: "Unsend",
      receipt: { totalAmount: "1800", purchaseEnergy: "184.26", saleName: "ROCKET" },
    })
    const months = parseConsumptionTable(load("monthly"))
    expect(months.length).toBeGreaterThan(0)
    expect(months.every((m) => m.usageKwh >= 0)).toBe(true)
    expect(months[0]).toMatchObject({ year: "2026", month: "October", rechargeBdt: 2600, usageKwh: 156.27, totalBillBdt: 1644.48, monthEndBalance: 1235.75, vat: 123.81 })
  })
})
