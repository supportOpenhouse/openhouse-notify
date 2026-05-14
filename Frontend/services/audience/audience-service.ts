import { mockSegments, mockBrokers } from "@/lib/data/mock-audience"
import { AudienceSegment, ConditionGroup, SegmentPreviewResult } from "@/lib/types/audience"
import { withSimulatedLatency } from "@/services/mock-api/delay"

export async function getSegmentsService(): Promise<AudienceSegment[]> {
  return withSimulatedLatency(() => mockSegments, { minMs: 200, maxMs: 500 })
}

export async function getSegmentByIdService(id: string): Promise<AudienceSegment> {
  return withSimulatedLatency(
    () => {
      const seg = mockSegments.find((s) => s.id === id)
      if (!seg) throw new Error(`Segment ${id} not found`)
      return seg
    },
    { minMs: 150, maxMs: 350 }
  )
}

export async function estimateAudienceService(conditionGroup: ConditionGroup): Promise<{ estimatedSize: number; reachableTokens: number }> {
  return withSimulatedLatency(
    () => {
      const base = 1000 + Math.floor(Math.random() * 9000)
      return { estimatedSize: base, reachableTokens: Math.floor(base * (0.88 + Math.random() * 0.1)) }
    },
    { minMs: 600, maxMs: 1400 }
  )
}

export async function previewSegmentService(conditionGroup: ConditionGroup): Promise<SegmentPreviewResult> {
  return withSimulatedLatency(
    () => ({
      totalMatched: mockBrokers.length,
      reachableTokens: mockBrokers.filter((b) => b.fcmTokenCount > 0).length,
      brokers: mockBrokers.slice(0, 5),
      breakdownByCity: [
        { city: "Mumbai", count: 1240 },
        { city: "Bengaluru", count: 980 },
        { city: "Delhi", count: 820 },
        { city: "Noida", count: 540 },
        { city: "Hyderabad", count: 480 },
      ],
      breakdownByPlatform: [
        { platform: "Android", count: 8400 },
        { platform: "iOS", count: 3200 },
      ],
    }),
    { minMs: 500, maxMs: 1000 }
  )
}

export async function createSegmentService(input: Omit<AudienceSegment, "id" | "createdAt" | "updatedAt" | "lastCalculatedAt" | "estimatedSize" | "reachableTokens" | "usageCount">): Promise<AudienceSegment> {
  return withSimulatedLatency(
    () => ({
      ...input,
      id: `SEG-${Date.now()}`,
      estimatedSize: 1200,
      reachableTokens: 1100,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastCalculatedAt: new Date().toISOString(),
    }),
    { minMs: 400, maxMs: 800 }
  )
}

export async function deleteSegmentService(id: string): Promise<{ success: boolean }> {
  return withSimulatedLatency(() => ({ success: true }), { minMs: 200, maxMs: 400 })
}
