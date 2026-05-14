import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-muted/50 text-foreground border-border",
        destructive: "border-destructive/50 bg-destructive/10 text-destructive [&>svg]:text-destructive",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 [&>svg]:text-amber-600",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 [&>svg]:text-emerald-600",
        info: "border-blue-500/30 bg-blue-500/10 text-blue-700 [&>svg]:text-blue-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

export function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
}

export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-xs [&_p]:leading-relaxed", className)} {...props} />
}
