import * as React from "react"
import { Bookmark, ChevronDown, Star, Trash2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/features/auth/auth-context"
import { deleteSavedMeterFn } from "@/features/auth/auth-server"
import type { SavedMeter } from "@/features/auth/types"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "@/features/meter/meter-context"
import { useSavedMeters } from "./use-saved-meters"

// Phase 5 retention fix: saved meters existed on the server but had no UI
// anywhere. A user could save a meter and never retrieve it. This menu is
// that retrieval UI. It loads fresh on every open, so a meter saved on
// home appears here without a page reload.
export function SavedMetersMenu({
  onSaveCurrentMeter,
  hasCurrentMeter,
  trigger,
}: {
  onSaveCurrentMeter?: () => void
  hasCurrentMeter?: boolean
  /** Replaces the default "Saved meters" button. */
  trigger?: React.ReactElement
}) {
  const { user, openAuthModal } = useAuth()
  const { fetchMeter } = useMeter()
  const { t, formatNumber } = useLanguage()
  const [isOpen, setIsOpen] = React.useState(false)
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null)
  const { meters, setMeters, isLoading, busyId, setBusyId, load, toggleFavorite } = useSavedMeters()

  const confirmDelete = async (meter: SavedMeter) => {
    setBusyId(meter.id)
    try {
      const res = await deleteSavedMeterFn({ data: { meterNumber: meter.meterNumber } })
      if (!res.success) throw new Error("failed")
      setMeters((prev) => prev.filter((m) => m.id !== meter.id))
      setPendingDeleteId(null)
      toast.success(t.savedMeters.deleted)
    } catch {
      toast.error(t.savedMeters.deleteFailed)
    } finally {
      setBusyId(null)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) void load()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          trigger ?? (
            <Button variant="outline" className="w-full sm:w-auto">
              <Bookmark className="text-primary" />
              <span>{t.savedMeters.title}</span>
              <ChevronDown className="text-muted-foreground" />
            </Button>
          )
        }
      />
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t.savedMeters.title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!user ? (
            <DropdownMenuItem onClick={() => openAuthModal("login")}>{t.savedMeters.signIn}</DropdownMenuItem>
          ) : isLoading ? (
            <DropdownMenuItem disabled>{t.common.loading}</DropdownMenuItem>
          ) : meters.length === 0 ? (
            <div className="flex flex-col gap-2 p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">{t.savedMeters.none}</p>
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
                  <Zap />
                  <span>{hasCurrentMeter ? t.savedMeters.saveCurrent : t.savedMeters.searchFirst}</span>
                </Button>
              )}
            </div>
          ) : (
            meters.map((meter) => (
              <div key={meter.id} className="flex items-center gap-1 px-1 py-0.5">
                {pendingDeleteId === meter.id ? (
                  <div className="flex w-full flex-wrap items-center gap-2 px-2 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{t.savedMeters.confirmDelete}</span>
                    <Button size="sm" variant="destructive" disabled={busyId === meter.id} onClick={() => confirmDelete(meter)}>
                      {t.common.delete}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPendingDeleteId(null)}>
                      {t.common.cancel}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        void fetchMeter(meter.meterNumber, { force: true })
                        setIsOpen(false)
                      }}
                      className="h-auto min-w-0 flex-1 flex-col items-start gap-0 px-2 py-1.5"
                    >
                      <span className="w-full truncate text-left text-xs font-semibold">
                        {meter.alias || meter.customerName || formatNumber(meter.meterNumber)}
                      </span>
                      <span className="num text-xs text-muted-foreground">{formatNumber(meter.meterNumber)}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busyId === meter.id}
                      aria-label={meter.isFavorite ? t.savedMeters.removeFavorite : t.savedMeters.addFavorite}
                      aria-pressed={meter.isFavorite}
                      onClick={() => toggleFavorite(meter)}
                      className="shrink-0"
                    >
                      <Star className={meter.isFavorite ? "fill-warning text-warning" : "text-muted-foreground"} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t.savedMeters.delete}
                      onClick={() => setPendingDeleteId(meter.id)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 />
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
