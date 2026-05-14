import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-[320px] flex-col items-center justify-center gap-4 py-10 text-center", className)}>
      {icon && (
        <div className="flex size-14 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="max-w-xs text-xs text-muted-foreground">{description}</p>}
      </div>
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
