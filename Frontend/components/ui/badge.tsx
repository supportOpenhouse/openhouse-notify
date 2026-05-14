import * as React from "react"

import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "secondary" | "success" | "warning"

const styles: Record<BadgeVariant, string> = {
  default: "border-primary/30 bg-primary/10 text-primary",
  secondary: "border-border bg-muted text-muted-foreground",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-600",
}

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
        styles[variant],
        className,
      )}
      {...props}
    />
  )
}
