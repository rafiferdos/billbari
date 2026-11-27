import * as React from "react"
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/features/auth/auth-context"
import { getSavedMetersFn, setSavedMeterFavoriteFn } from "@/features/auth/auth-server"
import type { SavedMeter } from "@/features/auth/types"
import { useLanguage } from "@/features/i18n/language-context"

// Favorites first, then most recently updated. The server orders by
// updated_at only, so a favorite would otherwise sink below newer saves.
const byFavorite = (a: SavedMeter, b: SavedMeter) =>
  Number(b.isFavorite) - Number(a.isFavorite) || String(b.updatedAt).localeCompare(String(a.updatedAt))

/** The signed-in viewer's saved meters. Callers decide when to `load`. */
export function useSavedMeters() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [meters, setMeters] = React.useState<SavedMeter[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      setMeters((await getSavedMetersFn()).sort(byFavorite))
    } catch {
      toast.error(t.savedMeters.loadFailed)
    } finally {
      setIsLoading(false)
    }
  }, [user, t])

  const toggleFavorite = async (meter: SavedMeter) => {
    const next = !meter.isFavorite
    setMeters((prev) => prev.map((m) => (m.id === meter.id ? { ...m, isFavorite: next } : m)).sort(byFavorite))
    setBusyId(meter.id)
    try {
      const res = await setSavedMeterFavoriteFn({ data: { meterNumber: meter.meterNumber, isFavorite: next } })
      if (!res.success) throw new Error("failed")
      toast.success(next ? t.savedMeters.favoriteSet : t.savedMeters.favoriteRemoved)
    } catch {
      setMeters((prev) => prev.map((m) => (m.id === meter.id ? { ...m, isFavorite: meter.isFavorite } : m)))
      toast.error(t.savedMeters.favoriteFailed)
    } finally {
      setBusyId(null)
    }
  }

  return { meters, setMeters, isLoading, busyId, setBusyId, load, toggleFavorite }
}
