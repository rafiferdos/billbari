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
import { getSampleMeterData } from "@/features/nesco/sample-data"
import type { NescoFetchResult, RechargeRecord } from "@/features/nesco/types"
import { formatBDT, toBanglaNumber, formatDateBangla, formatMonthBangla } from "@/lib/bangla"
import { History, Copy, Search, Check, Receipt, Zap, ShieldCheck } from "lucide-react"

export const Route = createFileRoute("/history")({
  component: HistoryPage,
})

function HistoryPage() {
  const [meterInput, setMeterInput] = React.useState("12345678")
  const [data, setData] = React.useState<NescoFetchResult>(() => getSampleMeterData("12345678"))
  const [searchFilter, setSearchFilter] = React.useState("")
  const [selectedToken, setSelectedToken] = React.useState<RechargeRecord | null>(null)
  const [copiedToken, setCopiedToken] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleFetch = async (targetMeter?: string) => {
    const num = (targetMeter || meterInput).replace(/[^0-9]/g, "").trim()
    if (!num) return
    setIsLoading(true)
    try {
      const res = await getMeterDataFn({ data: { meterNumber: num } })
      setData(res)
      setMeterInput(num)
      toast.success("রিচার্জ ও ব্যবহারের তথ্য হালনাগাদ করা হয়েছে।")
    } catch {
      toast.error("তথ্য লোড করতে ব্যর্থ হয়েছে।")
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
    if (!searchFilter.trim()) return data.rechargeHistory
    const q = searchFilter.toLowerCase()
    return data.rechargeHistory.filter(
      (r) =>
        r.token.toLowerCase().includes(q) ||
        r.via.toLowerCase().includes(q) ||
        r.date.toLowerCase().includes(q) ||
        String(r.amountBdt).includes(q)
    )
  }, [data.rechargeHistory, searchFilter])

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
            নেসকো প্রি-পেইড গ্রাহক নং {data.customerInfo.customerNumber} ({data.customerInfo.name})-এর অফিসিয়াল স্টেটমেন্ট
          </p>
        </div>

        {/* Quick Meter Selector */}
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
            placeholder="মিটার নম্বর"
            className="h-9 w-36 sm:w-44 text-xs font-mono"
            maxLength={11}
          />
          <Button type="submit" size="sm" disabled={isLoading} className="h-9 text-xs font-medium">
            {isLoading ? "লোড..." : "খুঁজুন"}
          </Button>
        </form>
      </div>

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
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="টোকেন বা মাধ্যম খুঁজুন..."
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>নং</TableHead>
                      <TableHead>তারিখ ও সময়</TableHead>
                      <TableHead>রিচার্জ অর্থ (৳)</TableHead>
                      <TableHead>বিদ্যুৎ ইউনিট (kWh)</TableHead>
                      <TableHead>মাধ্যম (Channel)</TableHead>
                      <TableHead>২০ ডিজিট টোকেন</TableHead>
                      <TableHead className="text-right">বিস্তারিত ভাউচার</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecharges.map((item, index) => (
                      <TableRow key={item.id} className="text-xs hover:bg-muted/40">
                        <TableCell className="font-mono text-muted-foreground">
                          {toBanglaNumber(index + 1)}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatDateBangla(item.date)}
                        </TableCell>
                        <TableCell className="font-bold text-foreground">
                          {formatBDT(item.amountBdt)}
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          {toBanglaNumber(item.powerKwh)} kWh
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-normal uppercase">
                            {item.via}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded-md font-mono select-all">
                            {item.token}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-medium gap-1"
                            onClick={() => setSelectedToken(item)}
                          >
                            <Receipt className="size-3 text-primary" />
                            <span>ভাউচার</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
              <CardTitle className="text-base font-bold">প্রতি মাসের বিদ্যুৎ ব্যবহারের হিসাব ও তালিকা</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                নেসকো সেন্ট্রাল ডাটাবেজে থাকা প্রতি মাসের রিচার্জ ও মোট বিদ্যুৎ ইউনিটের (kWh) হিসাব
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>সাল</TableHead>
                      <TableHead>মাস</TableHead>
                      <TableHead>মোট বিদ্যুৎ ব্যয় (kWh)</TableHead>
                      <TableHead>রিচার্জ অর্থ (৳)</TableHead>
                      <TableHead>প্রিপেইড রিবেট / ডিসকাউন্ট (৳)</TableHead>
                      <TableHead className="text-right">গড় রেট (৳/kWh)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.monthlyUsage.map((m) => {
                      const effectiveRate =
                        m.usageKwh > 0 ? Math.round((m.rechargeBdt / m.usageKwh) * 100) / 100 : 0
                      return (
                        <TableRow key={`${m.year}-${m.month}`} className="text-xs hover:bg-muted/40">
                          <TableCell className="font-semibold text-foreground">
                            {toBanglaNumber(m.year)}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {formatMonthBangla(m.month)}
                          </TableCell>
                          <TableCell className="font-bold text-primary">
                            {toBanglaNumber(m.usageKwh)} kWh
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {formatBDT(m.rechargeBdt)}
                          </TableCell>
                          <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {m.discountBdt ? formatBDT(Math.abs(m.discountBdt)) : "৳০.০০"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {effectiveRate > 0 ? formatBDT(effectiveRate) : "-"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Token Details Voucher Modal */}
      <Dialog open={!!selectedToken} onOpenChange={(open) => !open && setSelectedToken(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedToken && (
            <>
              <DialogHeader className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Zap className="size-4" />
                  </span>
                  <DialogTitle className="text-base font-bold">
                    নেসকো প্রিপেইড ভেন্ডিং টোকেন
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  গ্রাহক: {data.customerInfo.name} | মিটার: {data.customerInfo.meterNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* 20 Digit Code Box */}
                <div className="p-4 rounded-2xl bg-muted/70 border border-border text-center space-y-2">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    মিটারে প্রবেশ করানোর ২০ ডিজিটের টোকেন কোড:
                  </span>
                  <div className="text-lg sm:text-xl font-mono font-extrabold tracking-wider text-primary select-all">
                    {selectedToken.token}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-semibold gap-1.5 mt-1"
                    onClick={() => copyToClipboard(selectedToken.token)}
                  >
                    {copiedToken ? (
                      <>
                        <Check className="size-3 text-emerald-500" />
                        <span>কপি সম্পন্ন!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>টোকেন কপি করুন</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Voucher Cost Breakdown */}
                <div className="rounded-xl border border-border p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">রিচার্জ অর্থ (Gross Amount):</span>
                    <span className="font-bold">{formatBDT(selectedToken.amountBdt)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">বিদ্যুৎ ইউনিট (Energy Purchased):</span>
                    <span className="font-bold text-primary">{toBanglaNumber(selectedToken.powerKwh)} kWh</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">মিটার ভাড়া (Meter Rent):</span>
                    <span>{formatBDT(selectedToken.rent || 40)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">ডিমান্ড চার্জ (Demand Charge):</span>
                    <span>{formatBDT(selectedToken.demandCharge || 84)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">সরকারি ভ্যাট (VAT 5%):</span>
                    <span>{formatBDT(selectedToken.vat || selectedToken.amountBdt * 0.05)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>প্রিপেইড রিবেট / ছাড় (Rebate 1%):</span>
                    <span>-{formatBDT(selectedToken.subsidy || 10)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border font-bold text-sm">
                    <span>পেমেন্ট মাধ্যম:</span>
                    <span className="uppercase text-primary">{selectedToken.via}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-primary shrink-0" />
                  <span>টোকেনটি আপনার মিটারের কিপ্যাডে টাইপ করে এন্টার চাপুন।</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
