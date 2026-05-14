import * as React from "react"
import { cn } from "@/lib/utils"
import { CAMPAIGN_STATUS_CONFIG } from "@/lib/constants/campaign.constants"
import { CampaignStatus } from "@/lib/types/notification"

const variantStyles: Record<string, string> = {
  default: "border-primary/30 bg-primary/10 text-primary",
  secondary: "border-border bg-muted text-muted-foreground",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  destructive: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
}

type StatusBadgeProps = {
  status: CampaignStatus
  className?: string
  showDot?: boolean
}

const FALLBACK_CONFIG = { label: "Unknown", variant: "secondary" as const }

export function StatusBadge({ status, className, showDot = false }: StatusBadgeProps) {
  const config = CAMPAIGN_STATUS_CONFIG[status] ?? FALLBACK_CONFIG
  const style = variantStyles[config.variant]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        style,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "size-1.5 rounded-full",
            config.variant === "success" && "bg-emerald-500",
            config.variant === "warning" && "bg-amber-500",
            config.variant === "destructive" && "bg-red-500",
            config.variant === "info" && "bg-blue-500",
            config.variant === "default" && "bg-primary",
            config.variant === "secondary" && "bg-muted-foreground"
          )}
        />
      )}
      {config.label}
    </span>
  )
}
