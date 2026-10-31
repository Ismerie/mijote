import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "cn"

// Liste déroulante native : sur téléphone, elle ouvre le sélecteur du système.
// className s'applique au <select>, wrapperClassName au bloc qui l'entoure (largeur, placement).
function NativeSelect({
  className,
  wrapperClassName,
  ...props
}: React.ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <div data-slot="native-select-wrapper" className={cn("relative min-w-0", wrapperClassName)}>
      <select
        data-slot="native-select"
        className={cn(
          "h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
          className
        )}
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}

export { NativeSelect }
