"use client"

import * as React from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, Loader2, Users } from "lucide-react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCreateSegment, useEstimateAudience } from "@/hooks/use-audience"
import { cn } from "@/lib/utils"
import type { Resolver } from "react-hook-form"

// ─── Field definitions ────────────────────────────────────────────────────────

type FieldDef = {
  key: string
  label: string
  type: "enum" | "number" | "days"
  operators: { label: string; value: string }[]
  options?: { label: string; value: string }[]
  placeholder?: string
}

const FIELDS: FieldDef[] = [
  {
    key: "city",
    label: "City",
    type: "enum",
    operators: [
      { label: "is", value: "equals" },
      { label: "is any of", value: "in" },
      { label: "is not", value: "not_equals" },
    ],
    options: [
      { label: "Mumbai", value: "Mumbai" },
      { label: "Delhi", value: "Delhi" },
      { label: "Bengaluru", value: "Bengaluru" },
      { label: "Hyderabad", value: "Hyderabad" },
      { label: "Noida", value: "Noida" },
      { label: "Gurgaon", value: "Gurgaon" },
      { label: "Chennai", value: "Chennai" },
      { label: "Pune", value: "Pune" },
    ],
  },
  {
    key: "platform",
    label: "Platform",
    type: "enum",
    operators: [
      { label: "is", value: "equals" },
      { label: "is not", value: "not_equals" },
    ],
    options: [
      { label: "Android", value: "android" },
      { label: "iOS", value: "ios" },
    ],
  },
  {
    key: "engagementLevel",
    label: "Engagement Level",
    type: "enum",
    operators: [
      { label: "is", value: "equals" },
      { label: "is any of", value: "in" },
    ],
    options: [
      { label: "High", value: "high" },
      { label: "Medium", value: "medium" },
      { label: "Low", value: "low" },
      { label: "Inactive", value: "inactive" },
    ],
  },
  {
    key: "brokerType",
    label: "Broker Type",
    type: "enum",
    operators: [
      { label: "is", value: "equals" },
      { label: "is any of", value: "in" },
    ],
    options: [
      { label: "Individual", value: "individual" },
      { label: "Agency", value: "agency" },
      { label: "Builder", value: "builder" },
    ],
  },
  {
    key: "lastActiveAt",
    label: "Last Active (days ago)",
    type: "days",
    operators: [
      { label: "more than", value: "greater_than" },
      { label: "less than", value: "less_than" },
    ],
    placeholder: "e.g. 30",
  },
  {
    key: "createdAt",
    label: "Joined (days ago)",
    type: "days",
    operators: [
      { label: "within last", value: "less_than" },
      { label: "more than", value: "greater_than" },
    ],
    placeholder: "e.g. 7",
  },
]

// ─── Schema ───────────────────────────────────────────────────────────────────

const conditionSchema = z.object({
  field: z.string().min(1, "Choose a field"),
  operator: z.string().min(1, "Choose an operator"),
  value: z.string().min(1, "Value is required"),
})

const segmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  description: z.string().max(200).optional(),
  logic: z.enum(["AND", "OR"]),
  conditions: z.array(conditionSchema).min(1, "Add at least one condition"),
  tags: z.string().optional(),
})

type SegmentFormInput = z.infer<typeof segmentSchema>

// ─── Condition row ────────────────────────────────────────────────────────────

function ConditionRow({
  index,
  control,
  watch,
  setValue,
  onRemove,
  canRemove,
}: {
  index: number
  control: ReturnType<typeof useForm<SegmentFormInput>>["control"]
  watch: ReturnType<typeof useForm<SegmentFormInput>>["watch"]
  setValue: ReturnType<typeof useForm<SegmentFormInput>>["setValue"]
  onRemove: () => void
  canRemove: boolean
}) {
  const fieldKey = watch(`conditions.${index}.field`)
  const fieldDef = FIELDS.find((f) => f.key === fieldKey)

  return (
    <div className="flex items-start gap-2">
      <div className="grid flex-1 gap-2 sm:grid-cols-3">
        {/* Field selector */}
        <Controller
          name={`conditions.${index}.field`}
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v)
                  setValue(`conditions.${index}.operator`, "")
                  setValue(`conditions.${index}.value`, "")
                }}
              >
                <SelectTrigger className={cn("h-8 text-xs", fieldState.error && "border-destructive")}>
                  <SelectValue placeholder="Select field…" />
                </SelectTrigger>
                <SelectContent>
                  {FIELDS.map((f) => (
                    <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && <p className="mt-0.5 text-[11px] text-destructive">{fieldState.error.message}</p>}
            </div>
          )}
        />

        {/* Operator selector */}
        <Controller
          name={`conditions.${index}.operator`}
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!fieldDef}
              >
                <SelectTrigger className={cn("h-8 text-xs", fieldState.error && "border-destructive")}>
                  <SelectValue placeholder="Operator…" />
                </SelectTrigger>
                <SelectContent>
                  {(fieldDef?.operators ?? []).map((op) => (
                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && <p className="mt-0.5 text-[11px] text-destructive">{fieldState.error.message}</p>}
            </div>
          )}
        />

        {/* Value input / select */}
        <Controller
          name={`conditions.${index}.value`}
          control={control}
          render={({ field, fieldState }) => (
            <div>
              {fieldDef?.options ? (
                <Select value={field.value} onValueChange={field.onChange} disabled={!fieldDef}>
                  <SelectTrigger className={cn("h-8 text-xs", fieldState.error && "border-destructive")}>
                    <SelectValue placeholder="Value…" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldDef.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  {...field}
                  placeholder={fieldDef?.placeholder ?? "Value…"}
                  type={fieldDef?.type === "days" ? "number" : "text"}
                  className={cn("h-8 text-xs", fieldState.error && "border-destructive")}
                  disabled={!fieldDef}
                />
              )}
              {fieldState.error && <p className="mt-0.5 text-[11px] text-destructive">{fieldState.error.message}</p>}
            </div>
          )}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        disabled={!canRemove}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewSegmentSheet({ open, onOpenChange }: Props) {
  const createMutation = useCreateSegment()
  const estimateMutation = useEstimateAudience()

  const form = useForm<SegmentFormInput>({
    resolver: zodResolver(segmentSchema) as Resolver<SegmentFormInput>,
    defaultValues: {
      name: "",
      description: "",
      logic: "AND",
      conditions: [{ field: "", operator: "", value: "" }],
      tags: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "conditions",
  })

  const logic = form.watch("logic")

  const handleEstimate = () => {
    const conditions = form.getValues("conditions").filter((c) => c.field && c.operator && c.value)
    if (conditions.length === 0) {
      toast.error("Add at least one complete condition to estimate")
      return
    }
    estimateMutation.mutate(
      {
        id: "preview",
        logic: form.getValues("logic"),
        conditions: conditions.map((c, i) => ({ id: String(i), field: c.field, operator: c.operator as any, value: c.value })),
      },
      {
        onSuccess: (r) =>
          toast.info(`~${r.estimatedSize.toLocaleString()} matched · ${r.reachableTokens.toLocaleString()} reachable tokens`),
      }
    )
  }

  const onSubmit = (data: SegmentFormInput) => {
    createMutation.mutate(
      {
        name: data.name,
        description: data.description,
        conditionGroup: {
          id: `cg-${Date.now()}`,
          logic: data.logic,
          conditions: data.conditions.map((c, i) => ({
            id: String(i),
            field: c.field,
            operator: c.operator as any,
            value: c.value,
          })),
        },
        isFavorite: false,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        createdBy: "Admin",
      },
      {
        onSuccess: () => {
          toast.success(`Segment "${data.name}" created`)
          form.reset()
          onOpenChange(false)
        },
        onError: () => toast.error("Failed to create segment"),
      }
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle>New Audience Segment</SheetTitle>
          <SheetDescription>
            Define filter conditions to target a specific group of brokers
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <form id="segment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6 py-5">

            {/* Name & description */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="seg-name">Segment Name *</Label>
                <Input
                  id="seg-name"
                  placeholder="e.g. High-Value Mumbai Brokers"
                  {...form.register("name")}
                  className="mt-1.5"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="seg-desc">Description</Label>
                <Input
                  id="seg-desc"
                  placeholder="Optional internal description"
                  {...form.register("description")}
                  className="mt-1.5"
                />
              </div>
            </div>

            <Separator />

            {/* Condition builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Conditions</Label>
                {/* AND / OR toggle */}
                <div className="flex gap-0 rounded-lg border border-border bg-muted/50 p-0.5 text-xs">
                  {(["AND", "OR"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => form.setValue("logic", l)}
                      className={cn(
                        "rounded-md px-3 py-1 font-semibold transition-all",
                        logic === l
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Brokers must match <strong>{logic === "AND" ? "all" : "any"}</strong> of the following conditions
              </p>

              <div className="space-y-2.5">
                {fields.map((field, index) => (
                  <React.Fragment key={field.id}>
                    {index > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {logic}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    <ConditionRow
                      index={index}
                      control={form.control}
                      watch={form.watch}
                      setValue={form.setValue}
                      onRemove={() => remove(index)}
                      canRemove={fields.length > 1}
                    />
                  </React.Fragment>
                ))}
              </div>

              {form.formState.errors.conditions?.root && (
                <p className="text-xs text-destructive">{form.formState.errors.conditions.root.message}</p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ field: "", operator: "", value: "" })}
                className="w-full border-dashed"
              >
                <Plus className="mr-1.5 size-3.5" />
                Add Condition
              </Button>
            </div>

            <Separator />

            {/* Tags */}
            <div>
              <Label htmlFor="seg-tags">Tags (comma-separated)</Label>
              <Input
                id="seg-tags"
                placeholder="mumbai, high-value, q2-campaign"
                {...form.register("tags")}
                className="mt-1.5"
              />
            </div>

            {/* Live estimate */}
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="size-4 text-muted-foreground" />
                  {estimateMutation.data ? (
                    <span>
                      <span className="font-semibold text-foreground">
                        ~{estimateMutation.data.estimatedSize.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}matched · {estimateMutation.data.reachableTokens.toLocaleString()} reachable
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Estimate audience size</span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEstimate}
                  disabled={estimateMutation.isPending}
                >
                  {estimateMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Estimate"}
                </Button>
              </div>
            </div>
          </form>
        </ScrollArea>

        <SheetFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="segment-form" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Create Segment
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
