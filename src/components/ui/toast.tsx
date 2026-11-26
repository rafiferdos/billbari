import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/features/i18n/language-context"

// Module scope, so `toast.*` works outside React.
const manager = ToastPrimitive.createToastManager()

export type ToastOptions = { description?: string; duration?: number }

const show =
  (type: "success" | "error" | "info" | "warning" | "message") =>
  (title: string, options?: ToastOptions) =>
    manager.add({
      type,
      title,
      description: options?.description,
      timeout: options?.duration,
      priority: type === "error" ? "high" : "low",
    })

export const toast = {
  success: show("success"),
  error: show("error"),
  info: show("info"),
  warning: show("warning"),
  message: show("message"),
}

const ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircle2Icon className="text-success" />,
  error: <XCircleIcon className="text-destructive" />,
  info: <InfoIcon className="text-primary" />,
  warning: <AlertTriangleIcon className="text-warning" />,
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()
  const { t } = useLanguage()

  return toasts.map((item) => (
    <ToastPrimitive.Root
      key={item.id}
      toast={item}
      data-slot="toast"
      className="pointer-events-auto w-full translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y) surface-card bg-popover text-popover-foreground transition-[opacity,translate] duration-200 data-ending-style:translate-y-2 data-ending-style:opacity-0 data-limited:hidden data-starting-style:translate-y-2 data-starting-style:opacity-0"
    >
      <ToastPrimitive.Content className="flex items-start gap-3 p-3 [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0">
        {item.type ? ICONS[item.type] : null}
        <div className="min-w-0 flex-1 text-sm">
          <ToastPrimitive.Title className="font-medium" />
          <ToastPrimitive.Description className="text-muted-foreground" />
        </div>
        <ToastPrimitive.Close
          aria-label={t.common.close}
          render={<Button variant="ghost" size="icon-xs" />}
        >
          <XIcon />
        </ToastPrimitive.Close>
      </ToastPrimitive.Content>
    </ToastPrimitive.Root>
  ))
}

export function Toaster() {
  return (
    <ToastPrimitive.Provider toastManager={manager} timeout={4000}>
      <ToastPrimitive.Portal>
        {/* Sits above the mobile dock when the theme uses one. */}
        <ToastPrimitive.Viewport className="pointer-events-none fixed inset-x-4 bottom-4 z-100 mx-auto flex max-w-sm flex-col-reverse gap-2 outline-none max-md:nav-dock:bottom-[calc(5rem+env(safe-area-inset-bottom))] md:right-4 md:left-auto md:mx-0 md:w-96">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}
