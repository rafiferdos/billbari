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
  const { isBangla } = useLanguage()
  const [isSaving, setIsSaving] = React.useState(false)

  const saveMeter = async () => {
    if (!data) return
    if (!user) {
      openAuthModal("login")
      toast.info(isBangla ? "মিটার সেভ করতে অনুগ্রহ করে লগইন করুন।" : "Please sign in to save your meter.")
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
          alias: isBangla ? `${info.name} এর মিটার` : `${info.name}'s Meter`,
        },
      })
      if (res.success) {
        toast.success(isBangla ? "মিটারটি আপনার একাউন্টে সেভ করা হয়েছে!" : "Meter saved to your account profile!")
      } else {
        toast.error(res.error || (isBangla ? "মিটার সংরক্ষণ করা যায়নি।" : "Failed to save meter."))
      }
    } catch {
      toast.error(isBangla ? "মিটার সংরক্ষণে সমস্যা হয়েছে।" : "An error occurred while saving meter.")
    } finally {
      setIsSaving(false)
    }
  }

  return { saveMeter, isSaving, canSave: Boolean(data) }
}
