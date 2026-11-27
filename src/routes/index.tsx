import { createFileRoute } from "@tanstack/react-router"
import { Dashboard, DashboardSkeleton } from "@/features/dashboard/dashboard"
import { LandingBody, LandingHeading } from "@/features/dashboard/landing"
import { useMeter } from "@/features/meter/meter-context"
import { MeterError } from "@/features/meter/meter-error"
import { MeterSearch } from "@/features/meter/meter-search"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  const { activeMeterData: data, isLoading, error, failedMeter, fetchMeter } = useMeter()
  const isLanding = !data && !isLoading

  return (
    <div className="section-stack">
      {isLanding && <LandingHeading />}
      {/* one instance in a fixed slot, so what was typed survives loading and errors */}
      <MeterSearch variant={isLanding ? "hero" : "compact"} autoFocus={isLanding} />
      {error && !isLoading && (
        <MeterError error={error} onRetry={() => void fetchMeter(failedMeter, { force: true })} />
      )}
      {isLoading ? <DashboardSkeleton /> : data ? <Dashboard data={data} /> : <LandingBody />}
    </div>
  )
}
