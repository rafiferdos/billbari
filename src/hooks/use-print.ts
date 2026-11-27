import * as React from "react"

/** `printing` is true while a print-only view should be mounted. */
export function usePrint(): { printing: boolean; print: () => void } {
  // a counter, so a browser that never fires "afterprint" can still print again
  const [job, setJob] = React.useState(0)

  React.useEffect(() => {
    if (!job) return
    const done = () => setJob(0)
    window.addEventListener("afterprint", done)
    // one frame later the print view is in the document
    const frame = requestAnimationFrame(() => window.print())
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("afterprint", done)
    }
  }, [job])

  return { printing: job > 0, print: () => setJob((n) => n + 1) }
}
