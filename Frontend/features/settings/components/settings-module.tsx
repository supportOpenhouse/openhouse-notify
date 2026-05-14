"use client"

import * as React from "react"
import { Settings2, Shield, Clock, Repeat, Zap, Smartphone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/shared/page-header"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground max-w-md">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SettingSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4 pt-0 divide-y divide-border/60">
        {children}
      </CardContent>
    </Card>
  )
}

export function SettingsModule() {
  const [retryEnabled, setRetryEnabled] = React.useState(true)
  const [silentHoursEnabled, setSilentHoursEnabled] = React.useState(false)
  const [rateLimitEnabled, setRateLimitEnabled] = React.useState(true)
  const [saved, setSaved] = React.useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Configure FCM, delivery policies, retry rules, and notification channels"
        breadcrumbs={[{ label: "Admin" }, { label: "Settings" }]}
        actions={
          <Button size="sm" onClick={handleSave}>
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        }
      />

      <Alert variant="info">
        <Shield className="size-4" />
        <AlertTitle>Mock Configuration Mode</AlertTitle>
        <AlertDescription>
          No real credentials are stored. All settings here are UI prototypes for the future backend integration.
        </AlertDescription>
      </Alert>

      {/* FCM Configuration */}
      <SettingSection title="Firebase Cloud Messaging" icon={Zap}>
        <SettingRow label="Project ID" description="Firebase project identifier">
          <Input defaultValue="openhouse-app-prod" className="w-56 h-8 text-xs font-mono" readOnly />
        </SettingRow>
        <SettingRow label="Server Key" description="Legacy FCM server key (read-only in mock)">
          <Input defaultValue="AAAA••••••••••••••••••••••••" type="password" className="w-56 h-8 text-xs font-mono" readOnly />
        </SettingRow>
        <SettingRow label="FCM API Version" description="v1 (HTTP API) is recommended">
          <Select defaultValue="v1">
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="v1">v1 (HTTP)</SelectItem>
              <SelectItem value="legacy">Legacy</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Connection Status">
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 text-xs">Connected (Mock)</Badge>
        </SettingRow>
      </SettingSection>

      {/* Retry Policy */}
      <SettingSection title="Retry Policy" icon={Repeat}>
        <SettingRow label="Enable Automatic Retry" description="Retry failed deliveries automatically">
          <Switch checked={retryEnabled} onCheckedChange={setRetryEnabled} />
        </SettingRow>
        {retryEnabled && (
          <>
            <SettingRow label="Max Retry Attempts" description="Maximum number of retry attempts per token">
              <Select defaultValue="3">
                <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Retry Backoff Strategy">
              <Select defaultValue="exponential">
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="exponential">Exponential</SelectItem>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="fixed">Fixed interval</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </>
        )}
      </SettingSection>

      {/* Rate Limiting */}
      <SettingSection title="Rate Limiting" icon={Settings2}>
        <SettingRow label="Enable Rate Limiting" description="Limit notification delivery rate to avoid FCM throttling">
          <Switch checked={rateLimitEnabled} onCheckedChange={setRateLimitEnabled} />
        </SettingRow>
        {rateLimitEnabled && (
          <>
            <SettingRow label="Max Tokens/Second" description="Maximum FCM sends per second per worker">
              <Input defaultValue="500" type="number" className="w-24 h-8 text-xs" />
            </SettingRow>
            <SettingRow label="Batch Size" description="Tokens per FCM batch request">
              <Select defaultValue="500">
                <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[100, 250, 500].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </SettingRow>
          </>
        )}
      </SettingSection>

      {/* Notification TTL */}
      <SettingSection title="Notification TTL & Silent Hours" icon={Clock}>
        <SettingRow label="Default TTL (hours)" description="How long FCM will attempt to deliver if device is offline">
          <Input defaultValue="24" type="number" className="w-24 h-8 text-xs" />
        </SettingRow>
        <SettingRow label="Enable Silent Hours" description="Suppress non-transactional notifications between set hours">
          <Switch checked={silentHoursEnabled} onCheckedChange={setSilentHoursEnabled} />
        </SettingRow>
        {silentHoursEnabled && (
          <SettingRow label="Silent Window">
            <div className="flex items-center gap-2">
              <Input defaultValue="22:00" type="time" className="w-24 h-8 text-xs" />
              <span className="text-xs text-muted-foreground">to</span>
              <Input defaultValue="08:00" type="time" className="w-24 h-8 text-xs" />
            </div>
          </SettingRow>
        )}
      </SettingSection>

      {/* Android Channels */}
      <SettingSection title="Android Notification Channels" icon={Smartphone}>
        {[
          { id: "general", name: "General", importance: "DEFAULT", description: "Standard promotional messages" },
          { id: "transactional", name: "Transactional", importance: "HIGH", description: "Price alerts and booking updates" },
          { id: "system", name: "System", importance: "HIGH", description: "App updates and critical alerts" },
        ].map((ch) => (
          <SettingRow key={ch.id} label={ch.name} description={ch.description}>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${ch.importance === "HIGH" ? "border-amber-500/30 bg-amber-500/10 text-amber-700" : "border-border bg-muted text-muted-foreground"}`}>
                {ch.importance}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">{ch.id}</span>
            </div>
          </SettingRow>
        ))}
      </SettingSection>
    </div>
  )
}
