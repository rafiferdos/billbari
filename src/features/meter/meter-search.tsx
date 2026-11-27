import * as React from "react"
import { ClipboardPaste, Search, X } from "lucide-react"
import { Form } from "@/components/ui/form"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { useLanguage } from "@/features/i18n/language-context"
import { cn } from "@/lib/utils"
import { useMeter } from "./meter-context"
import { normalizeMeterInput, type MeterInputError } from "./meter-input"

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select") !== null)

export function MeterSearch({ variant, autoFocus }: { variant: "hero" | "compact"; autoFocus?: boolean }) {
  const { activeMeter, failedMeter, fetchMeter, clearActiveMeter, isLoading } = useMeter()
  const { t } = useLanguage()
  const [value, setValue] = React.useState(failedMeter || activeMeter)
  const [error, setError] = React.useState<MeterInputError | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const errorId = React.useId()
  const isHero = variant === "hero"

  // a meter picked elsewhere (saved list, sample, restored session) shows up here
  React.useEffect(() => {
    if (activeMeter) setValue(activeMeter)
  }, [activeMeter])

  React.useEffect(() => {
    if (!isHero) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isHero])

  const submit = (raw: string) => {
    const result = normalizeMeterInput(raw)
    setError(result.error)
    if (result.error) return
    setValue(result.digits)
    void fetchMeter(result.digits, { force: true })
  }

  const paste = async () => {
    let text: string
    try {
      text = await navigator.clipboard.readText()
    } catch {
      toast.info(t.meterInput.pasteDenied)
      return
    }
    setValue(normalizeMeterInput(text).digits)
    submit(text)
  }

  return (
    <Form
      noValidate
      className="flex w-full flex-col gap-1.5"
      onSubmit={(event) => {
        event.preventDefault()
        submit(value)
      }}
    >
      <InputGroup className={cn(isHero && "h-(--bb-control-h-lg)")}>
        <InputGroupAddon>
          <Search aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder={t.meterInput.placeholder}
          aria-label={t.meterInput.label}
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          className="num min-w-0"
        />
        <InputGroupAddon align="inline-end" className="gap-1">
          {isHero && !value && <Kbd className="hidden lg:inline-flex">/</Kbd>}
          {value && (
            <InputGroupButton
              size="icon-sm"
              aria-label={t.meterInput.clear}
              onClick={() => {
                setValue("")
                setError(null)
                clearActiveMeter()
                inputRef.current?.focus()
              }}
            >
              <X />
            </InputGroupButton>
          )}
          <InputGroupButton size="icon-sm" aria-label={t.meterInput.paste} title={t.meterInput.paste} onClick={paste}>
            <ClipboardPaste />
          </InputGroupButton>
          <InputGroupButton type="submit" variant="default" size="sm" disabled={isLoading} className="px-3">
            {isLoading && <Spinner />}
            {t.meterInput.submit}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {t.meterInput[error]}
        </p>
      )}
    </Form>
  )
}
