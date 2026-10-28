import * as React from "react"
import { getMeterDataFn } from "@/features/nesco/nesco-server"
import { type NescoFetchResult } from "@/features/nesco/types"
import { recordRecentSearch } from "@/features/db/client-db"
import { toast } from "sonner"

export interface MeterContextType {
  activeMeter: string
  activeMeterData: NescoFetchResult | null
  isLoading: boolean
  error: string | null
  setActiveMeter: (meter: string) => void
  setMeterData: (data: NescoFetchResult | null) => void
  fetchMeter: (targetMeter?: string, options?: { silent?: boolean; force?: boolean }) => Promise<NescoFetchResult | null>
  clearActiveMeter: () => void
}

const MeterContext = React.createContext<MeterContextType | undefined>(undefined)

const STORAGE_KEY = "billbari_active_meter"

export function MeterProvider({ children }: { children: React.ReactNode }) {
  const [activeMeter, setActiveMeterState] = React.useState<string>("")
  const [activeMeterData, setActiveMeterData] = React.useState<NescoFetchResult | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)

  // Safe localStorage helper
  const setActiveMeter = React.useCallback((meter: string) => {
    const clean = meter.replace(/[^0-9]/g, "").trim()
    setActiveMeterState(clean)
    if (typeof window !== "undefined") {
      try {
        if (clean) {
          localStorage.setItem(STORAGE_KEY, clean)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [])

  const setMeterData = React.useCallback((data: NescoFetchResult | null) => {
    setActiveMeterData(data)
  }, [])

  const clearActiveMeter = React.useCallback(() => {
    setActiveMeterState("")
    setActiveMeterData(null)
    setError(null)
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }, [])

  const fetchMeter = React.useCallback(
    async (targetMeter?: string, options?: { silent?: boolean; force?: boolean }): Promise<NescoFetchResult | null> => {
      const num = (targetMeter || activeMeter).replace(/[^0-9]/g, "").trim()
      if (!num || num.length < 8) {
        if (!options?.silent) {
          toast.error("অনুগ্রহ করে ৮ থেকে ১১ ডিজিটের সঠিক মিটার বা গ্রাহক নম্বর দিন।")
        }
        return null
      }

      // If already loaded and not force, return cached
      if (!options?.force && activeMeterData && activeMeter === num) {
        return activeMeterData
      }

      setIsLoading(true)
      setError(null)

      try {
        const result = await getMeterDataFn({
          data: { meterNumber: num },
        })

        setActiveMeterState(num)
        setActiveMeterData(result)
        setError(null)

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY, num)
          } catch {
            // ignore
          }
        }

        // Record in client DB recent searches
        recordRecentSearch({
          meterNumber: num,
          customerNumber: result.customerInfo.customerNumber,
          searchedAt: new Date().toISOString(),
          label: result.customerInfo.name,
        })

        if (!options?.silent) {
          if (result.dataSource === "nesco_live") {
            toast.success("সরকারি নেসকো লাইভ পোর্টাল থেকে ডেটা পাওয়া গেছে!")
          } else {
            toast.info(result.statusMessage || "মিটার তথ্য লোড হয়েছে।")
          }
        }

        return result
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "মিটার তথ্য লোড করা সম্ভব হয়নি।"
        setError(msg)
        if (!options?.silent) {
          toast.error(msg)
        }
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [activeMeter, activeMeterData]
  )

  // Initialize from URL param or localStorage on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return

    let initialMeter = ""
    try {
      const searchParams = new URLSearchParams(window.location.search)
      const urlMeter = searchParams.get("meter")?.replace(/[^0-9]/g, "").trim()
      if (urlMeter && urlMeter.length >= 8) {
        initialMeter = urlMeter
      } else {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved && saved.length >= 8) {
          initialMeter = saved
        }
      }
    } catch {
      // ignore
    }

    if (initialMeter) {
      setActiveMeterState(initialMeter)
      // Auto fetch in background
      fetchMeter(initialMeter, { silent: true })
    }
  }, [fetchMeter])

  const value = React.useMemo<MeterContextType>(
    () => ({
      activeMeter,
      activeMeterData,
      isLoading,
      error,
      setActiveMeter,
      setMeterData,
      fetchMeter,
      clearActiveMeter,
    }),
    [activeMeter, activeMeterData, isLoading, error, setActiveMeter, setMeterData, fetchMeter, clearActiveMeter]
  )

  return <MeterContext.Provider value={value}>{children}</MeterContext.Provider>
}

export function useMeter() {
  const context = React.useContext(MeterContext)
  if (!context) {
    throw new Error("useMeter must be used within a MeterProvider")
  }
  return context
}
