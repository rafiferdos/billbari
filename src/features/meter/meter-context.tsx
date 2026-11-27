import * as React from "react"
import { getMeterDataFn } from "@/features/nesco/nesco-server"
import { type NescoFetchResult } from "@/features/nesco/types"
import { recordRecentSearch } from "@/features/db/client-db"
import { useLanguage } from "@/features/i18n/language-context"
import { toast } from "@/components/ui/toast"
import { normalizeMeterInput } from "./meter-input"

export interface MeterContextType {
  activeMeter: string
  activeMeterData: NescoFetchResult | null
  isLoading: boolean
  error: string | null
  /** The number behind `error`; it never became the active meter, so Retry needs it. */
  failedMeter: string
  setActiveMeter: (meter: string) => void
  setMeterData: (data: NescoFetchResult | null) => void
  fetchMeter: (targetMeter?: string, options?: { silent?: boolean; force?: boolean }) => Promise<NescoFetchResult | null>
  clearActiveMeter: () => void
}

const MeterContext = React.createContext<MeterContextType | undefined>(undefined)

const SESSION_METER_KEY = "billbari_session_meter"
const SESSION_DATA_KEY = "billbari_session_meter_data"

export function MeterProvider({ children }: { children: React.ReactNode }) {
  const { t, isBangla } = useLanguage()
  // read through a ref so fetchMeter keeps one identity across language switches
  const languageRef = React.useRef({ t, isBangla })
  languageRef.current = { t, isBangla }

  const [activeMeter, setActiveMeterState] = React.useState<string>("")
  const [activeMeterData, setActiveMeterData] = React.useState<NescoFetchResult | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const [failedMeter, setFailedMeter] = React.useState<string>("")

  // Use refs to keep callback identity stable and prevent infinite re-render loops (React error #185)
  const activeMeterRef = React.useRef(activeMeter)
  activeMeterRef.current = activeMeter
  const activeMeterDataRef = React.useRef(activeMeterData)
  activeMeterDataRef.current = activeMeterData
  const hasInitializedRef = React.useRef(false)

  // Safe sessionStorage helper (persists only for current session as requested)
  const setActiveMeter = React.useCallback((meter: string) => {
    const clean = meter.replace(/[^0-9]/g, "").trim()
    setActiveMeterState(clean)
    if (typeof window !== "undefined") {
      try {
        if (clean) {
          sessionStorage.setItem(SESSION_METER_KEY, clean)
        } else {
          sessionStorage.removeItem(SESSION_METER_KEY)
          sessionStorage.removeItem(SESSION_DATA_KEY)
        }
        localStorage.removeItem("billbari_active_meter")
      } catch {
        // ignore storage errors
      }
    }
  }, [])

  const setMeterData = React.useCallback((data: NescoFetchResult | null) => {
    setActiveMeterData(data)
    if (typeof window !== "undefined") {
      try {
        if (data) {
          sessionStorage.setItem(SESSION_DATA_KEY, JSON.stringify(data))
        } else {
          sessionStorage.removeItem(SESSION_DATA_KEY)
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [])

  const clearActiveMeter = React.useCallback(() => {
    setActiveMeterState("")
    setActiveMeterData(null)
    setError(null)
    setFailedMeter("")
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(SESSION_METER_KEY)
        sessionStorage.removeItem(SESSION_DATA_KEY)
        localStorage.removeItem("billbari_active_meter")
      } catch {
        // ignore
      }
    }
  }, [])

  const fetchMeter = React.useCallback(
    async (targetMeter?: string, options?: { silent?: boolean; force?: boolean }): Promise<NescoFetchResult | null> => {
      const num = normalizeMeterInput(targetMeter || activeMeterRef.current).digits
      if (!num || num.length < 8) {
        if (!options?.silent) {
          toast.error(languageRef.current.t.meterLoad.badNumber)
        }
        return null
      }

      // If already loaded and not force, return cached
      if (!options?.force && activeMeterDataRef.current && activeMeterRef.current === num) {
        return activeMeterDataRef.current
      }

      setIsLoading(true)
      setError(null)
      setFailedMeter("")

      try {
        const result = await getMeterDataFn({
          data: { meterNumber: num },
        })

        setActiveMeterState(num)
        setActiveMeterData(result)
        setError(null)

        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(SESSION_METER_KEY, num)
            sessionStorage.setItem(SESSION_DATA_KEY, JSON.stringify(result))
            localStorage.removeItem("billbari_active_meter")
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
          const { t, isBangla } = languageRef.current
          if (result.dataSource === "nesco_live") {
            toast.success(t.meterLoad.live)
          } else {
            // NESCO status messages arrive in Bangla only
            const fallback = result.dataSource === "cached_real" ? t.meterLoad.cached : t.meterLoad.sample
            toast.info((isBangla && result.statusMessage) || fallback)
          }
        }

        return result
      } catch (err: unknown) {
        const { t, isBangla } = languageRef.current
        const rawMsg = err instanceof Error ? err.message : t.meterLoad.failed
        const msg = isBangla
          ? rawMsg
          : rawMsg.includes("403")
            ? t.meterLoad.blocked
            : rawMsg.includes("502")
              ? t.meterLoad.gateway
              : t.meterLoad.failed
        setError(msg)
        setFailedMeter(num)
        if (!options?.silent) {
          toast.error(msg)
        }
        return null
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Initialize from URL param or sessionStorage on mount (maintains state across page navigation)
  React.useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    if (typeof window === "undefined") return

    // Clean up old legacy localStorage persistence
    try {
      localStorage.removeItem("billbari_active_meter")
    } catch {}

    let initialMeter = ""
    let restoredData: NescoFetchResult | null = null

    try {
      const searchParams = new URLSearchParams(window.location.search)
      const urlMeter = searchParams.get("meter")?.replace(/[^0-9]/g, "").trim()
      if (urlMeter && urlMeter.length >= 8) {
        initialMeter = urlMeter
      } else {
        const saved = sessionStorage.getItem(SESSION_METER_KEY)
        if (saved && saved.length >= 8) {
          initialMeter = saved
        }
      }

      // Check for active session meter data
      const savedDataJson = sessionStorage.getItem(SESSION_DATA_KEY)
      if (savedDataJson) {
        const parsed = JSON.parse(savedDataJson) as NescoFetchResult
        if (parsed?.customerInfo?.meterNumber) {
          restoredData = parsed
        }
      }
    } catch {
      // ignore
    }

    if (
      restoredData &&
      initialMeter &&
      (restoredData.customerInfo.meterNumber === initialMeter ||
        restoredData.customerInfo.customerNumber === initialMeter)
    ) {
      setActiveMeterState(initialMeter)
      setActiveMeterData(restoredData)
    } else if (initialMeter) {
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
      failedMeter,
      setActiveMeter,
      setMeterData,
      fetchMeter,
      clearActiveMeter,
    }),
    [activeMeter, activeMeterData, isLoading, error, failedMeter, setActiveMeter, setMeterData, fetchMeter, clearActiveMeter]
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
