import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useMeter } from "@/features/meter/meter-context"
import { useLanguage } from "@/features/i18n/language-context"
import { SourceBanner } from "@/features/nesco/source-badge"
import type { RechargeRecord } from "@/features/nesco/types"
import { formatMonthBangla } from "@/lib/bangla"
import { History, Copy, Search, Check, Receipt, ShieldCheck } from "lucide-react"

export const Route = createFileRoute("/history")({
  component: HistoryPage,
})

/**
 * Compacts a token string for table display (e.g., "0135 •••• 6712")
 * to prevent long multi-tokens from pushing table columns.
 */
function compactToken(token: string | null | undefined, isBangla = true): string {
  if (!token) return isBangla ? "টোকেন অপ্রাপ্য" : "Token Unavailable"
  const clean = token.replace(/[^0-9A-Za-z-]/g, "").trim()
  if (clean.length <= 14) return clean
  const first = clean.slice(0, 4)
  const last = clean.slice(-4)
  return `${first} •••• ${last}`
}

/**
 * Splits multi-token sequences (e.g. key revision tokens + recharge tokens)
 */
function extractTokenList(rawToken: string | null | undefined): string[] {
  if (!rawToken) return []
  const clean = rawToken.trim()
  const parts = clean.split(/[\s,/;\n]+/).filter(Boolean)
  if (parts.length > 1) {
    return parts
  }
  const onlyDigits = clean.replace(/[^0-9]/g, "")
  if (onlyDigits.length >= 40 && onlyDigits.length % 20 === 0) {
    const chunks: string[] = []
    for (let i = 0; i < onlyDigits.length; i += 20) {
      const chunk = onlyDigits.slice(i, i + 20)
      const formatted = chunk.match(/.{1,4}/g)?.join("-") || chunk
      chunks.push(formatted)
    }
    return chunks
  }
  return [clean]
}

function HistoryPage() {
  const {
    activeMeter,
    activeMeterData: data,
    isLoading,
    fetchMeter,
  } = useMeter()
  const { t, isBangla, formatBDT, formatNumber, formatDate } = useLanguage()

  const [meterInput, setMeterInput] = React.useState(activeMeter)
  const [searchFilter, setSearchFilter] = React.useState("")
  const [selectedToken, setSelectedToken] = React.useState<RechargeRecord | null>(null)
  const [copiedToken, setCopiedToken] = React.useState(false)
  const lastFetchedMeterRef = React.useRef<string>("")

  // Keep meterInput synchronized with activeMeter
  React.useEffect(() => {
    if (activeMeter) {
      setMeterInput(activeMeter)
    }
  }, [activeMeter])

  // Automatically fetch once if activeMeter is set but data not yet loaded
  React.useEffect(() => {
    if (activeMeter && !data && !isLoading && lastFetchedMeterRef.current !== activeMeter) {
      lastFetchedMeterRef.current = activeMeter
      fetchMeter(activeMeter, { silent: true })
    }
  }, [activeMeter, data, isLoading, fetchMeter])

  const handleFetch = async (targetMeter?: string) => {
    const num = (targetMeter || meterInput).replace(/[^0-9]/g, "").trim()
    if (!num || num.length < 8) {
      toast.error(
        isBangla
          ? "অনুগ্রহ করে ৮ থেকে ১১ ডিজিটের সঠিক মিটার বা গ্রাহক নম্বর দিন।"
          : "Please enter a valid 8 to 11 digit meter or customer ID."
      )
      return
    }
    setMeterInput(num)
    await fetchMeter(num, { force: true })
  }

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token.replace(/-/g, ""))
    setCopiedToken(true)
    toast.success(isBangla ? "টোকেন নম্বর ক্লিপবোর্ডে কপি হয়েছে!" : "Token copied to clipboard!")
    setTimeout(() => setCopiedToken(false), 2000)
  }

  // Filter recharges by search
  const filteredRecharges = React.useMemo(() => {
    if (!data) return []
    if (!searchFilter.trim()) return data.rechargeHistory
    const q = searchFilter.toLowerCase()
    return data.rechargeHistory.filter(
      (r) =>
        r.token.toLowerCase().includes(q) ||
        r.via.toLowerCase().includes(q) ||
        r.date.toLowerCase().includes(q) ||
        String(r.amountBdt).includes(q)
    )
  }, [data, searchFilter])

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <History className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t.history.title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {data
              ? data.dataSource === "sample_demo"
                ? isBangla
                  ? "নমুনা রেফারেন্স ডেটা — আসল মিটার স্টেটমেন্ট নয়"
                  : "Sample reference data — not a real meter statement"
                : isBangla
                ? `নেসকো প্রি-পেইড গ্রাহক নং ${formatNumber(data.customerInfo.customerNumber)} (${data.customerInfo.name})-এর অফিসিয়াল স্টেটমেন্ট`
                : `Official statement for NESCO customer #${formatNumber(data.customerInfo.customerNumber)} (${data.customerInfo.name})`
              : t.history.subtitle}
          </p>
        </div>

        {/* Quick Meter Selector */}
        {data && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleFetch()
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={meterInput}
              onChange={(e) => setMeterInput(e.target.value)}
              placeholder={isBangla ? "অন্য মিটার নম্বর" : "Other meter ID"}
              className="h-9 w-36 sm:w-44 text-xs font-mono"
              maxLength={11}
            />
            <Button type="submit" size="sm" disabled={isLoading} className="h-9 text-xs font-medium">
              {isLoading ? (isBangla ? "লোড..." : "Loading...") : (isBangla ? "খুঁজুন" : "Search")}
            </Button>
          </form>
        )}
      </div>

      {!data ? (
        <Card className="rounded-2xl border border-dashed p-8 sm:p-12 text-center space-y-6">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
            <Search className="size-7" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-bold tracking-tight">
              {isBangla ? "রিচার্জ ইতিহাস ও ২০ ডিজিটের টোকেন খুঁজুন" : "Inspect Recharge History & 20-Digit Tokens"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t.history.emptyNotice}
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleFetch()
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto"
          >
            <Input
              value={meterInput}
              onChange={(e) => setMeterInput(e.target.value)}
              placeholder={t.hero.meterInputPlaceholder}
              className="h-11 text-sm font-mono text-center tracking-wider"
              maxLength={11}
            />
            <Button type="submit" disabled={isLoading} className="h-11 px-6 text-sm font-medium w-full sm:w-auto">
              {isLoading ? t.common.loading : t.hero.searchButton}
            </Button>
          </form>
        </Card>
      ) : (
        <>
          <SourceBanner
            data={data}
            onRefresh={() => handleFetch(data.customerInfo.meterNumber)}
          />
          <Tabs defaultValue="recharges" className="space-y-4">
          <TabsList className="grid grid-cols-2 max-w-xs">
            <TabsTrigger value="recharges" className="text-xs">
              {isBangla
                ? `রিচার্জ ও টোকেন (${formatNumber(data.rechargeHistory.length)})`
                : `Recharges & Tokens (${formatNumber(data.rechargeHistory.length)})`}
            </TabsTrigger>
            <TabsTrigger value="consumption" className="text-xs">
              {isBangla
                ? `মাসিক ব্যবহার (${formatNumber(data.monthlyUsage.length)})`
                : `Monthly Usage (${formatNumber(data.monthlyUsage.length)})`}
            </TabsTrigger>
          </TabsList>

          {/* Recharges Tab */}
          <TabsContent value="recharges" className="space-y-4">
            <Card className="rounded-2xl border shadow-xs overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
                <div>
                  <CardTitle className="text-base font-bold">
                    {isBangla ? "ভেন্ডিং লেনদেন ও রিচার্জ টোকেন" : "Vending Transactions & Tokens"}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {isBangla
                      ? "প্রতিটি সফল রিচার্জের ২০ ডিজিটের টোকেন কোড ও বিবিধ চার্জের বিবরণ"
                      : "20-digit token keys and deduction breakdown for every verified transaction"}
                  </CardDescription>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder={t.history.searchPlaceholder}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-12 text-xs font-semibold">#</TableHead>
                        <TableHead className="text-xs font-semibold max-w-[140px]">
                          {isBangla ? "টোকেন (ট্যাপে কপি)" : "Token (Tap to Copy)"}
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          {isBangla ? "বিদ্যুৎ (kWh)" : "Power (kWh)"}
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          {isBangla ? "টাকার পরিমাণ" : "Recharge Amount"}
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          {isBangla ? "মাধ্যম" : "Channel"}
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          {isBangla ? "তারিখ ও সময়" : "Date & Time"}
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right">
                          {isBangla ? "পদক্ষেপ" : "Action"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecharges.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                            {t.history.noRecords}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecharges.map((r, i) => (
                          <TableRow
                            key={r.id || i}
                            onClick={() => setSelectedToken(r)}
                            className="hover:bg-muted/50 cursor-pointer transition-colors group select-none"
                            title={isBangla ? "বিস্তারিত ভাউচার দেখতে ক্লিক করুন" : "Click to view full voucher"}
                          >
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {formatNumber(i + 1)}
                            </TableCell>
                            <TableCell className="max-w-[140px] py-2.5">
                              <div className="flex items-center gap-1.5">
                                {r.token ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      copyToClipboard(r.token)
                                    }}
                                    title={isBangla ? "ট্যাপ করে টোকেন কপি করুন" : "Tap to copy token"}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/80 hover:bg-primary/10 hover:text-primary transition-all font-mono text-xs font-semibold border border-border/80 hover:border-primary/40 cursor-pointer text-left shadow-2xs"
                                  >
                                    <span>{compactToken(r.token, isBangla)}</span>
                                    <Copy className="size-3 text-muted-foreground group-hover:text-primary shrink-0" />
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground px-2 py-0.5 rounded bg-muted/50">
                                    {isBangla ? "সরাসরি সমন্বয়" : "Direct Adjustment"}
                                  </span>
                                )}
                                {r.token && r.token.length > 25 && (
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-normal shrink-0">
                                    {isBangla ? "মাল্টি" : "Multi"}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-medium">
                              {formatNumber(r.powerKwh)} kWh
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="font-bold text-foreground font-mono">
                                {formatBDT(r.amountBdt)}
                              </div>
                              {r.netEnergyBdt && r.netEnergyBdt !== r.amountBdt ? (
                                <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  {isBangla ? "মিটারে:" : "Credited:"} {formatBDT(r.netEnergyBdt)}
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[11px] font-normal">
                                {r.via}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(r.date)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2.5 group-hover:border-primary/50 group-hover:bg-primary/5"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedToken(r)
                                }}
                              >
                                {isBangla ? "বিস্তারিত" : "Details"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consumption Tab */}
          <TabsContent value="consumption" className="space-y-4">
            <Card className="rounded-2xl border shadow-xs overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  {isBangla ? "মাসিক বিদ্যুৎ ব্যবহার ও রিচার্জের খতিয়ান" : "Monthly Consumption Ledger"}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isBangla
                    ? "নেসকো বিলিং সিস্টেমের সংরক্ষিত পূর্ববর্তী মাসের মোট খরচ ও বিদ্যুৎ পরিমাপ"
                    : "Historical energy units consumed and billed charges recorded in NESCO systems"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-xs font-semibold">{isBangla ? "বছর" : "Year"}</TableHead>
                        <TableHead className="text-xs font-semibold">{isBangla ? "মাস" : "Month"}</TableHead>
                        <TableHead className="text-xs font-semibold">{isBangla ? "মোট রিচার্জ" : "Gross Recharge"}</TableHead>
                        <TableHead className="text-xs font-semibold">{isBangla ? "প্রিপেইড ছাড় (Rebate)" : "1% Rebate"}</TableHead>
                        <TableHead className="text-xs font-semibold">{isBangla ? "বিদ্যুৎ ব্যবহার" : "Energy Consumed"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.monthlyUsage.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                            {isBangla ? "কোনো মাসিক ব্যবহারের রেকর্ড নেই।" : "No monthly usage records found."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.monthlyUsage.map((m, i) => (
                          <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-mono text-xs">{formatNumber(m.year)}</TableCell>
                            <TableCell className="text-xs font-medium">
                              {isBangla ? formatMonthBangla(m.month) : String(m.month).slice(0, 3)}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-foreground">
                              {formatBDT(m.rechargeBdt)}
                            </TableCell>
                            <TableCell className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              {formatBDT(m.discountBdt)}
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-primary">
                              {formatNumber(m.usageKwh)} kWh
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>
      )}

      {/* Token Details Dialog */}
      <Dialog open={Boolean(selectedToken)} onOpenChange={(open) => !open && setSelectedToken(null)}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-5 text-primary" />
              {isBangla ? "ভেন্ডিং টোকেন ভাউচার" : "Vending Token Voucher"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t.history.tokenDetailsDesc}
            </DialogDescription>
          </DialogHeader>

          {selectedToken && (
            <div className="space-y-4 pt-2">
              {/* Token Display with Tap to Copy & Multi-token support */}
              {(() => {
                const tokenList = extractTokenList(selectedToken.token)
                if (tokenList.length > 1) {
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">
                          {isBangla
                            ? `মোট ${formatNumber(tokenList.length)}টি রিচার্জ টোকেন (ক্রম অনুযায়ী মিটারে দিন)`
                            : `Total ${formatNumber(tokenList.length)} Tokens (Punch in order)`}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary gap-1"
                          onClick={() => copyToClipboard(tokenList.join(" "))}
                        >
                          <Copy className="size-3" />
                          <span>{isBangla ? "সব কপি" : "Copy All"}</span>
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {tokenList.map((tok, idx) => (
                          <div
                            key={idx}
                            onClick={() => copyToClipboard(tok)}
                            className="p-3 rounded-xl bg-muted/60 hover:bg-muted border flex items-center justify-between gap-2 cursor-pointer transition-colors group"
                            title={isBangla ? "কপি করতে ট্যাপ করুন" : "Tap to copy"}
                          >
                            <div>
                              <span className="text-[10px] text-muted-foreground font-semibold block">
                                {isBangla ? `টোকেন ${formatNumber(idx + 1)}` : `Token ${formatNumber(idx + 1)}`}
                              </span>
                              <span className="font-mono text-sm sm:text-base font-bold text-primary select-all break-all">
                                {tok}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(tok)
                              }}
                            >
                              <Copy className="size-3" />
                              <span>{isBangla ? "কপি" : "Copy"}</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    onClick={() => selectedToken.token && copyToClipboard(selectedToken.token)}
                    className="p-4 rounded-2xl bg-muted/60 hover:bg-muted/80 border text-center space-y-1.5 cursor-pointer transition-all active:scale-[0.99] group relative"
                    title={isBangla ? "টোকেন নম্বর কপি করতে ট্যাপ করুন" : "Tap to copy token"}
                  >
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                      <span>{isBangla ? "রিচার্জ টোকেন কোড" : "Recharge Token Code"}</span>
                      <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
                        {isBangla ? "ট্যাপ করে কপি করুন" : "Tap to copy"}
                      </span>
                    </div>
                    <p className="font-mono text-lg sm:text-xl font-extrabold tracking-widest text-primary py-1 select-all break-all">
                      {selectedToken.token || (isBangla ? "টোকেন কোড অপ্রাপ্য" : "Token Unavailable")}
                    </p>
                    {selectedToken.token && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 mt-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(selectedToken.token)
                        }}
                      >
                        {copiedToken ? (
                          <>
                            <Check className="size-3.5 text-emerald-500" />
                            {isBangla ? "কপি হয়েছে" : "Copied"}
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            {isBangla ? "টোকেন নম্বর কপি করুন" : "Copy Token Code"}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )
              })()}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border bg-card">
                  <span className="text-muted-foreground block text-[11px]">{isBangla ? "রিচার্জের পরিমাণ" : "Recharge Deposit"}</span>
                  <span className="font-bold text-foreground text-sm font-mono">{formatBDT(selectedToken.amountBdt)}</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-card">
                  <span className="text-muted-foreground block text-[11px]">{isBangla ? "মিটারে যুক্ত বিদ্যুৎ টাকা" : "Net Power Credited"}</span>
                  <span className="font-bold text-primary text-sm font-mono">
                    {formatBDT(selectedToken.netEnergyBdt || selectedToken.amountBdt)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border bg-card">
                  <span className="text-muted-foreground block text-[11px]">{isBangla ? "প্রাপ্ত বিদ্যুৎ" : "Power Units"}</span>
                  <span className="font-bold text-foreground text-sm">{formatNumber(selectedToken.powerKwh)} kWh</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-card">
                  <span className="text-muted-foreground block text-[11px]">{isBangla ? "পেমেন্ট মাধ্যম" : "Channel"}</span>
                  <span className="font-medium text-foreground">{selectedToken.via}</span>
                </div>
              </div>

              {(selectedToken.rent || selectedToken.demandCharge || selectedToken.vat) ? (
                <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    {isBangla ? "সরকারি ও নিয়মিত কর্তন বিবরণী:" : "Deduction Telemetry:"}
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    {selectedToken.rent ? (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isBangla ? "মিটার রেন্ট:" : "Meter Rent:"}</span>
                        <span className="font-mono text-foreground">{formatBDT(selectedToken.rent)}</span>
                      </div>
                    ) : null}
                    {selectedToken.demandCharge ? (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isBangla ? "ডিমান্ড চার্জ:" : "Demand Charge:"}</span>
                        <span className="font-mono text-foreground">{formatBDT(selectedToken.demandCharge)}</span>
                      </div>
                    ) : null}
                    {selectedToken.vat ? (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isBangla ? "ভ্যাট (৫%):" : "VAT (5%):"}</span>
                        <span className="font-mono text-foreground">{formatBDT(selectedToken.vat)}</span>
                      </div>
                    ) : null}
                    {selectedToken.subsidy ? (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>{isBangla ? "১% সরকারি রেয়াত:" : "1% Rebate:"}</span>
                        <span className="font-mono font-bold">+{formatBDT(Math.abs(selectedToken.subsidy))}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="size-4 shrink-0" />
                <span>
                  {isBangla
                    ? "মিটারের কিপ্যাডে সরাসরি এই ২০ সংখ্যার টোকেনটি প্রবেশ করিয়ে এন্টার (↵) চাপুন।"
                    : "Punch this 20-digit key into your meter keypad and press the blue Enter (↵) key."}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
