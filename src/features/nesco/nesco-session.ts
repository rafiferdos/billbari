const DEFAULT_PORTAL_URL = "https://customer.nesco.gov.bd/pre/panel"
const TIMEOUT_MS = 25000 // 25 seconds headroom for NESCO and tunnel response
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7",
  "Sec-Ch-Ua": '"Not-A.Brand";v="99", "Chromium";v="124", "Google Chrome";v="124"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
}

export const NESCO_SUBMIT = {
  recharge: "রিচার্জ হিস্ট্রি",
  monthly: "মাসিক ব্যবহার",
  certificate: "সার্টিফিকেট ডাউনলোড করুন",
  rechargePdf: "রিচার্জ হিস্ট্রি ডাউনলোড করুন",
  monthlyPdf: "মাসিক ব্যবহার ডাউনলোড করুন",
} as const

export interface NescoSession {
  portalUrl: string
  cookieHeader: string
  csrfToken: string
}

export function getPortalUrl(): string {
  const custom = process.env.NESCO_PROXY_URL || process.env.NESCO_PORTAL_URL
  return custom?.trim() || DEFAULT_PORTAL_URL
}

/** GET the panel to obtain session cookies and the CSRF token. */
export async function openNescoSession(): Promise<NescoSession> {
  const portalUrl = getPortalUrl()
  const res = await fetch(portalUrl, {
    headers: { ...BROWSER_HEADERS, "Cache-Control": "no-cache", "Pragma": "no-cache", "Sec-Fetch-Site": "none" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(
        "নেসকো পোর্টাল এক্সেস আটকে দিয়েছে (HTTP 403 Forbidden)। নেসকো সরকারি পোর্টাল শুধুমাত্র বাংলাদেশ থেকে সরাসরি এক্সেসযোগ্য। বিদেশি ক্লাউড সার্ভার (যেমন Vercel) থেকে জিও-ব্লকিং (Geo-blocking) থাকায় সরাসরি সংযোগ ব্লক হচ্ছে।"
      )
    }
    throw new Error(`নেসকো সরকারি পোর্টাল স্ট্যাটাস কোড: ${res.status}`)
  }

  const html = await res.text()
  const cookies = res.headers.getSetCookie()
  const csrfToken =
    (html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i) ||
      html.match(/name=["']_token["']\s+value=["']([^"']+)["']/i))?.[1] ?? ""
  if (!csrfToken) {
    throw new Error("নেসকো পোর্টাল থেকে CSRF টোকেন পাওয়া যায়নি।")
  }

  return { portalUrl, cookieHeader: cookies.map((c) => c.split(";")[0]).join("; "), csrfToken }
}

export async function postNescoForm(s: NescoSession, custNo: string, submit: string): Promise<Response> {
  return fetch(s.portalUrl, {
    method: "POST",
    headers: {
      ...BROWSER_HEADERS,
      "Cookie": s.cookieHeader,
      "Referer": s.portalUrl,
      "Content-Type": "application/x-www-form-urlencoded",
      "Origin": "https://customer.nesco.gov.bd",
      "Sec-Fetch-Site": "same-origin",
    },
    body: new URLSearchParams({ _token: s.csrfToken, cust_no: custNo, submit }).toString(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
}
