import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Bookmark, ChevronDown, Star, Trash2, Zap } from "lucide-react"
import { toast } from "sonner"
import { deleteSavedMeterFn, getSavedMetersFn, setSavedMeterFavoriteFn, type SavedMeter } from "@/features/auth/auth-server"
import { useAuth } from "@/features/auth/auth-context"
import { useMeter } from "@/features/meter/meter-context"
import { useLanguage } from "@/features/i18n/language-context"

// Phase 5 retention fix: saved meters existed on the server but had no UI
// anywhere. A user could save a meter and never retrieve it. This menu is
// that retrieval UI. It loads fresh on every open, so a meter saved on
// home appears here without a page reload.
export function SavedMetersMenu({
  onSaveCurrentMeter,
  hasCurrentMeter,
}: {
  onSaveCurrentMeter?: () => void
  hasCurrentMeter?: boolean
}) {
  const { user, openAuthModal } = useAuth()
  const { fetchMeter } = useMeter()
  const { isBangla, formatNumber } = useLanguage()
  const [isOpen, setIsOpen] = React.useState(false)
  const [meters, setMeters] = React.useState<SavedMeter[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const list = await getSavedMetersFn()
      // Favorites first, then most recently updated. The server orders by
      // updated_at only, so a favorite would otherwise sink below newer saves.
      list.sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || String(b.updatedAt).localeCompare(String(a.updatedAt)))
      setMeters(list)
    } catch {
      toast.error(isBangla ? "সংরক্ষিত মিটার লোড করা যায়নি।" : "Could not load saved meters.")
    } finally {
      setIsLoading(false)
    }
  }, [user, isBangla])


  const toggleFavorite = async (meter: SavedMeter) => {
    const next = !meter.isFavorite
    setMeters((prev) =>
      prev.map((m) => (m.id === meter.id ? { ...m, isFavorite: next } : m)).sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || String(b.updatedAt).localeCompare(String(a.updatedAt)))
    )
    setBusyId(meter.id)
    try {
      const res = await setSavedMeterFavoriteFn({ data: { meterNumber: meter.meterNumber, isFavorite: next } })
      if (!res.success) throw new Error("failed")
      toast.success(next ? (isBangla ? "প্রিয় মিটার হিসেবে সেট করা হয়েছে।" : "Set as favorite.") : (isBangla ? "প্রিয় থেকে সরানো হয়েছে।" : "Removed from favorites."))
    } catch {
      setMeters((prev) => prev.map((m) => (m.id === meter.id ? { ...m, isFavorite: meter.isFavorite } : m)))
      toast.error(isBangla ? "প্রিয় সেট করা যায়নি।" : "Could not update favorite.")
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async (meter: SavedMeter) => {
    setBusyId(meter.id)
    try {
      const res = await deleteSavedMeterFn({ data: { meterNumber: meter.meterNumber } })
      if (!res.success) throw new Error("failed")
      setMeters((prev) => prev.filter((m) => m.id !== meter.id))
      setPendingDeleteId(null)
      toast.success(isBangla ? "সংরক্ষিত মিটার মুছে ফেলা হয়েছে।" : "Saved meter deleted.")
    } catch {
      toast.error(isBangla ? "মিটার মুছতে পারা যায়নি।" : "Could not delete the meter.")
    } finally {
      setBusyId(null)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) load()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className="h-11 px-4 rounded-xl border border-input bg-background flex items-center justify-center gap-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors w-full sm:w-auto shrink-0 cursor-pointer">
          <Bookmark className="size-4 text-primary" />
          <span>{isBangla ? "সংরক্ষিত মিটার" : "Saved meters"}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {isBangla ? "সংরক্ষিত মিটার" : "Saved meters"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!user ? (
            <DropdownMenuItem onClick={() => openAuthModal("login")}>
              {isBangla ? "সংরক্ষিত মিটার দেখতে লগইন করুন" : "Sign in to see saved meters"}
            </DropdownMenuItem>
          ) : isLoading ? (
            <DropdownMenuItem disabled>
              {isBangla ? "লোড হচ্ছে..." : "Loading..."}
            </DropdownMenuItem>
          ) : meters.length === 0 ? (
            <div className="p-3 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isBangla
                  ? "এখনো কোনো মিটার সংরক্ষণ করা হয়নি। একটি মিটার সার্চ করে সেভ করুন, পরের বার এখান থেকে এক ট্যাপে খুলতে পারবেন।"
                  : "No meter saved yet. Search a meter and save it, then open it here in one tap next time."}
              </p>
              {onSaveCurrentMeter && (
                <Button
                  size="sm"
                  disabled={!hasCurrentMeter}
                  onClick={() => {
                    onSaveCurrentMeter()
                    setIsOpen(false)
                  }}
                  className="w-full"
                >
                  <Zap className="size-3.5" />
                  <span>
                    {hasCurrentMeter
                      ? isBangla
                        ? "বর্তমান মিটার সেভ করুন"
                        : "Save current meter"
                      : isBangla
                      ? "প্রথমে একটি মিটার সার্চ করুন"
                      : "Search a meter first"}
                  </span>
                </Button>
              )}
            </div>
          ) : (
            meters.map((meter) => (
              <div key={meter.id} className="flex items-center gap-1 px-1 py-0.5">
                {pendingDeleteId === meter.id ? (
                  <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 w-full">
                    <span className="text-xs font-medium flex-1 min-w-0 truncate">
                      {isBangla ? "এই মিটার মুছবেন?" : "Delete this meter?"}
                    </span>
                    <Button size="sm" variant="destructive" disabled={busyId === meter.id} onClick={() => confirmDelete(meter)} className="h-7 text-xs">
                      {isBangla ? "মুছুন" : "Delete"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPendingDeleteId(null)} className="h-7 text-xs">
                      {isBangla ? "বাতিল" : "Cancel"}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        fetchMeter(meter.meterNumber, { force: true })
                        setIsOpen(false)
                      }}
                      className="flex-1 min-w-0 h-auto flex-col items-start gap-0 px-2 py-1.5"
                    >
                      <span className="text-xs font-semibold truncate w-full text-left">
                        {meter.alias || meter.customerName || formatNumber(meter.meterNumber)}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatNumber(meter.meterNumber)}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busyId === meter.id}
                      aria-label={meter.isFavorite ? (isBangla ? "প্রিয় থেকে সরান" : "Remove from favorites") : (isBangla ? "প্রিয় হিসেবে সেট করুন" : "Set as favorite")}
                      title={meter.isFavorite ? (isBangla ? "প্রিয়" : "Favorite") : (isBangla ? "প্রিয় করুন" : "Make favorite")}
                      onClick={() => toggleFavorite(meter)}
                      className="size-8 shrink-0"
                    >
                      <Star className={meter.isFavorite ? "size-4 fill-amber-400 text-amber-500" : "size-4 text-muted-foreground"} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={isBangla ? "মিটার মুছুন" : "Delete meter"}
                      onClick={() => setPendingDeleteId(meter.id)}
                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
