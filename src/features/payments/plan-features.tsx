import { Check, ChevronDown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useLanguage } from "@/features/i18n/language-context"
import { featuresByTier, featureText, type FeatureTier } from "./entitlements"

function FeatureList({ tier }: { tier: FeatureTier }) {
  const { isBangla } = useLanguage()
  const Icon = tier === "pro" ? Sparkles : Check

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {featuresByTier(tier).map((id) => {
        const { name, description } = featureText(id, isBangla)
        return (
          <li key={id} className="flex items-start gap-2">
            <Icon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>
              <span className="block text-xs font-semibold">{name}</span>
              <span className="block text-xs text-muted-foreground">{description}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** What a plan unlocks, read from the entitlement matrix so it cannot drift from the gates. */
export function PlanFeatures() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{t.pricing.everythingTitle}</h3>
      <FeatureList tier="pro" />
      <Collapsible>
        <CollapsibleTrigger render={<Button type="button" variant="ghost" size="sm" className="group px-0" />}>
          {t.pricing.alwaysFree}
          <ChevronDown aria-hidden className="transition-transform group-data-panel-open:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent keepMounted className="pt-2">
          <FeatureList tier="free" />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
