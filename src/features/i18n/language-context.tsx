import * as React from "react"
import { translations, type Language, type Translations } from "./translations"
import {
  formatBDT as formatBDTRaw,
  formatUnits as formatUnitsRaw,
  formatDateBangla,
  formatDateWithDayBangla,
  toBanglaNumber,
} from "@/lib/bangla"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  t: Translations
  isBangla: boolean
  formatBDT: (amount: number | string | null | undefined, options?: { decimals?: number; includeSymbol?: boolean }) => string
  formatUnits: (units: number | string | null | undefined) => string
  formatNumber: (val: number | string | null | undefined) => string
  formatDate: (dateStr: string | null | undefined) => string
  formatDateWithDay: (dateInput: Date | string | number | null | undefined) => string
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = "billbari_preferred_language"

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>("bn")

  // Load preferred language from localStorage on client mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null
      if (saved === "bn" || saved === "en") {
        setLanguageState(saved)
      }
    } catch {
      // Ignore localStorage access failures
    }
  }, [])

  const setLanguage = React.useCallback((lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
      // Also update html lang attribute for accessibility
      document.documentElement.lang = lang
    } catch {
      // Ignore
    }
  }, [])

  const toggleLanguage = React.useCallback(() => {
    setLanguage(language === "bn" ? "en" : "bn")
  }, [language, setLanguage])

  const isBangla = language === "bn"
  const t = translations[language] as Translations

  const formatBDT = React.useCallback(
    (amount: number | string | null | undefined, options?: { decimals?: number; includeSymbol?: boolean }) => {
      return formatBDTRaw(amount, {
        inBangla: isBangla,
        decimals: options?.decimals ?? 2,
        includeSymbol: options?.includeSymbol ?? true,
      })
    },
    [isBangla]
  )

  const formatUnits = React.useCallback(
    (units: number | string | null | undefined) => {
      return formatUnitsRaw(units, isBangla)
    },
    [isBangla]
  )

  const formatNumber = React.useCallback(
    (val: number | string | null | undefined) => {
      if (val === null || val === undefined) return isBangla ? "০" : "0"
      return isBangla ? toBanglaNumber(val) : String(val)
    },
    [isBangla]
  )

  const formatDate = React.useCallback(
    (dateStr: string | null | undefined) => {
      if (!dateStr) return "-"
      if (isBangla) {
        return formatDateBangla(dateStr)
      }
      try {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return dateStr
        return d.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      } catch {
        return dateStr
      }
    },
    [isBangla]
  )

  const formatDateWithDay = React.useCallback(
    (dateInput: Date | string | number | null | undefined) => {
      if (!dateInput) return "-"
      if (isBangla) {
        return formatDateWithDayBangla(dateInput)
      }
      try {
        const d = dateInput instanceof Date ? dateInput : new Date(dateInput)
        if (isNaN(d.getTime())) return String(dateInput)
        return d.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      } catch {
        return String(dateInput)
      }
    },
    [isBangla]
  )

  const value = React.useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      isBangla,
      formatBDT,
      formatUnits,
      formatNumber,
      formatDate,
      formatDateWithDay,
    }),
    [
      language,
      setLanguage,
      toggleLanguage,
      t,
      isBangla,
      formatBDT,
      formatUnits,
      formatNumber,
      formatDate,
      formatDateWithDay,
    ]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = React.useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
