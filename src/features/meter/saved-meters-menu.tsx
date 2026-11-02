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
import { Badge } from "@/components/ui/badge"
import { Bookmark, ChevronDown, Zap } from "lucide-react"
import { toast } from "sonner"
import { getSavedMetersFn, type SavedMeter } from "@/features/auth/auth-server"
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

  const load = React.useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const list = await getSavedMetersFn()
      setMeters(list)
    } catch {
      toast.error(isBangla ? "সংরক্ষিত মিটার লোড করা যায়নি।" : "Could not load saved meters.")
    } finally {
      setIsLoading(false)
    }
  }, [user, isBangla])

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
              <DropdownMenuItem
                key={meter.id}
                onClick={() => fetchMeter(meter.meterNumber, { force: true })}
                className="flex items-center justify-between gap-2"
              >
                <span className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate">
                    {meter.alias || meter.customerName || formatNumber(meter.meterNumber)}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {formatNumber(meter.meterNumber)}
                  </span>
                </span>
                {meter.isFavorite && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {isBangla ? "প্রিয়" : "Favorite"}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
