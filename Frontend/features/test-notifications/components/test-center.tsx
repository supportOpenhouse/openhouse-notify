"use client"

import * as React from "react"
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FlaskConical, Loader2, Send, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { withSimulatedLatency } from "@/services/mock-api/delay"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { MobilePreview } from "@/features/campaigns/components/mobile-preview"
import { PageHeader } from "@/components/shared/page-header"
import { Separator } from "@/components/ui/separator"

const testSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  platform: z.enum(["android", "ios"]),
  fcmToken: z.string().min(10, "FCM token is required"),
  simulateFailure: z.boolean().default(false),
  simulateInvalidToken: z.boolean().default(false),
  deepLinkUrl: z.string().optional(),
  ctaLabel: z.string().optional(),
})

type TestInput = z.infer<typeof testSchema>

type TestResult = {
  success: boolean
  messageId?: string
  error?: string
  simulatedAt: string
}

export function TestCenter() {
  const [result, setResult] = React.useState<TestResult | null>(null)
  const [sending, setSending] = React.useState(false)

  const form = useForm<TestInput>({
    resolver: zodResolver(testSchema) as Resolver<TestInput>,
    defaultValues: {
      title: "Test Notification from Admin",
      body: "This is a simulated push notification from Openhouse Admin.",
      platform: "android",
      fcmToken: "dGVzdC10b2tlbi1mb3Itb3BlbmhvdXNlLTEyMzQ1Njc4OTA=",
      simulateFailure: false,
      simulateInvalidToken: false,
    },
  })

  const watchTitle = form.watch("title")
  const watchBody = form.watch("body")
  const watchCta = form.watch("ctaLabel")
  const watchPlatform = form.watch("platform")

  const onSubmit: SubmitHandler<TestInput> = async (data) => {
    setSending(true)
    setResult(null)
    try {
      const res = await withSimulatedLatency(
        () => {
          if (data.simulateInvalidToken) {
            throw new Error("FCM error: INVALID_REGISTRATION — token not found")
          }
          if (data.simulateFailure) {
            throw new Error("FCM error: INTERNAL_ERROR — server unavailable, retry in 30s")
          }
          return {
            success: true,
            messageId: `msg-${Date.now()}`,
            simulatedAt: new Date().toISOString(),
          }
        },
        { minMs: 800, maxMs: 1800 }
      )
      setResult(res)
      toast.success("Test notification sent successfully")
    } catch (e) {
      const err = e instanceof Error ? e.message : "Unknown error"
      setResult({ success: false, error: err, simulatedAt: new Date().toISOString() })
      toast.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Test Notification Center"
        description="Send test notifications to specific devices and simulate failure scenarios"
        breadcrumbs={[{ label: "Admin" }, { label: "Test Notifications" }]}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configure Test Payload</CardTitle>
              <CardDescription>All deliveries are simulated — no real FCM calls are made</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="fcmToken">Device FCM Token *</Label>
                    <Input id="fcmToken" {...form.register("fcmToken")} className="mt-1.5 font-mono text-xs" />
                    {form.formState.errors.fcmToken && (
                      <p className="mt-1 text-xs text-destructive">{form.formState.errors.fcmToken.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" {...form.register("title")} className="mt-1.5" />
                  </div>

                  <div>
                    <Label>Platform</Label>
                    <Select value={watchPlatform} onValueChange={(v) => form.setValue("platform", v as TestInput["platform"])}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="android">Android</SelectItem>
                        <SelectItem value="ios">iOS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="body">Body *</Label>
                    <Textarea id="body" {...form.register("body")} className="mt-1.5 min-h-[80px]" />
                  </div>

                  <div>
                    <Label htmlFor="ctaLabel">CTA Label</Label>
                    <Input id="ctaLabel" {...form.register("ctaLabel")} placeholder="View Now" className="mt-1.5" />
                  </div>

                  <div>
                    <Label htmlFor="deepLinkUrl">Deep Link</Label>
                    <Input id="deepLinkUrl" {...form.register("deepLinkUrl")} placeholder="openhouse://…" className="mt-1.5" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Simulate Failure Scenarios</p>
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <Switch checked={form.watch("simulateFailure")} onCheckedChange={(v) => form.setValue("simulateFailure", v)} id="sf" />
                    <div>
                      <Label htmlFor="sf" className="cursor-pointer">Simulate Server Error</Label>
                      <p className="text-xs text-muted-foreground">FCM returns INTERNAL_ERROR</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <Switch checked={form.watch("simulateInvalidToken")} onCheckedChange={(v) => form.setValue("simulateInvalidToken", v)} id="sit" />
                    <div>
                      <Label htmlFor="sit" className="cursor-pointer">Simulate Invalid Token</Label>
                      <p className="text-xs text-muted-foreground">FCM returns INVALID_REGISTRATION</p>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={sending}>
                  {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                  Send Test Notification
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card className={result.success ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}>
              <CardContent className="flex items-start gap-3 p-4">
                {result.success ? (
                  <CheckCircle className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <XCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold text-sm ${result.success ? "text-emerald-700" : "text-red-700"}`}>
                    {result.success ? "Delivery Simulated Successfully" : "Delivery Simulation Failed"}
                  </p>
                  {result.messageId && (
                    <p className="mt-0.5 text-xs text-muted-foreground font-mono">Message ID: {result.messageId}</p>
                  )}
                  {result.error && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{result.error}</p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">Simulated at {new Date(result.simulatedAt).toLocaleTimeString()}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>Notification appearance</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-5">
            <MobilePreview
              title={watchTitle || ""}
              body={watchBody || ""}
              ctaLabel={watchCta}
              defaultPlatform={watchPlatform}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
