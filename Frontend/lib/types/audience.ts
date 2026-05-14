export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "in"
  | "not_in"
  | "is_empty"
  | "is_not_empty"

export type FilterConditionType = "string" | "number" | "date" | "boolean" | "enum"

export type FilterField = {
  key: string
  label: string
  type: FilterConditionType
  operators: FilterOperator[]
  options?: { label: string; value: string }[]
}

export type FilterCondition = {
  id: string
  field: string
  operator: FilterOperator
  value: string | string[] | number | boolean | null
}

export type ConditionGroup = {
  id: string
  logic: "AND" | "OR"
  conditions: FilterCondition[]
  groups?: ConditionGroup[]
}

export type AudienceSegment = {
  id: string
  name: string
  description?: string
  conditionGroup: ConditionGroup
  estimatedSize: number
  reachableTokens: number
  lastCalculatedAt: string
  createdBy: string
  createdAt: string
  updatedAt: string
  tags: string[]
  isFavorite: boolean
  usageCount: number
}

export type BrokerProfile = {
  id: string
  cpId: string
  name: string
  phone: string
  city: string
  state: string
  brokerType: "individual" | "agency" | "builder"
  platform: "android" | "ios"
  appVersion: string
  lastActiveAt: string
  engagementLevel: "high" | "medium" | "low" | "inactive"
  language: string
  fcmTokenCount: number
  tags: string[]
}

export type SegmentPreviewResult = {
  totalMatched: number
  reachableTokens: number
  brokers: BrokerProfile[]
  breakdownByCity: { city: string; count: number }[]
  breakdownByPlatform: { platform: string; count: number }[]
}
