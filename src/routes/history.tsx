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
import { getMeterDataFn } from "@/features/nesco/nesco-server"
import type { NescoFetchResult, RechargeRecord } from "@/features/nesco/types"
import { formatBDT, toBanglaNumber, formatDateBangla, formatMonthBangla } from "@/lib/bangla"
import { History, Copy, Search, Check, Receipt, ShieldCheck } from "lucide-react"

export const Route = createFileRoute("/history")({
  component: HistoryPage,
})

function HistoryPage() {
  const [meterInput, setMeterInput] = React.useState("")
  const [data, setData] = React.useState<NescoFetchResult | null>(null)
  const [searchFilter, setSearchFilter] = React.useState("")
  const [selectedToken, setSelectedToken] = React.useState<RechargeRecord | null>(null)
  const [copiedToken, setCopiedToken] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleFetch = async (targetMeter?: string) => {
    const num = (targetMeter || meterInput).replace(/[^0-9]/g, "").trim()
    if (!num || num.length < 8) {
      toast.error("অনুগ্রহ করে ৮ থেকে ১১ ডিজিটের সঠিক মিটার বা গ্রাহক নম্বর দিন।")
      return
    }
    setIsLoading(true)
    try {
      const res = await getMeterDataFn({ data: { meterNumber: num } })
      setData(res)
      setMeterInput(num)
      toast.success("রিচার্জ ও ব্যবহারের তথ্য পাওয়া গেছে।")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "তথ্য লোড করতে ব্যর্থ হয়েছে।")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token.replace(/-/g, ""))
    setCopiedToken(true)
    toast.success("টোকেন নম্বর ক্লিপবোর্ডে কপি হয়েছে!")
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
              রিচার্জ ইতিহাস ও মাসিক ব্যবহার
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {data
              ? `নেসকো প্রি-পেইড গ্রাহক নং ${data.customerInfo.customerNumber} (${data.customerInfo.name})-এর অফিসিয়াল স্টেটমেন্ট`
              : "আপনার মিটার বা গ্রাহক নম্বর দিয়ে পূর্ববর্তী সকল রিচার্জ ও মাসিক ব্যবহার দেখুন"}
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
              placeholder="অন্য মিটার নম্বর"
              className="h-9 w-36 sm:w-44 text-xs font-mono"
              maxLength={11}
            />
            <Button type="submit" size="sm" disabled={isLoading} className="h-9 text-xs font-medium">
              {isLoading ? "লোড..." : "খুঁজুন"}
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
            <h2 className="text-xl font-bold tracking-tight">রিচার্জ ইতিহাস ও ২০ ডিজিটের টোকেন খুঁজুন</h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              আপনার ৮ থেকে ১১ সংখ্যার নেসকো মিটার বা গ্রাহক নম্বর প্রবেশ করিয়ে সরকারি ভেন্ডিং স্টেটমেন্ট ও মাসিক ব্যবহার দেখুন।
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
              placeholder="মিটার বা গ্রাহক নম্বর লিখুন"
              className="h-11 text-sm font-mono text-center tracking-wider"
              maxLength={11}
            />
            <Button type="submit" disabled={isLoading} className="h-11 px-6 text-sm font-medium w-full sm:w-auto">
              {isLoading ? "লোড হচ্ছে..." : "অনুসন্ধান"}
            </Button>
          </form>
        </Card>
      ) : (
        <Tabs defaultValue="recharges" className="space-y-4">
          <TabsList className="grid grid-cols-2 max-w-xs">
            <TabsTrigger value="recharges" className="text-xs">
              রিচার্জ ও টোকেন ({toBanglaNumber(data.rechargeHistory.length)})
            </TabsTrigger>
            <TabsTrigger value="consumption" className="text-xs">
              মাসিক ব্যবহার ({toBanglaNumber(data.monthlyUsage.length)})
            </TabsTrigger>
          </TabsList>

          {/* Recharges Tab */}
          <TabsContent value="recharges" className="space-y-4">
            <Card className="rounded-2xl border shadow-xs overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
                <div>
                  <CardTitle className="text-base font-bold">ভেন্ডিং লেনদেন ও রিচার্জ টোকেন</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    প্রতিটি সফল রিচার্জের ২০ ডিজিটের টোকেন কোড ও বিবিধ চার্জের বিবরণ
                  </CardDescription>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="টোকেন বা মাধ্যমে খুঁজুন..."
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
                        <TableHead className="w-12 text-xs font-semibold">ক্রম</TableHead>
                        <TableHead className="text-xs font-semibold">টোকেন নম্বর</TableHead>
                        <TableHead className="text-xs font-semibold">বিদ্যুৎ (kWh)</TableHead>
                        <TableHead className="text-xs font-semibold">টাকার পরিমাণ</TableHead>
                        <TableHead className="text-xs font-semibold">মাধ্যম</TableHead>
                        <TableHead className="text-xs font-semibold">তারিখ ও সময়</TableHead>
                        <TableHead className="text-xs font-semibold text-right">পদক্ষেপ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecharges.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                            কোনো রিচার্জ রেকর্ড পাওয়া যায়নি।
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecharges.map((r, i) => (
                          <TableRow key={r.id || i} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {toBanglaNumber(i + 1)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 font-mono text-xs font-medium tracking-wider">
                                <span>{r.token || "N/A"}</span>
                                {r.token && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6 text-muted-foreground hover:text-foreground"
                                    onClick={() => copyToClipboard(r.token)}
                                    title="টোকেন কপি করুন"
                                  >
                                    <Copy className="size-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-medium">
                              {toBanglaNumber(r.powerKwh)} kWh
                            </TableCell>
                            <TableCell className="text-xs font-bold text-foreground">
                              {formatBDT(r.amountBdt)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[11px] font-normal">
                                {r.via}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDateBangla(r.date)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2.5"
                                onClick={() => setSelectedToken(r)}
                              >
                                বিস্তারিত
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
                <CardTitle className="text-base font-bold">মাসিক বিদ্যুৎ ব্যবহার ও রিচার্জের খতিয়ান</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  নেসকো বিলিং সিস্টেমের সংরক্ষিত পূর্ববর্তী মাসের মোট খরচ ও বিদ্যুৎ পরিমাপ
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-xs font-semibold">বছর</TableHead>
                        <TableHead className="text-xs font-semibold">মাস</TableHead>
                        <TableHead className="text-xs font-semibold">মোট রিচার্জ</TableHead>
                        <TableHead className="text-xs font-semibold">প্রিপেইড ছাড় (Rebate)</TableHead>
                        <TableHead className="text-xs font-semibold">বিদ্যুৎ ব্যবহার</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.monthlyUsage.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                            কোনো মাসিক ব্যবহারের রেকর্ড নেই।
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.monthlyUsage.map((m, i) => (
                          <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-mono text-xs">{toBanglaNumber(m.year)}</TableCell>
                            <TableCell className="text-xs font-medium">
                              {formatMonthBangla(m.month)}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-foreground">
                              {formatBDT(m.rechargeBdt)}
                            </TableCell>
                            <TableCell className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              {formatBDT(m.discountBdt)}
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-primary">
                              {toBanglaNumber(m.usageKwh)} kWh
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
      )}

      {/* Token Details Dialog */}
      <Dialog open={Boolean(selectedToken)} onOpenChange={(open) => !open && setSelectedToken(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-5 text-primary" />
              ভেন্ডিং টোকেন ভাউচার
            </DialogTitle>
            <DialogDescription className="text-xs">
              নেসকো প্রিপেইড মিটার রিচার্জের বিস্তারিত ভেন্ডিং রসিদ
            </DialogDescription>
          </DialogHeader>

          {selectedToken && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-muted/60 border text-center space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  ২০ ডিজিট রিচার্জ টোকেন
                </span>
                <p className="font-mono text-lg font-extrabold tracking-widest text-primary py-1 select-all">
                  {selectedToken.token || "টোকেন কোড অপ্রাপ্য"}
                </p>
                {selectedToken.token && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 mt-1"
                    onClick={() => copyToClipboard(selectedToken.token)}
                  >
                    {copiedToken ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" />
                        কপি হয়েছে
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        টোকেন নম্বর কপি করুন
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border bg-card">
                  <span className="text-muted-foreground block text-[11px]">রিচার্জের পরিমাণ</span>
                  <span className="font-bold text-foreground text-sm">{formatBDT(selectedToken.amountBdt)}</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-card">
                  <span className="text-muted-foreground block text-[11px]">মোট বিদ্যুৎ</span>
                  <span className="font-bold text-foreground text-sm">{toBanglaNumber(selectedToken.powerKwh)} kWh</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-card">
                  <span className="text-muted-foreground block text-[11px]">পেমেন্ট মাধ্যম</span>
                  <span className="font-medium text-foreground">{selectedToken.via}</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-card">
                  <span className="text-muted-foreground block text-[11px]">তারিখ ও সময়</span>
                  <span className="font-medium text-foreground">{formatDateBangla(selectedToken.date)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="size-4 shrink-0" />
                <span>মিটারের কিপ্যাডে সরাসরি এই ২০ সংখ্যার টোকেনটি প্রবেশ করিয়ে এন্টার (↵) চাপুন।</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
