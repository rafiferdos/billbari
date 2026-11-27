import { afterEach, describe, expect, it, vi } from "vitest"
import {
  buildDownloadFilename,
  isPdfContentType,
  nescoDownloadHref,
  parseDownloadQuery,
} from "../src/features/nesco/downloads"
import { Route } from "../src/routes/api/nesco/download"

describe("parseDownloadQuery", () => {
  it("accepts a known kind and a Bangla-digit meter", () => {
    expect(parseDownloadQuery({ kind: "certificate", meter: "১২৩৪৫৬৭৮" })).toEqual({ ok: true, kind: "certificate", meter: "12345678" })
  })

  it.each([
    [{ kind: "passwords", meter: "12345678" }],
    [{ kind: null, meter: "12345678" }],
    [{ kind: "certificate", meter: "1234" }],
    [{ kind: "certificate", meter: "123456789012" }],
    [{ kind: "certificate", meter: null }],
    // header injection attempt: only digits may reach the filename and the portal
    [{ kind: "certificate", meter: "12345678\r\nX-Evil: 1" }],
  ])("rejects %o", (query) => {
    expect(parseDownloadQuery(query).ok).toBe(false)
  })
})

describe("download helpers", () => {
  it("recognises PDF responses only", () => {
    expect(isPdfContentType("application/pdf; charset=binary")).toBe(true)
    expect(isPdfContentType("text/html")).toBe(false)
    expect(isPdfContentType(null)).toBe(false)
  })

  it("builds the filename and link", () => {
    expect(buildDownloadFilename("monthly", "12345678")).toBe("billbari-monthly-12345678.pdf")
    expect(nescoDownloadHref("recharge", "12345678")).toBe("/api/nesco/download?kind=recharge&meter=12345678")
  })
})

describe("GET /api/nesco/download", () => {
  afterEach(() => vi.unstubAllGlobals())

  const get = (query: string) =>
    (Route.options.server!.handlers as { GET: (c: { request: Request }) => Promise<Response> }).GET({
      request: new Request(`http://localhost/api/nesco/download${query}`),
    })
  const panel = () => new Response('<meta name="csrf-token" content="t">')

  it("answers 400 to a bad query without calling NESCO", async () => {
    const network = vi.fn()
    vi.stubGlobal("fetch", network)
    expect((await get("?kind=certificate&meter=1")).status).toBe(400)
    expect(network).not.toHaveBeenCalled()
  })

  it("never asks NESCO for a sample meter's documents", async () => {
    const network = vi.fn()
    vi.stubGlobal("fetch", network)
    expect((await get("?kind=certificate&meter=12345678")).status).toBe(404)
    expect(network).not.toHaveBeenCalled()
  })

  it("streams the PDF as an uncached attachment", async () => {
    const network = vi.fn()
      .mockResolvedValueOnce(panel())
      .mockResolvedValueOnce(new Response("%PDF-1.4", { headers: { "content-type": "application/pdf" } }))
    vi.stubGlobal("fetch", network)
    const res = await get("?kind=monthly&meter=99999999")
    expect(res.status).toBe(200)
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="billbari-monthly-99999999.pdf"')
    expect(res.headers.get("cache-control")).toBe("no-store")
    expect(await res.text()).toBe("%PDF-1.4")
    expect(new URLSearchParams(network.mock.calls[1][1].body).get("submit")).toBe("মাসিক ব্যবহার ডাউনলোড করুন")
  })

  it("answers 502 when NESCO returns a page instead of a PDF", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(panel())
      .mockResolvedValueOnce(new Response("<html>", { headers: { "content-type": "text/html" } })))
    const res = await get("?kind=certificate&meter=99999999")
    expect(res.status).toBe(502)
    expect((await res.json()).error).toContain("PDF")
  })

  it("answers 502 with a Bangla message when the portal cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")))
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const res = await get("?kind=certificate&meter=99999999")
    expect(res.status).toBe(502)
    expect((await res.json()).error).toContain("PDF")
  })
})
