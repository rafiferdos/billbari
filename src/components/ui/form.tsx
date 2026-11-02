import * as React from "react"

// Local shadcn-style Form primitive for BillBari.
//
// This is NOT the react-hook-form Form from the official shadcn
// registry: this project has no react-hook-form dependency, and adding
// one only to wrap a submit handler would be scope creep for Phase 7.
// This wrapper exists for one reason: app code must use a component
// from src/components/ui, never a raw <form> tag, while still keeping
// native form behaviour (Enter to submit, required inputs, onSubmit).
// The underlying <form> lives here, in the primitives folder, exactly
// like <label> in label.tsx and <table> in table.tsx, which the
// shadcn-only check excludes by design.
function Form({ ...props }: React.ComponentPropsWithoutRef<"form">) {
  return <form data-slot="form" {...props} />
}

export { Form }
