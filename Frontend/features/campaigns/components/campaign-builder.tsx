"use client"

import * as React from "react"
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, Save, Send, Upload, X, FileText } from "lucide-react"
import { PropertySearchPicker } from "@/features/campaigns/components/property-search-picker"
import { fullCampaignSchema, type FullCampaignInput } from "@/lib/schemas/campaign-schema"
import { CAMPAIGN_BUILDER_STEPS, TITLE_MAX_CHARS, BODY_MAX_CHARS, SUBTITLE_MAX_CHARS } from "@/lib/constants/campaign.constants"
import { useCreateCampaign } from "@/hooks/use-notification-campaigns"
import { useAppDispatch } from "@/store/hooks"
import { startDraft, saveDraft } from "@/store/slices/drafts-slice"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { MobilePreview } from "@/features/campaigns/components/mobile-preview"
import { cn } from "@/lib/utils"

const PLATFORM_OPTIONS = [
  { label: "All Platforms", value: "all" },
  { label: "Android", value: "android" },
  { label: "iOS", value: "ios" },
]

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Normal", value: "normal" },
  { label: "High", value: "high" },
]

const TYPE_OPTIONS = [
  { label: "Promotional", value: "promotional" },
  { label: "Transactional", value: "transactional" },
  { label: "Triggered", value: "triggered" },
  { label: "System", value: "system" },
]

const AUDIENCE_OPTIONS = [
  { label: "Paste FCM Tokens", value: "manual" },
  { label: "Upload CSV File", value: "csv_cp_ids" },
  { label: "Send to All Users", value: "all_users" },
  { label: "All Brokers", value: "all_brokers" },
  { label: "City Brokers", value: "city_brokers" },
  { label: "Saved Segment", value: "segment" },
]

const SCHEDULE_OPTIONS = [
  { label: "Send Now", value: "instant" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Recurring", value: "recurring" },
]

export function CampaignBuilder() {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [draftId] = React.useState(() => `draft-${Date.now()}`)
  const [csvFile, setCsvFile] = React.useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const createMutation = useCreateCampaign()
  const dispatch = useAppDispatch()
  const router = useRouter()

  const form = useForm<FullCampaignInput>({
    resolver: zodResolver(fullCampaignSchema) as Resolver<FullCampaignInput>,
    defaultValues: {
      name: "",
      notificationType: "promotional",
      platform: "all",
      priority: "normal",
      tags: [],
      title: "",
      body: "",
      deepLinkUrl: "",
      propertyCode: "",   // must be in defaultValues so RHF field map always tracks it
      ctaLabel: "",
      imageUrl: "",
      silent: false,
      audienceType: "manual",
      manualTokens: "",
      selectedCities: [],
      scheduleType: "instant",
      timezone: "Asia/Kolkata",
    },
    mode: "onChange",
  })

  const watchedTitle = form.watch("title")
  const watchedSubtitle = form.watch("subtitle")
  const watchedBody = form.watch("body")
  const watchedCta = form.watch("ctaLabel")
  const watchedScheduleType = form.watch("scheduleType")
  const watchedAudienceType = form.watch("audienceType")

  React.useEffect(() => {
    dispatch(startDraft({ id: draftId, name: "New Campaign" }))
  }, [draftId, dispatch])

  const handleSaveDraft = () => {
    dispatch(saveDraft(draftId))
    toast.success("Draft saved")
  }

  const onSubmit: SubmitHandler<FullCampaignInput> = async (data) => {
    try {
      // ── Debug: log everything going into the POST /campaigns call ──────────
      console.log("🚀 [Campaign Submit] form data:", {
        name: data.name,
        title: data.title,
        body: data.body,
        audienceType: data.audienceType,
        scheduleType: data.scheduleType,
        propertyCode: data.propertyCode,          // ← watch this
        deepLinkUrl: data.deepLinkUrl,
        manualTokens: data.manualTokens ? `${data.manualTokens.split(/[\n,]+/).filter(Boolean).length} tokens` : "(none)",
        silent: data.silent,
        platform: data.platform,
        priority: data.priority,
      })

      if (data.audienceType === "csv_cp_ids" && !csvFile) {
        toast.error("Please upload a CSV file with FCM tokens")
        setCurrentStep(2)
        return
      }
      if (data.audienceType === "manual" && !data.manualTokens?.trim()) {
        toast.error("Please paste at least one FCM token")
        setCurrentStep(2)
        return
      }
      const result = await createMutation.mutateAsync({
        name: data.name,
        title: data.title,
        subtitle: data.subtitle,
        body: data.body,
        audienceType: data.audienceType,
        segmentId: data.segmentId,
        manualTokens: data.manualTokens,
        csvFile: csvFile ?? undefined,
        scheduleType: data.scheduleType,
        scheduledAt: data.scheduledAt,
        timezone: data.timezone,
        platform: data.platform,
        priority: data.priority,
        notificationType: data.notificationType,
        deepLinkUrl: data.deepLinkUrl,
        propertyCode: data.propertyCode?.trim() || undefined,
        ctaLabel: data.ctaLabel,
        tags: data.tags,
        silent: data.silent,
      })
      toast.success(result.message)
      router.push("/admin/campaigns")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create campaign")
    }
  }

  const stepFields: (keyof FullCampaignInput)[][] = [
    ["name", "notificationType", "platform", "priority"],
    ["title", "body", "deepLinkUrl", "propertyCode", "ctaLabel", "imageUrl", "subtitle", "silent"],
    ["audienceType"],
    ["scheduleType"],
    [],
  ]

  const canAdvance = async () => {
    const fields = stepFields[currentStep]
    if (fields.length === 0) return true
    const result = await form.trigger(fields)
    return result
  }

  const goNext = async () => {
    if (await canAdvance()) setCurrentStep((s) => Math.min(s + 1, CAMPAIGN_BUILDER_STEPS.length - 1))
  }
  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 0))

  const isLastStep = currentStep === CAMPAIGN_BUILDER_STEPS.length - 1

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      {/* Main form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Stepper header */}
        <Card>
          <CardContent className="px-5 py-4">
            <div className="flex items-center gap-0">
              {CAMPAIGN_BUILDER_STEPS.map((step, i) => (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => i < currentStep && setCurrentStep(i)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                        i < currentStep
                          ? "bg-primary/20 text-primary cursor-pointer"
                          : i === currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={cn(
                        "hidden text-[10px] font-medium sm:block",
                        i === currentStep ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </button>
                  {i < CAMPAIGN_BUILDER_STEPS.length - 1 && (
                    <div className={cn("h-px flex-1 transition-colors", i < currentStep ? "bg-primary/40" : "bg-border")} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step content */}
        <Card>
          <CardHeader>
            <CardTitle>{CAMPAIGN_BUILDER_STEPS[currentStep].label}</CardTitle>
            <CardDescription>{CAMPAIGN_BUILDER_STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Step 0: Details */}
            {currentStep === 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input id="name" placeholder="e.g. Noida Hot Leads Push" {...form.register("name")} className="mt-1.5" />
                    {form.formState.errors.name && (
                      <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Notification Type</Label>
                    <Select
                      value={form.watch("notificationType")}
                      onValueChange={(v) => form.setValue("notificationType", v as FullCampaignInput["notificationType"])}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Platform</Label>
                    <Select value={form.watch("platform")} onValueChange={(v) => form.setValue("platform", v as FullCampaignInput["platform"])}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLATFORM_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as FullCampaignInput["priority"])}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input id="description" placeholder="Internal notes about this campaign" {...form.register("description")} className="mt-1.5" />
                  </div>
                </div>
              </>
            )}

            {/* Step 1: Content */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-end justify-between">
                    <Label htmlFor="title">Push Title *</Label>
                    <span className="text-[11px] text-muted-foreground">{watchedTitle?.length ?? 0}/{TITLE_MAX_CHARS}</span>
                  </div>
                  <Input id="title" placeholder="Fresh inventory in your city" {...form.register("title")} className="mt-1.5" maxLength={TITLE_MAX_CHARS} />
                  {form.formState.errors.title && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-end justify-between">
                    <Label htmlFor="subtitle">Subtitle (iOS)</Label>
                    <span className="text-[11px] text-muted-foreground">{watchedSubtitle?.length ?? 0}/{SUBTITLE_MAX_CHARS}</span>
                  </div>
                  <Input id="subtitle" placeholder="Optional iOS subtitle" {...form.register("subtitle")} className="mt-1.5" maxLength={SUBTITLE_MAX_CHARS} />
                </div>
                <div>
                  <div className="flex items-end justify-between">
                    <Label htmlFor="body">Message Body *</Label>
                    <span className="text-[11px] text-muted-foreground">{watchedBody?.length ?? 0}/{BODY_MAX_CHARS}</span>
                  </div>
                  <Textarea id="body" placeholder="Your notification message…" {...form.register("body")} className="mt-1.5 min-h-[100px]" maxLength={BODY_MAX_CHARS} />
                  {form.formState.errors.body && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.body.message}</p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="ctaLabel">CTA Button Label</Label>
                    <Input id="ctaLabel" placeholder="View Now" {...form.register("ctaLabel")} className="mt-1.5" />
                    <div className="mt-4">
                      <Label htmlFor="deepLinkUrl">Deep Link URL</Label>
                      <Input id="deepLinkUrl" placeholder="openhouse://listing/123" {...form.register("deepLinkUrl")} className="mt-1.5" />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Optional custom scheme. For property redirects use the picker on the right.
                      </p>
                    </div>
                  </div>
                  <div>
                    {/* Hidden registered input keeps RHF field map in sync — required so
                        propertyCode is never dropped from handleSubmit data when only
                        form.setValue (no form.register) has been used. */}
                    <input type="hidden" {...form.register("propertyCode")} />
                    <PropertySearchPicker
                      value={form.watch("propertyCode") ?? ""}
                      onChange={(code) => form.setValue("propertyCode", code, { shouldValidate: true, shouldDirty: true, shouldTouch: true })}
                    />
                    {form.formState.errors.propertyCode && (
                      <p className="mt-1 text-xs text-destructive">{form.formState.errors.propertyCode.message}</p>
                    )}
                    {/* Warn when no property is selected — without propertyCode the FCM
                        payload has no data.type='property', so tapping the notification
                        will NOT deep-link to PropertyScreen on any app state. */}
                    {!form.watch("propertyCode")?.trim() && (
                      <div className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                        <strong>No property selected.</strong> Without a property, tapping this
                        notification will open the app but NOT navigate to a listing. Select a
                        property above to enable deep-link navigation.
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <Switch
                    checked={form.watch("silent")}
                    onCheckedChange={(v) => form.setValue("silent", v)}
                    id="silent"
                  />
                  <div>
                    <Label htmlFor="silent" className="cursor-pointer">Silent Notification</Label>
                    <p className="text-xs text-muted-foreground">Delivers without alert sound or banner</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Audience */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {/* Audience type selector cards */}
                <div>
                  <Label className="mb-2 block">Audience Type</Label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {AUDIENCE_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => form.setValue("audienceType", o.value as FullCampaignInput["audienceType"])}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition",
                          watchedAudienceType === o.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paste FCM tokens manually */}
                {watchedAudienceType === "manual" && (
                  <div className="space-y-2">
                    <div className="flex items-end justify-between">
                      <Label htmlFor="manualTokens">FCM Tokens</Label>
                      <span className="text-[11px] text-muted-foreground">
                        {(form.watch("manualTokens") ?? "").split(/[\n,]+/).filter((t) => t.trim().length >= 20).length} valid tokens
                      </span>
                    </div>
                    <Textarea
                      id="manualTokens"
                      placeholder={"Paste FCM tokens here — one per line or comma-separated:\n\neABCDEFGH...\nfXYZ1234...\n..."}
                      {...form.register("manualTokens")}
                      className="min-h-[160px] font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Each token must be at least 20 characters. Duplicates are removed automatically.
                    </p>
                  </div>
                )}

                {/* CSV file upload */}
                {watchedAudienceType === "csv_cp_ids" && (
                  <div className="space-y-3">
                    <Label>CSV / TXT File</Label>
                    <p className="text-xs text-muted-foreground">
                      One FCM token per line. Multi-column CSVs are supported — first column or a column named &quot;token&quot; is used.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt,text/csv,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        setCsvFile(file)
                        e.target.value = ""
                      }}
                    />
                    {csvFile ? (
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                        <FileText className="size-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{csvFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(csvFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCsvFile(null)}
                          className="rounded p-1 hover:bg-muted"
                        >
                          <X className="size-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 text-center transition hover:border-primary/40 hover:bg-muted/20"
                      >
                        <Upload className="size-6 text-muted-foreground" />
                        <span className="text-sm font-medium">Click to upload CSV</span>
                        <span className="text-xs text-muted-foreground">.csv or .txt · max 20 MB</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Topic-based broadcast info cards */}
                {(watchedAudienceType === "all_users" || watchedAudienceType === "all_brokers") && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        Firebase Topic
                      </span>
                      <code className="text-xs font-mono text-emerald-800">
                        {watchedAudienceType === "all_users" ? "all-users" : "all-brokers"}
                      </code>
                    </div>
                    <p className="font-semibold text-emerald-900">
                      {watchedAudienceType === "all_users" ? "Send to All Users" : "Send to All Brokers"}
                    </p>
                    <p className="text-xs text-emerald-800">
                      Delivered via Firebase Topic Messaging — Firebase fans this out to every device
                      subscribed to this topic. No token fetching required.
                      Make sure your mobile app subscribes on login:
                    </p>
                    <pre className="rounded bg-emerald-900/10 p-2 text-[11px] font-mono text-emerald-900 whitespace-pre-wrap">{`await messaging().subscribeToTopic('${watchedAudienceType === "all_users" ? "all-users" : "all-brokers"}');`}</pre>
                  </div>
                )}

                {watchedAudienceType === "segment" && (
                  <div>
                    <Label htmlFor="segmentId">Saved Segment</Label>
                    <Select value={form.watch("segmentId") ?? ""} onValueChange={(v) => form.setValue("segmentId", v)}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose a segment…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEG-001">High-Value Mumbai Brokers (1,240)</SelectItem>
                        <SelectItem value="SEG-002">Inactive Brokers - 30 days (3,820)</SelectItem>
                        <SelectItem value="SEG-003">Android Users - Tier 1 Cities (8,400)</SelectItem>
                        <SelectItem value="SEG-004">Agency Brokers - High Listing (560)</SelectItem>
                        <SelectItem value="SEG-005">New Joiners - 7 days (142)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Schedule */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label>Schedule Type</Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {SCHEDULE_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => form.setValue("scheduleType", o.value as FullCampaignInput["scheduleType"])}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition",
                          watchedScheduleType === o.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                {watchedScheduleType === "scheduled" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="scheduledAt">Date & Time</Label>
                      <Input id="scheduledAt" type="datetime-local" {...form.register("scheduledAt")} className="mt-1.5" />
                      {form.formState.errors.scheduledAt && (
                        <p className="mt-1 text-xs text-destructive">{form.formState.errors.scheduledAt.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Timezone</Label>
                      <Select value={form.watch("timezone")} onValueChange={(v) => form.setValue("timezone", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                {watchedScheduleType === "instant" && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                    Campaign will be queued for immediate delivery after confirmation.
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="grid gap-3 text-sm">
                  {[
                    { label: "Campaign Name", value: form.getValues("name") || "—" },
                    { label: "Type", value: form.getValues("notificationType") },
                    { label: "Platform", value: form.getValues("platform") },
                    { label: "Priority", value: form.getValues("priority") },
                    { label: "Title", value: form.getValues("title") || "—" },
                    { label: "Body", value: form.getValues("body") || "—" },
                    {
                      label: "Audience",
                      value: (() => {
                        const at = form.getValues("audienceType")
                        if (at === "csv_cp_ids") return csvFile ? `CSV — ${csvFile.name}` : "CSV (no file attached)"
                        if (at === "manual") {
                          const count = (form.getValues("manualTokens") ?? "").split(/[\n,]+/).filter((t) => t.trim().length >= 20).length
                          return `Pasted tokens (${count})`
                        }
                        if (at === "all_users") return "All Users"
                        return at
                      })(),
                    },
                    { label: "Deep link", value: form.getValues("deepLinkUrl")?.trim() || "—" },
                    {
                      label: "Property code",
                      value: form.getValues("propertyCode")?.trim() || "—",
                    },
                    { label: "Schedule", value: form.getValues("scheduleType") },
                  ].map((row) => (
                    <div key={row.label} className="flex gap-4">
                      <span className="w-32 shrink-0 text-muted-foreground">{row.label}</span>
                      <span className="font-medium text-foreground line-clamp-2">{row.value}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700">
                  <strong>Ready to launch.</strong> Clicking &quot;Launch Campaign&quot; will create the campaign and queue
                  FCM notifications for immediate dispatch via the worker process.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={goPrev}>
                Back
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={handleSaveDraft}>
              <Save className="mr-1 size-3.5" />
              Save Draft
            </Button>
          </div>
          {isLastStep ? (
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Send className="mr-2 size-4" />
              )}
              Launch Campaign
            </Button>
          ) : (
            <Button type="button" onClick={goNext}>
              Continue
            </Button>
          )}
        </div>
      </form>

      {/* Live preview sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>Updates as you type</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-5">
            <MobilePreview
              title={watchedTitle || ""}
              subtitle={watchedSubtitle}
              body={watchedBody || ""}
              ctaLabel={watchedCta}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
