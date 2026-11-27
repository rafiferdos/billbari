import * as React from "react"
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/features/auth/auth-context"
import { saveMeterFn } from "@/features/auth/auth-server"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "./meter-context"

/** Saves the loaded meter to the account; asks a signed-out viewer to sign in first. */
export function useSaveMeter() {
  const { user, openAuthModal } = useAuth()
  const { activeMeterData: data } = useMeter()
  const { t } = useLanguage()
  const [isSaving, setIsSaving] = React.useState(false)

  const saveMeter = async () => {
    if (!data) return
    if (!user) {
      openAuthModal("login")
      toast.info(t.saveMeterFlow.signIn)
      return
    }

    const info = data.customerInfo
    setIsSaving(true)
    try {
      const res = await saveMeterFn({
        data: {
          meterNumber: info.meterNumber,
          customerNumber: info.customerNumber,
          customerName: info.name,
          address: info.address,
          tariff: info.tariff,
          sanctionedLoad: String(info.approvedLoadKw),
          // a function replacement keeps "$" in a name literal
          alias: t.saveMeterFlow.alias.replace("{name}", () => info.name),
        },
      })
      if (res.success) toast.success(t.saveMeterFlow.saved)
      else toast.error(res.error || t.saveMeterFlow.failed)
    } catch {
      toast.error(t.saveMeterFlow.error)
    } finally {
      setIsSaving(false)
    }
  }

  return { saveMeter, isSaving, canSave: Boolean(data) }
}
