"use client"

import * as React from "react"
import Image from "next/image"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type Platform = "android" | "ios"

type MobilePreviewProps = {
  title: string
  subtitle?: string
  body: string
  ctaLabel?: string
  imageUrl?: string
  appName?: string
  defaultPlatform?: Platform
}

function useLiveClock() {
  const [now, setNow] = React.useState(() => new Date())
  React.useEffect(() => {
    const tick = () => setNow(new Date())
    // Align first tick to the next full minute
    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000
    const timeout = setTimeout(() => {
      tick()
      const interval = setInterval(tick, 60_000)
      return () => clearInterval(interval)
    }, msUntilNextMinute)
    return () => clearTimeout(timeout)
  }, [])
  return now
}

export function MobilePreview({
  title,
  subtitle,
  body,
  ctaLabel,
  imageUrl,
  appName = "Openhouse",
  defaultPlatform = "android",
}: MobilePreviewProps) {
  const [platform, setPlatform] = React.useState<Platform>(defaultPlatform)
  const isIos = platform === "ios"
  const now = useLiveClock()

  const timeString = format(now, "h:mm")          // e.g. "9:41"
  const iosDate   = format(now, "EEEE, d MMMM")   // e.g. "Thursday, 8 May"
  const droidDate = format(now, "EEE, MMM d")     // e.g. "Thu, May 8"

  const displayTitle = title.trim() || "Notification title"
  const displayBody = body.trim() || "Notification message body text will appear here."

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Platform toggle */}
      <div className="flex gap-0 rounded-lg border border-border bg-muted/50 p-0.5 text-xs">
        {(["android", "ios"] as Platform[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            className={cn(
              "rounded-md px-4 py-1.5 font-medium capitalize transition-all",
              platform === p
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p === "ios" ? "iOS" : "Android"}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div className="relative">
        {/* Outer glow */}
        <div
          className={cn(
            "absolute -inset-3 rounded-[44px] opacity-20 blur-xl",
            isIos ? "bg-slate-400" : "bg-slate-500"
          )}
        />

        <div
          className={cn(
            "relative overflow-hidden border-[6px] border-slate-800 bg-slate-900 shadow-2xl",
            isIos ? "w-[236px] rounded-[42px]" : "w-[236px] rounded-[28px]"
          )}
          style={{ boxShadow: "0 32px 64px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)" }}
        >
          {/* Side button (iOS only) */}
          {isIos && (
            <div className="absolute -right-[7px] top-20 h-12 w-[3px] rounded-r-full bg-slate-700" />
          )}

          {/* Volume buttons */}
          <div className="absolute -left-[7px] top-16 h-7 w-[3px] rounded-l-full bg-slate-700" />
          <div className="absolute -left-[7px] top-28 h-10 w-[3px] rounded-l-full bg-slate-700" />

          {/* Screen */}
          <div className="relative flex min-h-[480px] flex-col overflow-hidden bg-slate-900">

            {/* Dynamic island (iOS) / Notch area (Android) */}
            {isIos ? (
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="h-6 w-24 rounded-full bg-slate-950" />
              </div>
            ) : (
              <div className="flex justify-center pt-1.5 pb-0.5">
                <div className="size-2 rounded-full bg-slate-700" />
              </div>
            )}

            {/* Status bar */}
            <div className="flex items-center justify-between px-5 pb-1">
              <span className="text-[11px] font-semibold text-white/90">
                {timeString}
              </span>
              <div className="flex items-center gap-1 text-white/80">
                {/* Signal */}
                <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
                  <rect x="0" y="6" width="2" height="4" rx="0.5" opacity="0.4" />
                  <rect x="3" y="4" width="2" height="6" rx="0.5" opacity="0.6" />
                  <rect x="6" y="2" width="2" height="8" rx="0.5" opacity="0.8" />
                  <rect x="9" y="0" width="2" height="10" rx="0.5" />
                </svg>
                {/* WiFi */}
                <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
                  <path d="M7 8.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                  <path d="M4.5 6.3a3.5 3.5 0 0 1 5 0" strokeWidth="1.2" stroke="currentColor" fill="none" strokeLinecap="round" opacity="0.7" />
                  <path d="M2 3.8a7 7 0 0 1 10 0" strokeWidth="1.2" stroke="currentColor" fill="none" strokeLinecap="round" opacity="0.4" />
                </svg>
                {/* Battery */}
                <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
                  <rect x="0.5" y="0.5" width="14" height="9" rx="2" stroke="currentColor" strokeOpacity="0.5" />
                  <rect x="1.5" y="1.5" width="11" height="7" rx="1.5" fill="currentColor" />
                  <path d="M15.5 3.5v3a1.5 1.5 0 0 0 0-3z" fill="currentColor" fillOpacity="0.4" />
                </svg>
              </div>
            </div>

            {/* Lock screen wallpaper */}
            <div
              className="flex-1 px-3 pt-3"
              style={{
                background: isIos
                  ? "linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)"
                  : "linear-gradient(160deg, #0a0a0a 0%, #1a1a2e 100%)",
              }}
            >
              {/* Time on lock screen */}
              <div className="mb-6 text-center">
                <p className="text-4xl font-thin tabular-nums text-white/90">{timeString}</p>
                <p className="mt-0.5 text-xs text-white/50">
                  {isIos ? iosDate : droidDate}
                </p>
              </div>

              {/* Notification card */}
              <div
                className={cn(
                  "overflow-hidden",
                  isIos
                    ? "rounded-2xl bg-white/[0.18] ring-1 ring-white/20 backdrop-blur-xl"
                    : "rounded-xl bg-white/[0.12] ring-1 ring-white/15 backdrop-blur-xl"
                )}
              >
                {/* App header row */}
                <div className="flex items-center gap-2 px-3 py-2">
                  {/* App icon */}
                  <div
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center overflow-hidden bg-white p-[3px]",
                      isIos ? "rounded-[7px]" : "rounded-md"
                    )}
                  >
                    <Image
                      src="/images/OH_Black.svg"
                      alt="Openhouse"
                      width={20}
                      height={20}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="flex-1 text-[10px] font-semibold uppercase tracking-widest text-white/60">
                    {appName}
                  </span>
                  <span className="text-[10px] text-white/40">now</span>
                </div>

                {/* Divider */}
                <div className="mx-3 h-px bg-white/10" />

                {/* Content */}
                <div className="px-3 py-2.5">
                  <p className="text-[12px] font-semibold leading-snug text-white line-clamp-1">
                    {displayTitle}
                  </p>
                  {subtitle && (
                    <p className="mt-0.5 text-[11px] font-medium text-white/60 line-clamp-1">
                      {subtitle}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] leading-snug text-white/75 line-clamp-2">
                    {displayBody}
                  </p>

                  {/* Image preview */}
                  {imageUrl && (
                    <div className="mt-2 overflow-hidden rounded-lg">
                      <img src={imageUrl} alt="" className="h-20 w-full object-cover" />
                    </div>
                  )}
                </div>

                {/* CTA */}
                {ctaLabel && (
                  <>
                    <div className="mx-3 h-px bg-white/10" />
                    <div className="px-3 py-2 text-center">
                      <span className="text-[11px] font-semibold text-indigo-300">
                        {ctaLabel}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Second dim notification for depth */}
              <div className="mt-1.5 h-8 rounded-2xl bg-white/[0.06] ring-1 ring-white/10" />
            </div>

            {/* Home bar */}
            <div
              className={cn(
                "flex justify-center py-2",
                isIos
                  ? "bg-gradient-to-b from-[#0f3460] to-slate-900"
                  : "bg-slate-900"
              )}
            >
              <div
                className={cn(
                  "h-1 rounded-full bg-white/25",
                  isIos ? "w-24" : "w-10"
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Platform label */}
      <p className="text-[11px] text-muted-foreground">
        {isIos ? "iOS lock screen" : "Android lock screen"} · preview only
      </p>
    </div>
  )
}
